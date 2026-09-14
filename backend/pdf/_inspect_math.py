import inspect
import sys
sys.path.insert(0, '.')

from backend.pdf import math

print("=== math module functions ===")
for name in ['render_math', 'split_math', 'normalize_math', 'reset_equation_counter']:
    if hasattr(math, name):
        obj = getattr(math, name)
        print(f"\n{name}:")
        if callable(obj):
            try:
                sig = inspect.signature(obj)
                print(f"  signature: {sig}")
            except:
                print(f"  (no signature)")
        else:
            print(f"  value: {obj}")
    else:
        print(f"\n{name}: MISSING")

print("\n=== smoke tests ===")
try:
    r1 = math.render_math('F = ma', display=False)
    print(f"render_math('F=ma', inline)[:100]: {r1[:100]!r}")
except Exception as e:
    print(f"render_math FAILED: {e}")

try:
    r2 = math.render_math('E_k = \\frac{1}{2}mv^2', display=True)
    print(f"render_math display[:120]: {r2[:120]!r}")
except Exception as e:
    print(f"render_math display FAILED: {e}")

try:
    print(f"split_math test: {math.split_math('a $x$ b')!r}")
except Exception as e:
    print(f"split_math FAILED: {e}")
