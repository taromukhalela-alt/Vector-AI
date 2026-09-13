"""Replaceable PDF renderers and conservative output validation.

ReportLab is supported when installed, but the default renderer deliberately
uses only the Python standard library.  This keeps document generation
available in the small production image used by Vector AI.
"""
import io
import re
import textwrap
from xml.sax.saxutils import escape

from .processing import clean_math_spans, equation_text, plain_text
from .themes import THEMES


class PdfRenderer:
    """Renderer interface. Implementations return complete PDF bytes."""

    def render(self, document):
        raise NotImplementedError


def _pdf_string(value):
    """Encode a value as a safe PDF literal string."""
    value = str(value).encode("latin-1", "replace").decode("latin-1")
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class BuiltinPdfRenderer(PdfRenderer):
    """Small, dependency-free text PDF renderer.

    The document IR keeps this renderer intentionally simple and replaceable.
    Equations and diagrams remain explicit labelled blocks rather than being
    silently discarded when optional graphics dependencies are unavailable.
    """

    _PAGE_WIDTH = 595
    _PAGE_HEIGHT = 842
    _LEFT = 50
    _TOP = 790
    _BOTTOM = 52
    _LEADING = 16

    def _lines(self, document):
        theme = THEMES.get(document.theme, THEMES["default"])
        color = theme.get("heading_color", "#1f2937").lstrip("#")
        try:
            heading_color = tuple(int(color[i:i + 2], 16) / 255 for i in (0, 2, 4))
        except (ValueError, TypeError):
            heading_color = (0.12, 0.16, 0.22)
        lines = [(plain_text(document.title), 18, heading_color, "F2")]
        for block in document.blocks:
            kind = block.get("type", "paragraph")
            value = str(block.get("text", ""))
            if kind == "heading":
                size = max(11, 16 - int(block.get("level", 1)))
                lines.append((plain_text(value), size, heading_color, "F2"))
            elif kind == "code":
                for line in value.splitlines() or [""]:
                    lines.append((line, 9, (0.12, 0.12, 0.12), "F3"))
            elif kind == "equation":
                lines.append(("Equation: " + equation_text(value), 11, (0.05, 0.20, 0.40), "F1"))
            elif kind == "diagram":
                diagram_label = block.get("src") or block.get("source") or block.get("alt", "")
                lines.append(("Diagram: " + plain_text(diagram_label), 10,
                              (0.15, 0.15, 0.15), "F1"))
            else:
                for paragraph_line in value.splitlines() or [""]:
                    lines.append((plain_text(paragraph_line), 10, (0.10, 0.10, 0.10), "F1"))
            lines.append(("", 8, (0.10, 0.10, 0.10), "F1"))

        wrapped = []
        for value, size, rgb, font in lines:
            width = max(30, int(92 * 10 / max(size, 1)))
            chunks = textwrap.wrap(value, width=width, break_long_words=True,
                                   break_on_hyphens=False) or [""]
            wrapped.extend((chunk, size, rgb, font) for chunk in chunks)
        return wrapped

    def _page_stream(self, lines):
        y = self._TOP
        commands = []
        for value, size, rgb, font in lines:
            commands.append("BT")
            commands.append("/%s %.1f Tf" % (font, size))
            commands.append("%.3f %.3f %.3f rg" % rgb)
            commands.append("%d %d Td" % (self._LEFT, y))
            commands.append("(%s) Tj" % _pdf_string(value))
            commands.append("ET")
            y -= max(self._LEADING, size + 4)
        return "\n".join(commands).encode("latin-1", "replace")

    def render(self, document):
        all_lines = self._lines(document)
        usable = int((self._TOP - self._BOTTOM) / self._LEADING)
        pages = [all_lines[i:i + usable] for i in range(0, len(all_lines), usable)] or [[]]
        objects = []

        def add(body):
            objects.append(body)
            return len(objects)

        font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        bold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        code = add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
        page_ids, content_ids = [], []
        for page_lines in pages:
            stream = self._page_stream(page_lines)
            content_ids.append(add("<< /Length %d >>\nstream\n%s\nendstream" %
                                   (len(stream), stream.decode("latin-1"))))
            page_ids.append(add(""))  # filled after the pages object exists
        pages_id = add("")
        for page_id, content_id in zip(page_ids, content_ids):
            objects[page_id - 1] = (
                "<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %d %d] "
                "/Resources << /Font << /F1 %d 0 R /F2 %d 0 R /F3 %d 0 R >> >> "
                "/Contents %d 0 R >>" %
                (pages_id, self._PAGE_WIDTH, self._PAGE_HEIGHT, font, bold, code, content_id)
            )
        objects[pages_id - 1] = "<< /Type /Pages /Kids [%s] /Count %d >>" % (
            " ".join("%d 0 R" % page_id for page_id in page_ids), len(page_ids)
        )
        catalog_id = add("<< /Type /Catalog /Pages %d 0 R >>" % pages_id)
        info_id = add("<< /Title (%s) /Producer (Vector AI) >>" % _pdf_string(document.title))

        output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for index, body in enumerate(objects, 1):
            offsets.append(len(output))
            output.extend(("%d 0 obj\n%s\nendobj\n" % (index, body)).encode("latin-1", "replace"))
        startxref = len(output)
        output.extend(("xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)).encode())
        output.extend(("".join("%010d 00000 n \n" % offset for offset in offsets[1:])).encode())
        output.extend(("trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R >>\n"
                       "startxref\n%d\n%%%%EOF\n" %
                       (len(objects) + 1, catalog_id, info_id, startxref)).encode())
        return bytes(output)


class ReportLabRenderer(PdfRenderer):
    """Optional richer renderer with a dependency-free fallback."""

    def render(self, document):
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Preformatted
        except ImportError:
            return BuiltinPdfRenderer().render(document)
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=A4, title=document.title)
        styles = getSampleStyleSheet()
        theme = THEMES.get(document.theme, THEMES["default"])
        for style_name in ("Title", "Heading1", "Heading2", "Heading3", "BodyText", "Normal"):
            styles[style_name].fontName = theme["body_font"]
            styles[style_name].textColor = theme["heading_color"]

        def safe(value):
            return escape(plain_text(str(value)))

        def markdown_paragraph(value):
            # Remove math delimiters first so $...$ / \\(...\\) never appear
            # verbatim, while the math source itself stays untouched.
            rendered = clean_math_spans(str(value))
            rendered = escape(rendered)
            rendered = rendered.replace("&lt;br&gt;", "<br/>")
            rendered = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", rendered)
            rendered = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<i>\1</i>", rendered)
            rendered = re.sub(r"`([^`]+?)`", r'<font name="Courier">\1</font>', rendered)
            return rendered

        story = [Paragraph(safe(document.title), styles["Title"]), Spacer(1, 12)]
        for block in document.blocks:
            kind = block["type"]
            if kind == "heading":
                story.append(Paragraph(safe(block["text"]),
                                       styles["Heading%d" % min(block["level"], 3)]))
            elif kind == "code":
                story.append(Preformatted(
                    escape(str(block["text"])),
                    styles.get("Code", styles["Normal"]),
                ))
            elif kind == "equation":
                story.append(Paragraph("Equation: " + escape(equation_text(block["text"])),
                                       styles["Normal"]))
            elif kind == "diagram":
                story.append(Paragraph("[Diagram: %s]" %
                                       safe(block.get("src") or block.get("source") or block.get("alt", "")),
                                       styles["Normal"]))
            else:
                story.append(Paragraph(markdown_paragraph(block["text"]).replace("\n", "<br/>"),
                                       styles["BodyText"]))
            story.append(Spacer(1, 8))
        doc.build(story)
        return output.getvalue()


def validate_pdf(data):
    """Reject truncated or non-PDF renderer output before it reaches storage."""
    if not isinstance(data, bytes) or not data.startswith(b"%PDF-"):
        raise ValueError("Renderer did not produce a PDF")
    if b"%%EOF" not in data[-1024:] or b"startxref" not in data[-2048:]:
        raise ValueError("PDF is incomplete")
    if b"/Type /Catalog" not in data or b"/Type /Pages" not in data:
        raise ValueError("PDF structure is invalid")
    return True
