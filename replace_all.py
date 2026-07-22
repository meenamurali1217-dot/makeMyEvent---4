import os
import re

base_dir = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates'

mappings = {
    'public': ('header_public.html', 'footer_public.html'),
    'auth': ('header_public.html', 'footer_public.html'),
    'user': ('header_user.html', 'footer_user.html'),
    'vendor': ('header_vendor.html', 'footer_vendor.html'),
    'admin': ('header_admin.html', 'footer_admin.html')
}

def replace_in_file(filepath, header_out, footer_out):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Replace header
    header_pattern = re.compile(r'(?:<!--\s*Header\s*-->\s*)?<header.*?</header>', re.DOTALL | re.IGNORECASE)
    header_match = header_pattern.search(content)
    if header_match:
        content = content[:header_match.start()] + '{% include "partials/' + header_out + '" %}' + content[header_match.end():]
        modified = True
        print(f'Replaced header in {filepath}')

    # Replace footer
    if 'footer-bottom' in content:
        footer_pattern = re.compile(r'(?:<!--\s*Dark Footer\s*-->\s*)?<footer.*?</footer>\s*<div class="footer-bottom">.*?</div>', re.DOTALL | re.IGNORECASE)
    else:
        footer_pattern = re.compile(r'<footer.*?</footer>', re.DOTALL | re.IGNORECASE)

    footer_match = footer_pattern.search(content)
    if footer_match:
        content = content[:footer_match.start()] + '{% include "partials/' + footer_out + '" %}' + content[footer_match.end():]
        modified = True
        print(f'Replaced footer in {filepath}')

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            # Skip the main files we already processed and partials
            if 'partials' in filepath or filepath.endswith('index.html') or filepath.endswith('user\\home.html') or filepath.endswith('vendor\\dashboard.html') or filepath.endswith('admin\\dashboard.html'):
                continue
                
            # Determine mapping based on path
            rel_path = os.path.relpath(filepath, base_dir)
            category = rel_path.split(os.sep)[0]
            
            if category in mappings:
                header, footer = mappings[category]
                replace_in_file(filepath, header, footer)

print('Replacement complete in all directories.')
