"""Regenera as assinaturas vetoriais. Requer fonttools e brotli."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets'
FONT = TTFont(ROOT / 'assets/fonts/montserrat-bold-latin.woff2')
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UNITS = FONT['head'].unitsPerEm

SYMBOL = '<path d="M83 24C66 6 33 9 20 28C5 51 27 60 50 64C73 68 95 77 80 100C67 119 34 122 17 104" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><circle cx="106" cy="15" r="6" fill="currentColor"/>'

def letters(text, x, baseline, size):
    scale = size / UNITS
    pen = SVGPathPen(GLYPHS)
    for char in text:
        glyph = GLYPHS[CMAP[ord(char)]]
        glyph.draw(TransformPen(pen, (scale,0,0,-scale,x,baseline)))
        x += (glyph.width - 22) * scale
    return '<path d="' + pen.getCommands() + '" fill="currentColor"/>'

for variant, color in [('laranja','#FF6B35'),('clara','#F0EEE8'),('escura','#151718')]:
    for kind in ('horizontal','simbolo'):
        view = '0 0 740 150' if kind == 'horizontal' else '0 0 128 140'
        geometry = '<g transform="translate(6 5)">' + SYMBOL + '</g>'
        if kind == 'horizontal':
            geometry += letters('abt sonora', 161, 104, 88)
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-label="Abt Sonora" style="color:{color}">{geometry}</svg>'
        (OUT / f'abt-sonora-{kind}-{variant}.svg').write_text(svg)
print('Abt Sonora: seis SVGs com letras em curvas.')
