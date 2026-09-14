"""Safe, deterministic server-side LaTeX math rendering to vector SVG.

Pipeline
--------

    LaTeX snippet
        -> normalize_math()      strip delimiters, tidy non-breaking spaces
        -> matplotlib.mathtext   tiny embedded TeX parser (shipped with
                                 matplotlib, no system TeX required)
        -> SVG markup            text is converted to font-independent paths
        -> <img> HTML fragment   embedded as a data URI for the PDF renderer

Design constraints honoured here:

* Deterministic, offline, no browser and no external CDN at render time.
* SVG (vector) output keeps equations sharp at print resolution.
* Matplotlib runs under a module lock (matplotlib is not thread-safe).
* Malformed or oversized input *never* raises out of ``render_math``: it
  degrades to an HTML-escaped, visibly styled fallback so one bad equation
  cannot destroy a 20-page mock exam.
* Expression length is capped to bound CPU/memory usage per document.
"""
from __future__ import annotations

import io
import logging
import re
import urllib.parse
from html import escape
from threading import RLock

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Limits ---------------------------------------------------------------------
# ---------------------------------------------------------------------------

#: Hard cap on the length of one math expression (LaTeX source characters).
MAX_MATH_LENGTH = 2000
#: Hard cap on the total number of equations rendered for a single document.
MAX_EQUATIONS_PER_DOCUMENT = 600
#: Fonts/reference sizes.  Body math matches 10.5pt body text; display math
#: is rendered a size larger for emphasis.
_INLINE_FONT_SIZE = 10.5
_DISPLAY_FONT_SIZE = 11.75
_DPI = 72

_INLINE_COLOR = "#22303c"
_DISPLAY_COLOR = "#1e293b"

#: Recognised math delimiters: $$..$$ then $..$, \\(..\\), \\[..\\].
_MATH_TOKEN = re.compile(
    r"(\$\$[^$\n]+?\$\$|\$[^$\n]+?\$|\\\(.*?\\\)|\\\[.*?\\\])",
    re.DOTALL,
)

#: Matplotlib is not thread-safe; serialise all figure usage.
_RENDER_LOCK = RLock()

#: Per-document equation budget shared with the html renderer.
_EQUATIONS_RENDERED = [0]
def split_math(text):
    """Split ``text`` into ``(is_math, token)`` chunks preserving order.

    Even-indexed chunks are plain text, odd-indexed ones are math spans that
    still contain their original delimiters (``$..$``, ``\\(..\\)``, ...).
    """
    parts = _MATH_TOKEN.split(str(text or ""))
    tokens = []
    for index, part in enumerate(parts):
        if not part:
            continue
        tokens.append((index % 2 == 1, part))
    return tokens


#: Commands that matplotlib's mathtext does not support but are common in
#: educational LaTeX.  We replace them with compatible equivalents so the
#: SVG renderer succeeds instead of falling back.
_TEXT_CMD = re.compile(r"\\text(?:rm|bf|it)?\{([^}]*)\}")
_OPERATORNAME = re.compile(r"\\operatorname\{([^}]*)\}")


def _sanitize_for_mathtext(expr):
    """Rewrite unsupported LaTeX commands into mathtext-compatible forms.

    * ``\\text{kg}``, ``\\mathrm{kg}`` → ``\\rm{kg}``
    * ``\\operatorname{sin}`` → ``\\sin`` (if known) or ``\\rm{sin}``
    * ``\\textbf{x}`` → ``\\bf{x}``
    * ``\\textit{x}`` → ``\\it{x}``
    """
    # \\textbf / \\textit → \\bf / \\it
    expr = re.sub(r"\\textbf\{([^}]*)\}", r"\\bf{\1}", expr)
    expr = re.sub(r"\\textit\{([^}]*)\}", r"\\it{\1}", expr)
    # \\text{} / \\textrm{} / \\mathrm{} → \\rm{}
    expr = _TEXT_CMD.sub(r"\\rm{\1}", expr)
    # \\operatorname{sin} → \\sin if it's a known function
    _KNOWN_OPS = {
        "sin", "cos", "tan", "log", "ln", "exp", "lim", "max", "min",
        "sup", "inf", "det", "dim", "gcd", "deg", "arg",
    }
    def _replace_op(m):
        name = m.group(1)
        if name in _KNOWN_OPS:
            return "\\" + name
        return "\\rm{%s}" % name
    expr = _OPERATORNAME.sub(_replace_op, expr)
    return expr


def normalize_math(source, display=False):
    """Return the inner LaTeX source of a math snippet without delimiters.

    Accepts ``$..$``, ``$$..$$``, ``\\\\(..\\\\)`` and ``\\\\[..\\\\]`` plus a bare
    LaTeX body.  A bare ``~`` (the LaTeX non-breaking space) becomes a regular
    space so unit expressions such as ``3.0 \\\\times 10^8~m/s`` survive.

    Unsupported LaTeX commands (``\\\\text{}``, ``\\\\operatorname{}``, etc.)
    are rewritten into matplotlib mathtext-compatible forms.
    """
    value = str(source or "").strip()
    if value.startswith("$$") and value.endswith("$$"):
        value = value[2:-2]
    elif len(value) >= 4 and value.startswith(r"\(") and value.endswith(r"\)"):
        value = value[2:-2]
    elif len(value) >= 4 and value.startswith(r"\[") and value.endswith(r"\]"):
        value = value[2:-2]
    elif len(value) >= 2 and value.startswith("$") and value.endswith("$"):
        value = value[1:-1]
    value = value.replace("~", " ").strip()
    return _sanitize_for_mathtext(value)



def render_math(source, display=False, font_size=None):
    """Render a LaTeX math expression to an HTML math fragment (safe).

    Returns an inline ``<span class="math"><img .../></span>`` fragment or a
    block-level ``<div class="equation equation-display">`` for display math.
    On any failure the original expression is returned inside a styled,
    HTML-escaped fallback block so the surrounding document still generates.
    """
    expr = normalize_math(source, display)
    if not expr:
        return ""
    if len(expr) > MAX_MATH_LENGTH:
        logger.warning("Math expression exceeds %d chars; using fallback", MAX_MATH_LENGTH)
        return _fallback_html(expr, display)
    if _EQUATIONS_RENDERED[0] >= MAX_EQUATIONS_PER_DOCUMENT:
        logger.warning("Equation budget exhausted; using fallback")
        return _fallback_html(expr, display)
    try:
        svg, width_pt, height_pt = _render_to_svg(
            expr,
            font_size if font_size else (_DISPLAY_FONT_SIZE if display else _INLINE_FONT_SIZE),
            _DISPLAY_COLOR if display else _INLINE_COLOR,
        )
    except Exception as exc:  # noqa: BLE001 -- mathtext raises broadly
        logger.debug("Math render failed for %r: %s", expr[:200], exc)
        return _fallback_html(expr, display)
    _EQUATIONS_RENDERED[0] += 1
    return _img_html(svg, width_pt, height_pt, expr, display)


def reset_equation_counter():
    """Reset the per-document equation budget (called at document start)."""
    _EQUATIONS_RENDERED[0] = 0


def _img_html(svg, width_pt, height_pt, source, display):
    """Embed an SVG string as a data-URI image sized in points."""
    data_uri = "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg, safe="")
    img = (
        '<img class="math-img" src="%s" style="width:%.2fpt;height:%.2fpt" '
        'width="%.2f" height="%.2f" alt="%s"/>'
        % (data_uri, width_pt, height_pt, width_pt, height_pt, escape(source))
    )
    if display:
        return '<div class="equation equation-display">%s</div>' % img
    return '<span class="math">%s</span>' % img


def _fallback_html(expr, display):
    """Styled, escaped fallback for equations that cannot be rendered."""
    body = '<code class="math-fallback">%s</code>' % escape(expr)
    if display:
        return '<div class="equation equation-display">%s</div>' % body
    return body


def _render_to_svg(source, font_size, color):
    """Convert ``source`` (bare LaTeX) to (svg_string, width_pt, height_pt).

    Text is saved through matplotlib's SVG backend, which emits glyph
    outlines as vector paths -- the final PDF is therefore font-independent
    and always crisp.
    """
    with _RENDER_LOCK:
        from matplotlib import rcParams
        from matplotlib.backends.backend_agg import FigureCanvasAgg
        from matplotlib.figure import Figure

        rcParams["mathtext.fontset"] = "cm"
        fig = Figure(figsize=(1, 1), dpi=_DPI)
        FigureCanvasAgg(fig)
        try:
            fig.text(0, 0, "$%s$" % source, fontsize=float(font_size), color=color)
            buffer = io.StringIO()
            fig.savefig(
                buffer,
                format="svg",
                dpi=_DPI,
                transparent=True,
                bbox_inches="tight",
                pad_inches=0.02,
            )
        finally:
            fig.clear()
        svg = buffer.getvalue()
    width_pt = _extract_pt(svg, "width")
    height_pt = _extract_pt(svg, "height")
    if not width_pt or not height_pt:
        raise ValueError("matplotlib returned an SVG without explicit size")
    return svg, width_pt, height_pt


def _extract_pt(svg, attribute):
    match = re.search(r'%s="([0-9.]+)pt"' % attribute, svg[:800])
    return float(match.group(1)) if match else 0.0