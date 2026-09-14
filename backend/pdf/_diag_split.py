import sys
sys.path.insert(0, '.')

from backend.pdf.math import split_math, render_math

samples = [
    r'Inline $F = ma$ and display $$E_k = \frac{1}{2}mv^2$$',
    r'Here is $\notacommand{foo}$ and normal text.',
]

for s in samples:
    print('INPUT:', repr(s))
    for is_math, tok in split_math(s):
        print('  ', 'MATH' if is_math else 'TEXT', repr(tok))
    print()
