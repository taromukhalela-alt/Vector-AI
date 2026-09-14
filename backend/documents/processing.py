"""Safe, dependency-light conversion of markdown-like content to document IR."""
import html
import re

from .schemas import DocumentIR

# A single LaTeX math span.  The doubled-``$`` alternative must come first so
# a ``$$...$$`` display span is not mis-read as two separate ``$...$`` spans.
_MATH_SPAN = re.compile(r"(\$\$[^$]+\$\$|\$[^$\n]+\$|\\\(.*?\\\)|\\\[.*?\\\])")

# Markdown emphasis markers that make no sense once math delimiters are gone.
_MARKDOWN_EMPHASIS = re.compile(r"[*_`~]")

#: Fenced blocks that map to styled PDF components instead of raw code.
CALLOUT_TYPES = {
    "definition", "formula", "example", "worked-example", "worked_example",
    "note", "tip", "warning", "question", "answer",
}

#: A table cell: everything up to an unescaped pipe.
_TABLE_CELL = re.compile(r"(?<!\\)\|")


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


def _parse_table_row(line):
    """Split one ``| a | b |`` table row into cleaned cells."""
    cells = _TABLE_CELL.split(line.strip())
    return [cell.strip() for cell in cells]


def _is_separator_row(cells):
    """True when a row only contains ``---`` / ``:--:`` alignment dashes."""
    return cells and all(re.fullmatch(r":?-{2,}:?", cell.strip() or "") for cell in cells)


def _parse_table(lines, index):
    """Consume consecutive pipe lines starting at ``index``.

    Tracks whether a header row was seen (i.e. the second row is a ``---``
    separator) and returns ``(block, next_index)``.
    """
    rows, seen_separator = [], False
    while index < len(lines):
        raw = lines[index].strip()
        if not raw.startswith("|"):
            break
        cells = _parse_table_row(raw)
        if _is_separator_row(cells):
            seen_separator = True
        else:
            rows.append(cells)
        index += 1
    if not rows:
        return None, index
    if seen_separator:
        headers, body_rows = rows[0], rows[1:]
    else:
        headers, body_rows = [], rows
    return {
        "type": "table",
        "headers": headers,
        "rows": body_rows,
    }, index


def _is_list_marker(first):
    return bool(re.match(r"^([-*+]|\d{1,3}\.)\s+\S", first))


def _parse_list(lines, index):
    ordered = bool(re.match(r"^\d{1,3}\.\s+", lines[index].lstrip()))
    items = []
    while index < len(lines):
        marker = re.match(r"^([-*+]|\d{1,3}\.)\s+(.*)$", lines[index].strip())
        if not marker:
            break
        items.append(marker.group(2).strip())
        index += 1
    return {"type": "list", "ordered": ordered, "items": items}, index


def content_to_ir(title, content, theme="default", metadata=None):
    """Convert markdown-like ``content`` to a structured document IR.

    Supported structures (all preserved for richer renderers):

    * headings ``#``..``######``
    * paragraphs with inline math (``$..$``, ``\\(..\\)``) and emphasis
    * display equations ``$$..$$`` / ``\\[..\\]`` (single or multi-line)
    * fenced blocks: `` ```mermaid`` diagrams, code, and callouts such as
      `` ```definition``, `` ```formula Title``, `` ```example``,
      `` ```question``, `` ```answer``, `` ```note``, `` ```tip``
    * pipe tables ``| a | b |`` (with optional ``---`` separator row)
    * unordered/ordered lists
    * thematic breaks ``---`` / ``***``
    * image links ``![alt](src)`` as ``diagram`` blocks

    ``metadata`` may carry a structured ``sections`` list (Phase-14 style);
    when present it is flattened into ordinary blocks so every renderer uses
    exactly one IR.
    """
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
            index = _parse_fence(lines, index, first, blocks, flush_paragraph)
            continue
        if first.startswith("$$") or first.startswith(r"\["):
            index = _parse_equation(lines, index, first, blocks, flush_paragraph)
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
        if first.startswith("|"):
            flush_paragraph()
            block, index = _parse_table(lines, index)
            if block:
                blocks.append(block)
            continue
        if first in ("---", "***", "___"):
            flush_paragraph()
            blocks.append({"type": "rule"})
            index += 1
            continue
        if first.startswith("#"):
            flush_paragraph()
            level = len(first) - len(first.lstrip("#"))
            blocks.append({"type": "heading", "level": min(level, 6),
                           "text": first[level:].strip()})
            index += 1
            continue
        if _is_list_marker(first):
            flush_paragraph()
            block, index = _parse_list(lines, index)
            blocks.append(block)
            continue
        # Preserve inline math as an explicit block boundary.  This keeps
        # equations available to richer renderers without requiring a parser.
        inline = re.split(r"(\$\$[^$]+\$\$|\$[^$\n]+\$|\\\(.*?\\\)|\\\[.*?\\\])", line)
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

    structured = (metadata or {}).get("sections")
    if isinstance(structured, list):
        blocks = _expand_sections(structured)
    return DocumentIR(title=title, blocks=blocks, theme=theme, metadata=metadata or {})


def _parse_fence(lines, index, first, blocks, flush_paragraph):
    """Parse a fenced block (mermaid diagram, code, or styled callout)."""
    flush_paragraph()
    language = first[3:].strip().lower()
    index += 1
    body_words = []
    while index < len(lines) and not lines[index].strip().startswith("```"):
        body_words.append(lines[index])
        index += 1
    if index < len(lines):
        index += 1
    language_word = (language.split()[0] + "").strip()
    kind = language_word if language_word in CALLOUT_TYPES else ""
    if language == "mermaid":
        blocks.append({"type": "diagram", "source": "\n".join(body_words)})
    elif kind:
        tail = language[len(kind):].strip()
        blocks.append({
            "type": "callout",
            "kind": kind,
            "title": tail or None,
            "text": "\n".join(body_words).strip(),
        })
    else:
        blocks.append({"type": "code", "text": "\n".join(body_words)})
    return index


def _parse_equation(lines, index, first, blocks, flush_paragraph):
    """Parse a display equation bounded by ``$$`` or ``\\[``...``\\]``."""
    flush_paragraph()
    closer = "$$" if first.startswith("$$") else r"\]"
    equation = first[2:]
    if equation.endswith(closer):
        equation = equation[:-2]
        index += 1
    else:
        index += 1
        body_words = []
        while index < len(lines) and not lines[index].strip().endswith(closer):
            body_words.append(lines[index])
            index += 1
        if index < len(lines):
            body_words.append(lines[index].strip()[:-2])
            index += 1
        equation = "\n".join([equation] + body_words)
    if equation.strip():
        blocks.append({"type": "equation", "text": equation.strip()})
    return index


def _expand_sections(sections):
    """Flatten a structured ``sections`` list (Phase-14 style) into blocks."""
    blocks = []
    for section in sections:
        if not isinstance(section, dict):
            blocks.append({"type": "paragraph", "text": str(section)})
            continue
        if section.get("title"):
            blocks.append({"type": "heading", "level": 1,
                          "text": str(section["title"]).strip()})
        body = ""
        for field in ("content", "text", "body"):
            if section.get(field):
                body = str(section[field])
                break
        if body.strip():
            blocks.extend(content_to_ir("", body).blocks)
        for key in ("formulas", "equations"):
            for formula in section.get(key) or []:
                if str(formula).strip():
                    blocks.append({"type": "equation", "text": str(formula)})
        for example in section.get("examples") or []:
            blocks.append({"type": "callout", "kind": "example",
                           "title": "Worked example", "text": str(example)})
        for question in section.get("questions") or []:
            if isinstance(question, dict):
                question_text = question.get("question") or question.get("text") or ""
                if question_text:
                    blocks.append({"type": "paragraph",
                                   "text": "**Question.** " + str(question_text).strip()})
                answer = question.get("answer") or question.get("solution")
                if answer:
                    blocks.append({"type": "paragraph",
                                   "text": "**Answer.** " + str(answer).strip()})
            else:
                blocks.append({"type": "paragraph",
                               "text": "**Question.** " + str(question).strip()})
    return blocks