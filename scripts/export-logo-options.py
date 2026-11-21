from pathlib import Path
import math
import sys
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import cairosvg

OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent.parent/'assets/logo-exploracoes'
OUT.mkdir(parents=True,exist_ok=True)
INK='#16191A'; PAPER='#EDEBE4'; ACCENT='#C8A77B'
FONTROOT=Path('/System/Library/Fonts/Supplemental')

def font(file,index=0):
    return TTFont(FONTROOT/file,fontNumber=index) if file.endswith('.ttc') else TTFont(FONTROOT/file)
COCHIN=font('Cochin.ttc'); GILL=font('GillSans.ttc',7); DIN=font('DIN Condensed Bold.ttf')
LABEL=font('GillSans.ttc')

def text(f,s,x,y,size,tracking=0):
    glyphs=f.getGlyphSet(); cmap=f.getBestCmap();scale=size/f['head'].unitsPerEm
    pen=SVGPathPen(glyphs);start=x;prev=None;kern={}
    if 'kern' in f:
        for t in f['kern'].kernTables:
            if hasattr(t,'kernTable'):kern.update(t.kernTable)
    for ch in s:
        key=cmap[ord(ch)]
        if prev:x+=kern.get((prev,key),0)*scale
        g=glyphs[key];g.draw(TransformPen(pen,(scale,0,0,-scale,x,y)))
        x+=g.width*scale+tracking;prev=key
    return f'<path d="{pen.getCommands()}" fill="currentColor"/>',x-start-tracking

def centered(f,s,cx,y,size,tracking=0):
    _,w=text(f,s,0,y,size,tracking)
    return text(f,s,cx-w/2,y,size,tracking)[0]

def arc(r,start,end,cx=50,cy=50):
    a,b=map(math.radians,[start,end]);x1=cx+r*math.cos(a);y1=cy+r*math.sin(a);x2=cx+r*math.cos(b);y2=cy+r*math.sin(b)
    return f'M{x1:.3f} {y1:.3f} A{r} {r} 0 {1 if end-start>180 else 0} 1 {x2:.3f} {y2:.3f}'

symbols={
'sulco':'<g fill="none" stroke="currentColor" stroke-width="3">'+''.join(f'<path d="{arc(r,-42,258)}"/>' for r in (20,31,42))+'</g><circle cx="50" cy="50" r="3" fill="currentColor"/>',
'intervalo':'<g fill="none" stroke="currentColor" stroke-width="4"><path d="M60 14C26 14 12 35 12 50C12 65 26 86 60 86"/><path d="M40 27C64 27 82 37 82 50C82 63 64 73 40 73"/></g>',
'matriz':'<path d="M13 15H87V85H13Z M22 24V76H78V24Z" fill="currentColor" fill-rule="evenodd"/><g fill="none" stroke="currentColor" stroke-width="4"><path d="M30 34C48 26 70 39 70 50S48 74 30 66"/><path d="M30 43C43 38 60 44 60 50S43 62 30 57"/></g>'
}
# Wordmarks are built from real font outlines, then individually spaced and arranged.
logos={}
logos['sulco']='<g transform="translate(12 26) scale(.91)">'+symbols['sulco']+'</g>'+text(COCHIN,'abt',145,54,42,1)[0]+text(COCHIN,'sonora',138,131,128,-1)[0]
logos['intervalo']='<g transform="translate(8 37) scale(.88)">'+symbols['intervalo']+'</g>'+text(LABEL,'A B T',148,49,23,1.5)[0]+text(GILL,'SONORA',143,119,89,8)[0]
logos['matriz']='<g transform="translate(9 40) scale(.83)">'+symbols['matriz']+'</g>'+text(LABEL,'ABT',133,20,18,4)[0]+text(DIN,'SONORA',126,137,144,4)[0]
widths={'sulco':570,'intervalo':585,'matriz':575}
for slug in logos:
    folder=OUT/slug;folder.mkdir(exist_ok=True)
    for colorname,color in [('clara',PAPER),('escura',INK),('areia',ACCENT)]:
        for kind,view,art in [('horizontal',f'0 0 {widths[slug]} 165',logos[slug]),('simbolo','0 0 100 100',symbols[slug])]:
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-label="Abt Sonora — {slug}" style="color:{color}">{art}</svg>'
            (folder/f'abt-sonora-{slug}-{kind}-{colorname}.svg').write_text(svg)

names=['Sulco','Intervalo','Matriz'];slugs=list(logos);families=['Cochin / Regular','Gill Sans / Light','DIN Condensed / Bold']
notes=['O gesto do vinil, em uma assinatura editorial.','Precisão, silêncio e espaço entre as formas.','A força dos selos e das matrizes de gravação.']
def panel(slug,x,y,w,h,bg,fg):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/><svg x="{x+w*.13}" y="{y+h*.20}" width="{w*.74}" height="{h*.60}" viewBox="0 0 {widths[slug]} 165" style="color:{fg}">{logos[slug]}</svg>'

# Compact comparison board: identical scale and treatment across all three options.
board=f'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1710" viewBox="0 0 1800 1710"><rect width="1800" height="1710" fill="{PAPER}"/>'
board+='<g style="color:'+INK+'">'+text(LABEL,'ABT SONORA / DIREÇÕES DE IDENTIDADE',80,75,22,2)[0]+text(COCHIN,'Três maneiras de fazer o som aparecer.',78,146,52)[0]+'</g>'
for i,slug in enumerate(slugs):
    y=200+i*490
    board+='<g style="color:'+INK+'">'+text(LABEL,f'0{i+1} / {names[i].upper()}',80,y+28,25,2)[0]+text(LABEL,families[i],1210,y+28,21,1)[0]+'</g>'
    board+=panel(slug,80,y+58,800,315,INK,PAPER)+panel(slug,900,y+58,820,315,'#E2DFD6',INK)
    board+='<g style="color:'+INK+'">'+text(LABEL,notes[i],80,y+415,23,0)[0]+'</g>'
board+='</svg>'
(OUT/'comparativo.svg').write_text(board)
cairosvg.svg2png(bytestring=board.encode(),write_to=str(OUT/'comparativo.png'))

for i,slug in enumerate(slugs):
    s=f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200"><rect width="1600" height="1200" fill="{PAPER}"/>'
    s+='<g style="color:'+INK+'">'+text(LABEL,f'0{i+1} / {names[i].upper()}',70,75,28,2)[0]+text(LABEL,families[i],1060,75,23,1)[0]+'</g>'
    s+=panel(slug,70,120,1460,455,INK,PAPER)
    s+=panel(slug,70,595,960,360,'#E2DFD6',INK)
    s+=f'<rect x="1050" y="595" width="480" height="360" fill="{INK}"/><svg x="1215" y="700" width="150" height="150" viewBox="0 0 100 100" style="color:{ACCENT}">{symbols[slug]}</svg>'
    s+='<g style="color:'+INK+'">'+text(LABEL,notes[i],70,1030,27,0)[0]+text(LABEL,'Assinatura vetorial / símbolo / versões clara, escura e areia',70,1085,21,0)[0]+'</g></svg>'
    (OUT/slug/'apresentacao.svg').write_text(s)
    cairosvg.svg2png(bytestring=s.encode(),write_to=str(OUT/slug/'apresentacao.png'))
print('Três direções, 18 SVGs finais e quatro pranchas geradas.')
