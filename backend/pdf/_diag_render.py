import sys
sys.path.insert(0, '.')

from backend.documents.processing import content_to_ir
from backend.pdf.renderer import StyledPdfRenderer, render_html, build_css, _render_block_value
from backend.pdf.math import split_math, render_math, normalize_math

# ---- 1. IR produced by content_to_ir ----
print('=== 1. IR from content_to_ir ===')
doc = content_to_ir('Math test', 'Inline $F = ma$ and display $$E_k = \\frac{1}{2}mv^2$$')
for b in doc.blocks:
    print('BLOCK:', repr(b))
print()

# ---- 2. split_math on the paragraph text ----
print('=== 2. split_math on paragraph text ===')
para_text = 'Inline $F = ma$ and display $$E_k = \\frac{1}{2}mv^2$$'
for is_math, tok in split_math(para_text):
    print(is_math, repr(tok))
print()

# ---- 3. _render_block_value on that text ----
print('=== 3. _render_block_value result ===')
rv = _render_block_value(para_text)
print(rv[:500] if rv else '(empty)')
print()
print('contains equation-display:', 'equation-display' in (rv or ''))
print('contains math-fallback:', 'math-fallback' in (rv or ''))
print()

# ---- 4. Malformed math case ----
print('=== 4. Malformed math ===')
bad = 'Here is $\\notacommand{foo}$ and normal text.'
print('input repr:', repr(bad))
for is_math, tok in split_math(bad):
    print(is_math, repr(tok))
rv2 = _render_block_value(bad)
print('result:', rv2)
print('contains math-fallback:', 'math-fallback' in (rv2 or ''))
print()

# ---- 5. Full render_html ----
print('=== 5. Full render_html ===')
doc2 = content_to_ir('Bad math', 'Here is $\\notacommand{foo}$ and normal text.')
html = render_html(doc2)
print(html[:800])
print()
print('SVG in full html:', 'data:image/svg+xml' in html)
print('math-fallback in full html:', 'math-fallback' in html)
