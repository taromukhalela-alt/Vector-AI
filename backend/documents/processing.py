"""Safe, dependency-light conversion of markdown-like content to document IR."""
import html
import re

from .schemas import DocumentIR

# A single LaTeX math span.  The doubled-``$`` alternative must come first so
# a ``$$...$$`` display span is not mis-read as two separate ``$...$`` spans.
_MATH_SPAN = re.compile(r"(\$\$[^$]+\$\$|\$[^$\n]+\$|\\\(.*?\\\)|\\\[.*?\\\])")

# Markdown emphasis markers that make no sense once math delimiters are gone.
_MARKDOWN_EMPHASIS = re.compile(r"[*_`~]")


def clean_math_delimiters(value):
    """Return the inner LaTeX source of a math span, discarding its delimiters.

    A bare ``~`` (the LaTeX non-breaking space) is converted to a regular
    space so unit expressions such as ``10^8~m/s`` survive plain-text PDF
    rendering instead of being silently joined as ``10^8m/s``.
    """
    value = str(value or "").strip()
    if value.startswith("$$") and value.endswith("$$"):
        value = value[2:-2]
    elif len(value) >= 4 and value.startswith(r"\(") and value.endswith(r"\)"):
        value = value[2:-2]
    elif len(value) >= 4 and value.startswith(r"\[") and value.endswith(r"\]"):
        value = value[2:-2]
    elif len(value) >= 2 and value.startswith("$") and value.endswith("$"):
        value = value[1:-1]
    return value.replace("~", " ").strip()


def clean_math_spans(value):
    """Remove LaTeX math delimiters while keeping the math source intact.

    ``"Use $E_k$."`` becomes ``"Use E_k."``.  Markdown emphasis markers are
    left untouched so callers can decide how much formatting to strip.
    """
    value = str(value or "")
    if _MATH_SPAN.search(value) is None:
        return value
    return "".join(
        clean_math_delimiters(part) if index % 2 else part
        for index, part in enumerate(_MATH_SPAN.split(value))
    )


def equation_text(value):
    """Return block-level LaTeX source with any surrounding delimiters removed."""
    return clean_math_delimiters(str(value or ""))


def plain_text(value):
    """Strip markdown emphasis while preserving LaTeX math source.

    Emphasis markers (``*``, ``_``, backticks, ``~``) are stripped only from
    non-math segments; text inside ``$...$`` / ``$$...$$`` / ``\\(...\\)`` /
    ``\\[...\\]`` spans keeps its LaTeX source (subscripts, ``\\frac``, ...)
    so formulas are not corrupted when rendered without a math engine.
    """
    value = html.unescape(str(value or ""))
    if _MATH_SPAN.search(value) is None:
        return _MARKDOWN_EMPHASIS.sub("", value).strip()
    return "".join(
        _MARKDOWN_EMPHASIS.sub("", part) if index % 2 == 0 else clean_math_delimiters(part)
        for index, part in enumerate(_MATH_SPAN.split(value))
    ).strip()


def content_to_ir(title, content, theme="default", metadata=None):
    blocks = []
    paragraph = []

    def flush_paragraph():
        if paragraph:
            blocks.append({"type": "paragraph", "text": "\n".join(paragraph)})
            paragraph.clear()

    lines = content.strip().splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        first = line.strip()
        if not first:
            flush_paragraph()
            index += 1
            continue
        if first.startswith("```"):
            flush_paragraph()
            language = first[3:].strip().lower()
            index += 1
            body = []
            while index < len(lines) and not lines[index].strip().startswith("```"):
                body.append(lines[index])
                index += 1
            if index < len(lines):
                index += 1
            if language == "mermaid":
                blocks.append({"type": "diagram", "source": "\n".join(body)})
            else:
                blocks.append({"type": "code", "text": "\n".join(body)})
            continue
        if first.startswith("$$") or first.startswith("\\["):
            flush_paragraph()
            opener = 2
            closer = "$$" if first.startswith("$$") else "\\]"
            equation = first[opener:]
            if equation.endswith(closer):
                equation = equation[:-2]
                # Advances past the fully-closed single-line equation. Without
                # this the while-loop re-processes the same line forever.
                index += 1
            else:
                index += 1
                body = []
                while index < len(lines) and not lines[index].strip().endswith(closer):
                    body.append(lines[index])
                    index += 1
                if index < len(lines):
                    body.append(lines[index].strip()[:-2])
                    index += 1
                equation = "\n".join([equation] + body)
            blocks.append({"type": "equation", "text": equation.strip()})
            continue
        if first.startswith("!["):
            flush_paragraph()
            match = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", first)
            blocks.append({
                "type": "diagram",
                "alt": match.group(1) if match else "",
                "src": match.group(2) if match else "",
            })
            index += 1
            continue
        if first.startswith("#"):
            flush_paragraph()
            level = len(first) - len(first.lstrip("#"))
            blocks.append({"type": "heading", "level": min(level, 6),
                           "text": first[level:].strip()})
            index += 1
            continue
        # Preserve inline math as an explicit block boundary.  This keeps
        # equations available to richer renderers without requiring a parser.
        # ``\\(...\\)`` uses a non-greedy body so formulas containing nested
        # parentheses, e.g. ``\\(f(x) = 2x\\)``, are still recognised.
        inline = re.split(r"(\$\$[^$]+\$\$|\\\(.*?\\\)|\\\[.*?\\\])", line)
        if len(inline) > 1:
            for part in inline:
                if not part:
                    continue
                if (part.startswith("$$") and part.endswith("$$")):
                    flush_paragraph()
                    blocks.append({"type": "equation", "text": part[2:-2].strip()})
                elif part.startswith(r"\[") and part.endswith(r"\]"):
                    flush_paragraph()
                    blocks.append({"type": "equation", "text": part[2:-2].strip()})
                elif part.startswith(r"\(") and part.endswith(r"\)"):
                    flush_paragraph()
                    blocks.append({"type": "equation", "text": part[2:-2].strip()})
                else:
                    paragraph.append(part)
        else:
            paragraph.append(line)
        index += 1
    flush_paragraph()
    return DocumentIR(title=title, blocks=blocks, theme=theme, metadata=metadata or {})
