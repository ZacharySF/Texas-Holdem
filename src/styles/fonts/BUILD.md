Archivo remains a Latin variable font. Its downloaded width 62–125 and weight 100–900 axes contained ranges unused by this design. The final file retains width 100–125 and weight 300–600, including regular body type, semibold emphasis and the specified light display range. Archivo is 56,948 bytes; the three UI font files total 86,544 bytes. Only Archivo is preloaded.

The offline FontTools operation is:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
font = TTFont("original-archivo-latin.woff2")
instantiateVariableFont(font, {"wdth": (100, 100, 125), "wght": (300, 400, 600)}, inplace=True)
font.flavor = "woff2"
font.save("archivo-latin.woff2")
```

IBM Plex Mono 400/500 are the Latin WOFF2 files distributed by Google Fonts. Original OFL licenses are included alongside the fonts. KaTeX's existing mathematical fonts remain unchanged.
