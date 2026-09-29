# User photo plates

No photos have been supplied; all six scenes use CSS/SVG fallbacks. No stock or AI imagery is included.

To prepare a photo with Pillow 12+ (AVIF and WebP support):

```sh
python3 scripts/prepare-softclub-plate.py path/to/photo.jpg terminal-01 --scene terminal --focal '60% 40%'
```

The offline script applies EXIF orientation, strips metadata, caps each dimension at 1600px, and encodes AVIF/WebP files below 250 KB each. It prints an entry to add to `src/lib/softclub/plates.json`. The application uses the first matching scene. CSS applies the theme tint, highlight and horizontal motion-blur ghost; source photos are never changed by the theme toggle. Failed photo loading uses that scene's procedural field.

Scene keys: `terminal`, `study`, `study-quiet`, `tunnel`, `skyline`, `nightwindow`. Keep the existing caption slot and only edit its text when replacing the lobby plate. Compact course images keep their existing dimensions; other scenes occupy the existing heading's bottom padding so the grid stays unchanged. No additional hero row is created.
