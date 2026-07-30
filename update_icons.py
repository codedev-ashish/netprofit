import os
import re

files_to_update = []
for r, d, files in os.walk(r'd:\htdocs\firebase host\src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.css'):
            files_to_update.append(os.path.join(r, f))

c = 0
for file in files_to_update:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content.replace('color="var(--primary-color)"', 'color="var(--icon-color)"')
    new_content = new_content.replace("color: 'var(--primary-color)'", "color: 'var(--icon-color)'")
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated', file)
        c += 1

print(f'Done. Updated {c} files.')
