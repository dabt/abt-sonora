#!/usr/bin/env python3
"""Gera as ilustrações do site em assets/img/. Usa só a biblioteca padrão.

Executar: python3 scripts/make-illustrations.py
Os desenhos usam a paleta da marca e não representam trabalhos reais.
"""
import math
import random
from pathlib import Path

INK, PANEL, PAPER, ORANGE, MUTED, SLATE = "#151718", "#202324", "#F0EEE8", "#FF6B35", "#B3B5B0", "#34383A"
OUT = Path(__file__).resolve().parent.parent / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)


def svg(w, h, body, bg=PANEL, crop=None):
    """crop = (x, y, largura, altura) recorta o enquadramento sem mexer no desenho."""
    x, y, cw, ch = crop or (0, 0, w, h)
    background = f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {cw} {ch}" aria-hidden="true">'
            f'{background}{body}</svg>')


def save(name, content):
    (OUT / name).write_text(content, encoding="utf-8")
    print("gerado", name)


def envelope(x, bursts):
    """Soma de picos suaves, para a onda parecer uma frase musical."""
    return max(math.exp(-((x - c) ** 2) / (2 * s * s)) * a for c, s, a in bursts)


# 1. Jingle: uma frase curta, com o trecho principal em destaque
def jingle():
    rnd = random.Random(7)
    w, h, n = 800, 600, 62
    bursts = [(0.14, 0.05, 0.5), (0.32, 0.07, 0.8), (0.52, 0.06, 1.0), (0.7, 0.07, 0.75), (0.88, 0.04, 0.45)]
    step = (w - 120) / n
    bars = []
    for i in range(n):
        t = i / (n - 1)
        amp = 0.1 + 0.9 * envelope(t, bursts)
        bh = max(8, amp * (0.55 + 0.45 * rnd.random()) * 330)
        x = 60 + i * step
        color = ORANGE if 0.42 <= t <= 0.62 else MUTED
        bars.append(f'<rect x="{x:.1f}" y="{300 - bh / 2:.1f}" width="{step * 0.55:.1f}" height="{bh:.1f}" fill="{color}"/>')
    px = 60 + 0.52 * (w - 120)
    body = "".join(bars)
    body += f'<line x1="{px:.1f}" y1="70" x2="{px:.1f}" y2="530" stroke="{PAPER}" stroke-width="3"/>'
    body += f'<path d="M60 560 V545 H740 V560" fill="none" stroke="{SLATE}" stroke-width="3"/>'
    save("servico-jingle.svg", svg(w, h, body, crop=(40, 40, 720, 540)))


# 2. Trilha: imagem em cima, música embaixo, tudo na mesma linha do tempo
def trilha():
    w, h = 800, 600
    b = f'<rect x="120" y="60" width="560" height="300" fill="{INK}" stroke="{PAPER}" stroke-width="3"/>'
    b += f'<circle cx="520" cy="170" r="34" fill="{ORANGE}"/>'
    b += f'<path d="M120 300 L250 220 L330 270 L430 200 L560 290 L680 235 V360 H120Z" fill="{SLATE}"/>'
    b += f'<path d="M120 330 L240 290 L360 325 L500 285 L680 320 V360 H120Z" fill="{MUTED}" opacity=".55"/>'
    # régua
    for i in range(0, 29):
        x = 120 + i * 20
        tall = 14 if i % 4 == 0 else 7
        b += f'<line x1="{x}" y1="392" x2="{x}" y2="{392 + tall}" stroke="{MUTED}" stroke-width="2"/>'
    # faixas
    b += f'<rect x="120" y="424" width="560" height="38" fill="{SLATE}"/>'
    for x0, x1 in [(120, 262), (266, 410), (414, 548), (552, 680)]:
        b += f'<rect x="{x0}" y="424" width="{x1 - x0}" height="38" fill="none" stroke="{PAPER}" stroke-width="2"/>'
    rnd = random.Random(3)
    b += f'<rect x="120" y="474" width="560" height="38" fill="{ORANGE}"/>'
    for i in range(0, 56):
        x = 126 + i * 10
        bh = 6 + 22 * abs(math.sin(i / 4.5)) * (0.5 + rnd.random() * 0.5)
        b += f'<line x1="{x}" y1="{493 - bh / 2:.1f}" x2="{x}" y2="{493 + bh / 2:.1f}" stroke="{INK}" stroke-width="3"/>'
    b += f'<rect x="120" y="524" width="560" height="26" fill="none" stroke="{MUTED}" stroke-width="2" stroke-dasharray="6 6"/>'
    b += f'<line x1="400" y1="60" x2="400" y2="560" stroke="{ORANGE}" stroke-width="3"/>'
    b += f'<path d="M390 52 H410 L400 68Z" fill="{ORANGE}"/>'
    save("servico-trilha.svg", svg(w, h, b, crop=(60, 36, 680, 510)))


# 3. Ambiente: planta de um espaço, com o som saindo de alto-falantes
def ambiente():
    w, h = 800, 600
    b = '<defs><clipPath id="sala"><rect x="110" y="90" width="580" height="420"/></clipPath></defs>'
    rings = ""
    for cx, cy in [(190, 160), (610, 170), (400, 450)]:
        for k in range(1, 8):
            op = 0.95 - k * 0.11
            rings += f'<circle cx="{cx}" cy="{cy}" r="{k * 38}" fill="none" stroke="{ORANGE}" stroke-width="3" opacity="{op:.2f}"/>'
    b += f'<g clip-path="url(#sala)">{rings}</g>'
    # paredes, com uma porta aberta na parede de baixo
    b += f'<path d="M110 90 H690 V510 H520 M440 510 H110 Z" fill="none" stroke="{PAPER}" stroke-width="5"/>'
    b += f'<path d="M520 510 A80 80 0 0 0 440 430" fill="none" stroke="{MUTED}" stroke-width="2"/>'
    for cx, cy in [(190, 160), (610, 170), (400, 450)]:
        b += f'<rect x="{cx - 11}" y="{cy - 11}" width="22" height="22" fill="{PAPER}"/><circle cx="{cx}" cy="{cy}" r="4" fill="{INK}"/>'
    # mobiliário simples
    b += f'<rect x="260" y="250" width="280" height="70" fill="none" stroke="{MUTED}" stroke-width="2" stroke-dasharray="7 7"/>'
    save("servico-ambiente.svg", svg(w, h, b, crop=(80, 60, 640, 480)))


# 4. Sessão de produção: várias faixas e trechos numa linha do tempo
def sessao():
    w, h = 960, 640
    rnd = random.Random(11)
    b = f'<rect x="150" y="56" width="790" height="22" fill="{INK}"/>'
    for i in range(0, 40):
        x = 150 + i * 20
        tall = 12 if i % 4 == 0 else 6
        b += f'<line x1="{x}" y1="{78 - tall}" x2="{x}" y2="78" stroke="{MUTED}" stroke-width="2"/>'
    b += f'<rect x="270" y="56" width="400" height="8" fill="{ORANGE}" opacity=".85"/>'
    palette = [ORANGE, PAPER, MUTED, SLATE, ORANGE, PAPER, MUTED]
    track_h, gap, top = 64, 10, 96
    for t in range(7):
        y = top + t * (track_h + gap)
        b += f'<rect x="20" y="{y}" width="120" height="{track_h}" fill="{INK}"/>'
        b += f'<rect x="20" y="{y}" width="8" height="{track_h}" fill="{palette[t]}"/>'
        b += f'<rect x="42" y="{y + 16}" width="{50 + rnd.randint(0, 40)}" height="6" fill="{MUTED}" opacity=".7"/>'
        b += f'<rect x="42" y="{y + 36}" width="{30 + rnd.randint(0, 30)}" height="6" fill="{SLATE}"/>'
        b += f'<rect x="150" y="{y}" width="790" height="{track_h}" fill="{INK}" opacity=".55"/>'
        x = 150 + rnd.randint(0, 50)
        while x < 880:
            ln = rnd.choice([80, 120, 160, 200, 240])
            ln = min(ln, 936 - x)
            if rnd.random() > 0.2:
                fill = palette[t]
                ink = INK if fill in (ORANGE, PAPER, MUTED) else MUTED
                b += f'<rect x="{x}" y="{y + 4}" width="{ln - 4}" height="{track_h - 8}" fill="{fill}"/>'
                for k in range(0, ln - 14, 7):
                    amp = 4 + rnd.random() * 18
                    cy = y + track_h / 2
                    b += f'<line x1="{x + 8 + k}" y1="{cy - amp:.1f}" x2="{x + 8 + k}" y2="{cy + amp:.1f}" stroke="{ink}" stroke-width="2" opacity=".75"/>'
            x += ln + rnd.choice([0, 0, 20, 60, 100])
    b += f'<line x1="560" y1="56" x2="560" y2="620" stroke="{PAPER}" stroke-width="3"/>'
    b += f'<path d="M550 48 H570 L560 64Z" fill="{PAPER}"/>'
    save("estudio-sessao.svg", svg(w, h, b))


# 5. Faixa de forma de onda, sem fundo, para dividir seções
def onda():
    rnd = random.Random(21)
    w, h, n = 1600, 220, 160
    bursts = [(0.08, 0.05, 0.5), (0.22, 0.06, 0.85), (0.38, 0.05, 0.6), (0.55, 0.07, 1.0), (0.72, 0.06, 0.7), (0.9, 0.05, 0.9)]
    step = w / n
    bars = []
    for i in range(n):
        t = i / (n - 1)
        amp = 0.08 + 0.92 * envelope(t, bursts)
        bh = max(6, amp * (0.5 + 0.5 * rnd.random()) * (h - 20))
        color = ORANGE if 0.5 <= t <= 0.6 else INK
        bars.append(f'<rect x="{i * step + 2:.1f}" y="{h / 2 - bh / 2:.1f}" width="{step * 0.5:.1f}" height="{bh:.1f}" fill="{color}"/>')
    save("onda.svg", svg(w, h, "".join(bars), bg=None))


# 6. Mesa de som, para a etapa de finalização e entrega
def mesa():
    w, h = 800, 600
    rnd = random.Random(5)
    b = ""
    for i in range(8):
        x = 90 + i * 85
        b += f'<rect x="{x - 3}" y="90" width="6" height="400" fill="{INK}"/>'
        for j in range(12):  # medidor
            on = j >= 12 - rnd.randint(3, 10)
            b += f'<rect x="{x + 18}" y="{110 + j * 30}" width="10" height="20" fill="{ORANGE if on else SLATE}"/>'
        ky = 150 + rnd.randint(0, 240)
        b += f'<rect x="{x - 20}" y="{ky}" width="40" height="26" fill="{PAPER}"/><line x1="{x - 20}" y1="{ky + 13}" x2="{x + 20}" y2="{ky + 13}" stroke="{INK}" stroke-width="3"/>'
        b += f'<circle cx="{x}" cy="530" r="14" fill="none" stroke="{MUTED}" stroke-width="3"/><line x1="{x}" y1="530" x2="{x + 8 * (1 if i % 2 else -1)}" y2="520" stroke="{ORANGE}" stroke-width="3"/>'
    save("mesa.svg", svg(w, h, b, crop=(50, 60, 700, 525)))


for fn in (jingle, trilha, ambiente, sessao, onda, mesa):
    fn()
