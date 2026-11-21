"""Exporta a identidade Sulco aprovada, sem depender de fontes instaladas."""
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/logo-exploracoes/sulco'
OUT = ROOT / 'assets'
for kind in ('horizontal', 'simbolo'):
    source = SOURCE / f'abt-sonora-sulco-{kind}-escura.svg'
    for variant, color in [('clara', '#F0EEE8'), ('escura', '#151718'), ('laranja', '#FF6B35')]:
        svg = ET.parse(source).getroot()
        svg.set('aria-label', 'Abt Sonora' if kind == 'horizontal' else 'Abt Sonora — símbolo Sulco')
        svg.set('style', f'color:{color}')
        ET.register_namespace('', 'http://www.w3.org/2000/svg')
        ET.ElementTree(svg).write(OUT / f'abt-sonora-{kind}-{variant}.svg', encoding='unicode')
print('Abt Sonora: seis SVGs da identidade Sulco aprovada.')
