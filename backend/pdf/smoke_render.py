import sys
sys.path.insert(0, '.')

from backend.pdf.renderer import get_default_renderer

title = "Physics Mock Exam"
content = """# Section 1: Kinematics

This is a test paragraph with some **bold text**, some *italic text*, and `inline code`.

We can also include inline math: the formula for force is $F = ma$, and kinetic energy is $E_k = \\frac{1}{2}mv^2$.

Let's test an unordered list:
* Item 1 is very important.
* Item 2 contains some math $\\theta = 30^\\circ$
* Item 3 is here.

And an ordered list:
1. First step: Write down the knowns.
2. Second step: Choose the equation.

---

## Important Formulas

```formula Newton's Second Law
The acceleration of an object as produced by a net force is directly proportional to the magnitude of the net force, in the same direction as the net force, and inversely proportional to the mass of the object.
$$F_{net} = ma$$
```

```example Worked Example
Calculate the force needed to accelerate a 10 kg mass at 2 m/s$^2$.

**Solution:**
$$F = ma$$
$$F = 10 \\times 2$$
$$F = 20 \\text{ N}$$
```

Here is a table:

| Quantity | Symbol | SI Unit |
|---|---|---|
| Force | $F$ | Newton (N) |
| Mass | $m$ | Kilogram (kg) |
| Acceleration | $a$ | m/s$^2$ |

## Questions

```question
A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds.
Calculate the net force acting on the car.
```

```answer
First find acceleration:
$$a = \\frac{v - u}{t} = \\frac{20 - 0}{8} = 2.5 \\text{ m/s}^2$$

Then calculate force:
$$F = ma = 1200 \\times 2.5 = 3000 \\text{ N}$$
```
"""

try:
    from backend.documents.processing import content_to_ir
    ir = content_to_ir(title, content, "default", metadata={
        "document_type": "Mock Exam",
        "subject": "Physical Sciences",
        "grade": "12",
        "learner": "Vector Student"
    })
    
    try:
        renderer = get_default_renderer()
        pdf_bytes = renderer.render(ir)
        with open("test_output.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("Successfully generated test_output.pdf!")
    except RuntimeError as e:
        print(f"WeasyPrint not available: {e}")
        print("Dumping HTML instead...")
        from backend.pdf.renderer import StyledPdfRenderer, build_css
        html = StyledPdfRenderer.render_html(ir)
        css = build_css("default")
        with open("test_output.html", "w", encoding="utf-8") as f:
            f.write(f"<style>{css}</style>\n{html}")
        print("Successfully generated test_output.html!")

except Exception as e:
    import traceback
    traceback.print_exc()
