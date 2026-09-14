"""Generate a clean backend/pdf/renderer.py.

Run:  python backend/pdf/_make_renderer.py

Using a Python generator avoids quoting/escaping issues with backslashes,
data-URI prefixes, and unicode characters when writing through the editor.
"""
from __future__ import annotations

import pathlib

OUT = pathlib.Path("backend/pdf/renderer.py")

PYEOF_MARKER = "# --- RERUN OK ---"
if OUT.read_text(encoding="utf-8").find(PYEOF_MARKER) != -1:
    print("renderer.py already reran; skipping regeneration")
    raise SystemExit(0)

# The template is assembled from parts to keep each edit small.
parts: list[str] = []
append = parts.append

# ---------------------------------------------------------------------------
# Preamble + imports
# ---------------------------------------------------------------------------
append(r'''"""Styled, print-first PDF renderer using WeasyPrint + server-side math SVG.

Architecture
------------

    AI content  ->  content_to_ir()  (documents.processing)
                  ->  render_html()   (this module)  IR -> styled HTML
                  ->  WeasyPrint      HTML + CSS -> A4 PDF bytes

Math is rendered to vector SVG by :mod:`backend.pdf.math` and embedded as
data-URI images so the final PDF is font-independent and crisp at print
resolution.  The whole pipeline is offline: no browser, no TeX binary and no
external CDN request are required at render time.

Design rules enforced here
~~~~~~~~~~~~~~~~~~~~~~~~~~~

* One canonical styled path -- the old dependency-free BuiltinPdfRenderer in
  :mod:`documents.renderers` remains untouched for the /api/documents/download
  contract; this module is the styled path used by the PDF-endpoint override.
* The HTML/CSS layer is the document layout layer; LaTeX is the math layer.
* A bad equation degrades to a styled fallback and never aborts the document.
* Temporary files are cleaned up even when rendering raises.
"""

from __future__ import annotations

import html as _html
import logging
import os
from typing import List, Optional

from ..documents.processing import DocumentIR, content_to_ir

logger = logging.getLogger(__name__)

try:
    from weasyprint import HTML as _WeasyHTML
    from weasyprint import CSS as _WeasyCSS
except (ImportError, OSError):
    _WeasyHTML = None
    _WeasyCSS = None

''')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
append(r'''

# ---------------------------------------------------------------------------
# Helpers --------------------------------------------------------------------
# ---------------------------------------------------------------------------

def _esc(value: Optional[str]) -> str:
    """Escape text for safe HTML insertion."""
    return _html.escape(str(value or ""), quote=False)


def _meta(document: DocumentIR, key: str, default: str = "") -> str:
    """Pull a metadata value off the document IR."""
    value = document.metadata.get(key, default)
    return str(value or default)

''')

# ---------------------------------------------------------------------------
# CSS
# ---------------------------------------------------------------------------
append(r'''

# ---------------------------------------------------------------------------
# CSS -----------------------------------------------------------------------
# ---------------------------------------------------------------------------

from .styles import ACCENTS, _BASE


def build_css(theme_name: str = "default") -> str:
    """Return the full stylesheet string for *theme_name*."""
    theme = ACCENTS.get(theme_name, ACCENTS["default"])
    _VAR = (
        ":root {\n"
        f"  --accent: {theme['accent']};\n"
        f"  --accent-strong: {theme['accent-strong']};\n"
        f"  --accent-soft: {theme['accent-soft']};\n"
        f"  --accent-line: {theme['accent-line']};\n"
        f"  --heading: {theme['heading']};\n"
        "}\n"
    )
    return _VAR + "\n" + _BASE

''')

OUT.write_text("".join(parts), encoding="utf-8")
print("wrote part 1", OUT.stat().st_size)
