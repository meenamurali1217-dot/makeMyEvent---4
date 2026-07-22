import os
import re

partials_dir = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates\partials'
os.makedirs(partials_dir, exist_ok=True)

def extract_and_replace(filepath, header_out, footer_out):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract header
    header_pattern = re.compile(r'(?:<!--\s*Header\s*-->\s*)?<header.*?</header>', re.DOTALL | re.IGNORECASE)
    header_match = header_pattern.search(content)
    if header_match:
        with open(os.path.join(partials_dir, header_out), 'w', encoding='utf-8') as f:
            f.write(header_match.group(0))
        # Replace in original file
        content = content[:header_match.start()] + '{% include "partials/' + header_out + '" %}' + content[header_match.end():]
        print(f'Extracted {header_out} from {filepath}')

    # Extract footer
    if 'footer-bottom' in content:
        footer_pattern = re.compile(r'(?:<!--\s*Dark Footer\s*-->\s*)?<footer.*?</footer>\s*<div class="footer-bottom">.*?</div>', re.DOTALL | re.IGNORECASE)
    else:
        footer_pattern = re.compile(r'<footer.*?</footer>', re.DOTALL | re.IGNORECASE)

    footer_match = footer_pattern.search(content)
    if footer_match:
        with open(os.path.join(partials_dir, footer_out), 'w', encoding='utf-8') as f:
            f.write(footer_match.group(0))
        # Replace in original file
        content = content[:footer_match.start()] + '{% include "partials/' + footer_out + '" %}' + content[footer_match.end():]
        print(f'Extracted {footer_out} from {filepath}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates'

extract_and_replace(os.path.join(base_dir, 'index.html'), 'header_public.html', 'footer_public.html')
extract_and_replace(os.path.join(base_dir, r'user\home.html'), 'header_user.html', 'footer_user.html')
extract_and_replace(os.path.join(base_dir, r'vendor\dashboard.html'), 'header_vendor.html', 'footer_vendor.html')
extract_and_replace(os.path.join(base_dir, r'admin\dashboard.html'), 'header_admin.html', 'footer_admin.html')

print('Extraction complete.')
