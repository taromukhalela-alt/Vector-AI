from backend.documents.processing import content_to_ir, equation_text, plain_text
from backend.documents.renderers import BuiltinPdfRenderer, ReportLabRenderer, validate_pdf
from backend.documents.service import DocumentService
from backend.documents.themes import THEMES


def test_content_is_converted_to_structured_ir():
    result = content_to_ir("Lesson", "# Forces\n\nNewton's *first* law.\n\n$$ F = ma $$")
    assert result.title == "Lesson"
    assert result.blocks[0] == {"type": "heading", "level": 1, "text": "Forces"}
    assert result.blocks[1]["type"] == "paragraph"
    assert result.blocks[2] == {"type": "equation", "text": "F = ma"}


def test_pdf_validation_rejects_incomplete_output():
    try:
        validate_pdf(b"%PDF-1.7\nnot complete")
    except ValueError:
        pass
    else:
        raise AssertionError("incomplete PDF should be rejected")


def test_content_hash_is_deterministic():
    first = DocumentService.content_hash("A", "body", "default")
    assert first == DocumentService.content_hash("A", "body", "default")
    assert first != DocumentService.content_hash("A", "other", "default")


def test_builtin_themes_are_available_to_renderer():
    assert {"default", "academic", "dark"} <= set(THEMES)
    assert THEMES["academic"]["body_font"] != THEMES["default"]["body_font"]


def test_plain_text_preserves_latex_math():
    # Subscripts, LaTeX commands and non-breaking spaces must survive, while
    # the surrounding $...$ delimiters are removed so they never print.
    assert plain_text(r"Use $E_k = \frac{1}{2}mv^2$ to find Ek.") == \
        r"Use E_k = \frac{1}{2}mv^2 to find Ek."
    assert plain_text(r"$2H_2 + O_2 \rightarrow 2H_2O$") == r"2H_2 + O_2 \rightarrow 2H_2O"
    assert plain_text(r"Inline: $v = 3.0 \times 10^8~m/s$") == \
        r"Inline: v = 3.0 \times 10^8 m/s"
    # Markdown emphasis is still stripped outside of math spans.
    assert plain_text("**bold** weight is *mass*") == "bold weight is mass"


def test_plain_text_handles_inline_and_display_delimiters():
    assert plain_text("Use $F = ma$ here") == "Use F = ma here"
    assert plain_text(r"Solve \(f(x) = 2x\) at x = 3") == "Solve f(x) = 2x at x = 3"
    assert plain_text(r"Given \[ E = mc^2 \] we get") == r"Given E = mc^2 we get"


def test_equation_text_keeps_latex_source():
    assert equation_text(r"$$E_k = \frac{1}{2}mv^2$$") == r"E_k = \frac{1}{2}mv^2"
    assert equation_text(r"\(f(x) = 2x\)") == "f(x) = 2x"
    assert equation_text(r"E_k = \frac{1}{2}mv^2") == r"E_k = \frac{1}{2}mv^2"


def test_inline_math_with_parentheses_and_brackets_is_extracted():
    result = content_to_ir("T", r"Find \(f(x) = 2x\) at x = 3.")
    assert result.blocks[0] == {"type": "paragraph", "text": "Find "}
    assert result.blocks[1] == {"type": "equation", "text": "f(x) = 2x"}
    assert result.blocks[2] == {"type": "paragraph", "text": " at x = 3."}

    bracketed = content_to_ir("T", r"Given \[ E = mc^2 \] we get rest.").blocks
    assert bracketed[0] == {"type": "paragraph", "text": "Given "}
    assert bracketed[1] == {"type": "equation", "text": "E = mc^2"}


def test_builtin_renderer_preserves_math_and_validation():
    document = content_to_ir(
        "Lesson (safe)",
        r"# Forces" "\n\n"
        r"Use (m = 2) and $E_k = \frac{1}{2}mv^2$ here." "\n\n"
        r"```mermaid" "\n"
        r"flowchart LR" "\n"
        r"A-->B" "\n"
        r"```",
    )
    pdf = BuiltinPdfRenderer().render(document)
    assert validate_pdf(pdf)
    # Subscripts and LaTeX commands are not mangled, and the $ delimiters
    # never leak into the rendered text stream.
    assert b"E_k" in pdf
    assert br"\\frac" in pdf
    assert b"$E_k" not in pdf


def test_reportlab_renderer_produces_valid_pdf_with_math():
    document = content_to_ir(
        "Worked example",
        r"# Velocity" "\n"
        r"Initial speed $v_0 = 5 ~m/s$ and final $v = 2v_0$." "\n"
        r"$$ E_k = \frac{1}{2}mv^2 $$",
    )
    pdf = ReportLabRenderer().render(document)
    assert validate_pdf(pdf)
    assert b"%PDF-" in pdf
    assert b"%%EOF" in pdf
