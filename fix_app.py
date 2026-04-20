#!/usr/bin/env python
"""Fix app.py structure — add missing @app.route for /api/simulate"""

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with orphaned code starting with "data = request.json"
# Insert the missing decorator and function definition before it
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # Check if this is the orphaned "data = request.json" that needs a route
    if line.strip() == 'data = request.json' and i > 0:
        # Check if previous lines don't have a def — meaning we need to insert
        # Look back to find if there's already a decorator/def
        found_def = False
        for j in range(max(0, i-10), i):
            if lines[j].strip().startswith('@app.route') or lines[j].strip().startswith('def '):
                found_def = True
                break
        if not found_def:
            # Insert missing route and function header
            indent = ''  # top-level
            new_lines.append('@app.route("/api/simulate", methods=["POST"])\n')
            new_lines.append('@cache.cached(timeout=60, key_prefix=lambda: request.data)\n')
            new_lines.append('def simulate_physics():\n')
            new_lines.append('    """Runs projectile simulation + ML prediction (legacy)"""\n')
            new_lines.append('    try:\n')
            # Now continue with the existing code, but with extra indent
            # The existing line "data = request.json" becomes indented
            # We'll handle indentation for the whole block
            # Collect the entire function body until we hit a blank line followed by @ or def at top level
            i += 1
            while i < len(lines):
                l = lines[i]
                # If we hit a decorator or top-level def, stop
                if l and not l[0].isspace() and (l.startswith('@') or l.startswith('def ')):
                    break
                # Add line with extra 4 spaces indent if it's not already indented
                if l.strip() and not l[0].isspace():
                    new_lines.append('    ' + l)
                else:
                    new_lines.append(l)
                i += 1
            continue
    new_lines.append(line)
    i += 1

with open('app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Fixed simulate_physics route definition')
print(f'Lines: {len(lines)} -> {len(new_lines)}')
