#!/usr/bin/env python
"""Remove duplicate dashboard_data route from app.py"""

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 1088-1091 (the second @app.route("/api/dashboard") and its function)
# Also need to remove the blank line before it if it exists
new_lines = []
i = 0
while i < len(lines):
    # Check if this line starts a duplicate dashboard_data route
    if i >= 1087 and i <= 1090:  # 0-indexed: line 1088 is index 1087
        # Skip these lines
        i += 1
        continue
    new_lines.append(lines[i])
    i += 1

with open('app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Removed duplicate dashboard_data route')
print(f'Lines: {len(lines)} -> {len(new_lines)}')
