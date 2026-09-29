"""Offline photo export. Requires Pillow with AVIF/WebP support; no app dependency."""
import argparse
import json
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('id')
parser.add_argument('--scene', required=True, choices=['terminal', 'study', 'study-quiet', 'tunnel', 'skyline', 'nightwindow'])
parser.add_argument('--focal', default='50% 50%')
args = parser.parse_args()
if not args.id or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in args.id):
    parser.error('id must contain only lowercase letters, digits and hyphens')
root = Path(__file__).resolve().parent.parent
output = root / 'public' / 'plates'
output.mkdir(parents=True, exist_ok=True)
with Image.open(args.source) as original:
    photo = ImageOps.exif_transpose(original).convert('RGB')
photo.thumbnail((1600, 1600))
# Color treatment remains in CSS, so Violet/Blue reuse the same source photo.
for extension, format_name in [('avif', 'AVIF'), ('webp', 'WEBP')]:
    for quality in range(85, 14, -5):
        buffer = BytesIO()
        photo.save(buffer, format=format_name, quality=quality)
        if buffer.tell() <= 250_000:
            (output / f'{args.id}.{extension}').write_bytes(buffer.getvalue())
            break
    else:
        raise SystemExit(f'{extension} exceeds 250 KB; crop or simplify the source')
print(json.dumps({'id': args.id, 'src': f'/plates/{args.id}.avif',
                  'fallback': f'/plates/{args.id}.webp', 'scene': args.scene,
                  'focal': args.focal, 'caption': f'PLATE / {args.scene.upper()}'}, indent=2))
