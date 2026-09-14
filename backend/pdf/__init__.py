"""Vector AI -- styled PDF rendering pipeline.

Canonical pipeline
------------------

    AI-generated structured content
        -> content_to_ir()              (documents/processing.py)
        -> backend.pdf.html             IR -> styled HTML (math aware)
        -> backend.pdf.components       reusable document components
        -> backend.pdf.templates        per document-type templates
        -> backend.pdf.math             LaTeX -> SVG (vector, offline)
        -> CSS design system            (backend/pdf/styles.py)
        -> WeasyPrint                   HTML+CSS -> A4 PDF
        -> validate_pdf()               conservative output check

Everything runs server-side without a browser, a TeX binary or any external
network request.  Malformed LaTeX degrades to a readable fallback instead of
aborting PDF generation.
"""
from .math import normalize_math, render_math, split_math
from .renderer import (
    StyledPdfRenderer,
    get_default_renderer,
    render_html,
    build_css,
    cover_page,
    section_header,
    callout,
    table_html,
    list_html,
    formula_box,
    question_block,
    answer_block,
)

__all__ = [
    "normalize_math",
    "render_math",
    "split_math",
    "StyledPdfRenderer",
    "get_default_renderer",
    "render_html",
    "build_css",
    "cover_page",
    "section_header",
    "callout",
    "table_html",
    "list_html",
    "formula_box",
    "question_block",
    "answer_block",
]