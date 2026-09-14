"""Math rendering smoke tests."""
from backend.pdf.math import render_math, reset_equation_counter, _EQUATIONS_RENDERED

reset_equation_counter()
print("equation budget start:", _EQUATIONS_RENDERED[0])

print("=== inline $F=ma$ ===")
print(render_math("$F=ma$", display=False))
print()

print("=== display $$E_k = \\frac{1}{2}mv^2$$ ===")
print(render_math(r"$$E_k = \frac{1}{2}mv^2$$", display=True))
print()

print("=== inline \\(F=ma\\) ===")
print(render_math(r"Use \(F=ma\) here", display=False))
print()

print("=== greek theta 30 deg ===")
print(render_math(r"$\theta = 30^\circ$", display=False))
print()

print("=== vector F ===")
print(render_math(r"$\vec{F} = m\vec{a}$", display=False))
print()

print("=== fallback on bad latex ===")
print(render_math(r"$\notrealcommand{foo}$", display=False))
print()

print("equation budget end:", _EQUATIONS_RENDERED[0])
