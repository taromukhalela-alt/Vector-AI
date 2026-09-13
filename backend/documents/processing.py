"""Safe, dependency-light conversion of markdown-like content to document IR."""
import html
import re

from .schemas import DocumentIR


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
        inline = re.split(r"(\$\$[^$]+\$\$|\\\([^)]*\\\))", line)
        if len(inline) > 1:
            for part in inline:
                if not part:
                    continue
                if (part.startswith("$$") and part.endswith("$$")):
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


def plain_text(value):
    value = re.sub(r"[*_`~]", "", value or "")
    return html.unescape(value).strip()
