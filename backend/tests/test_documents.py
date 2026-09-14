from backend.documents.processing import content_to_ir, equation_text, plain_text
from backend.documents.renderers import BuiltinPdfRenderer, ReportLabRenderer, validate_pdf
from backend.documents.service import DocumentService
from backend.documents.themes import THEMES
from backend.pdf import StyledPdfRenderer, build_css, callout, cover_page, section_header
from backend.pdf import table_html, formula_box, question_block, answer_block
from backend.pdf.renderer import validate_pdf as styled_validate_pdf


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


# --- Styled PDF renderer (backend.pdf) ---------------------------------------

def test_styled_renderer_build_css_has_expected_sections():
    css = build_css("default")
    assert "@page" in css
    assert "@page cover" in css
    assert "counter(page)" in css
    assert "A4" in css
    assert "DejaVu Serif" in css or "serif" in css


def test_styled_renderer_components_render_valid_html():
    doc = content_to_ir("T", "# H")
    cover = cover_page(doc)
    assert 'class="cover"' in cover
    assert "Vector AI" in cover

    header = section_header("01", "MECHANICS")
    assert 'section-number' in header
    assert "MECHANICS" in header

    call = callout("definition", "Definition", "<p>x</p>")
    assert 'callout definition' in call
    assert "Definition" in call


def test_styled_renderer_table_component():
    html = table_html(
        ["Quantity", "Symbol", "SI Unit"],
        [["Force", "F", "N"], ["Mass", "m", "kg"]],
        caption="Table caption",
    )
    assert "<thead>" in html
    assert "<tbody>" in html
    assert "Quantity" in html
    assert "Table caption" in html


def test_styled_renderer_formula_question_answer_components():
    eq = formula_box("KINETIC ENERGY", "<img class='math-img'/>")
    assert "formula" in eq
    assert "KINETIC ENERGY" in eq

    q = question_block("<p>Find F.</p>", number=3)
    assert "question" in q
    assert "Question 3" in q

    a = answer_block("<p>F = 10 N</p>")
    assert "answer" in a
    assert "Answer" in a


def test_styled_renderer_rejects_missing_weasyprint():
    try:
        StyledPdfRenderer()
    except RuntimeError as exc:
        assert "weasyprint" in str(exc).lower()
    else:
        raise AssertionError("expected StyledPdfRenderer to require weasyprint here")


def test_styled_renderer_html_pipes_math_into_svg_images():
    doc = content_to_ir(
        "Math test",
        "Inline $F = ma$ and display $$E_k = \frac{1}{2}mv^2$$",
    )
    html = StyledPdfRenderer.render_html(doc)
    assert "data:image/svg+xml" in html
    assert "math-img" in html
    assert "equation-display" in html


def test_styled_renderer_html_escapes_malformed_math():
    doc = content_to_ir(
        "Bad math",
        "Here is $\notacommand{foo}$ and normal text.",
    )
    html = StyledPdfRenderer.render_html(doc)
    assert "math-fallback" in html
    assert "foo" in html
    assert "notacommand" in html


def test_styled_renderer_html_carries_canonical_pipeline_docstring():
    import backend.pdf
    doc = backend.pdf.__doc__
    assert "Canonical pipeline" in doc
    assert "WeasyPrint" in doc
    assert "SVG" in doc


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
