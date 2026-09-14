import sys
sys.path.insert(0,".")
from backend.documents.processing import content_to_ir
doc = content_to_ir("Bad math", "Here is $
otacommand{foo}$ and normal text.")
print("=== Bad math IR ===")
for b in doc.blocks:
    print(repr(b))
print()
doc2 = content_to_ir("Math test", "Inline  = ma$ and display 2120E_k = rac{1}{2}mv^22120",)
print("=== Math IR ===")
for b in doc2.blocks:
    print(repr(b))
