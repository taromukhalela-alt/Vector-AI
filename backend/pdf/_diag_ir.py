import sys
sys.path.insert(0, '.')

from backend.documents.processing import content_to_ir

tests = [
    ("Math test", "Inline $F = ma$ and display $$E_k = \\frac{1}{2}mv^2$$"),
    ("Bad math", "Here is $\\notacommand{foo}$ and normal text."),
]

for title, content in tests:
    print("=" * 60)
    print(f"TITLE: {title}")
    print(f"CONTENT: {content!r}")
    doc = content_to_ir(title, content)
    print(f"\nBLOCKS ({len(doc.blocks)}):")
    for i, b in enumerate(doc.blocks):
        print(f"  [{i}] {b}")
    print()
