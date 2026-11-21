document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

/* Pequeno instrumento: cada clique dispara um único som, sem reprodução automática. */
(() => {
  const machine = document.querySelector('[data-beat-machine]');
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!machine || !Context) return;
  machine.hidden = false;
  let context, output, noiseBuffer;
  const timers = new WeakMap();
  machine.querySelectorAll('[data-drum]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        if (!context) {
          context = new Context();
          output = context.createGain();
          output.gain.value = 0.35;
          output.connect(context.destination);
          noiseBuffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate);
          const samples = noiseBuffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        }
        if (context.state !== 'running') await context.resume();
        document.dispatchEvent(new CustomEvent('abt-audio', { detail: 'pad' }));
        const now = context.currentTime, type = button.dataset.drum;
        const envelope = context.createGain();
        envelope.connect(output);
        if (type === 'kick') {
          const oscillator = context.createOscillator();
          oscillator.frequency.setValueAtTime(145, now);
          oscillator.frequency.exponentialRampToValueAtTime(44, now + 0.15);
          envelope.gain.setValueAtTime(1, now);
          envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          oscillator.connect(envelope);
          oscillator.start(now); oscillator.stop(now + 0.34);
          oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        } else {
          const source = context.createBufferSource(), filter = context.createBiquadFilter();
          source.buffer = noiseBuffer;
          filter.type = 'highpass'; filter.frequency.value = type === 'hat' ? 7800 : 1200;
          const duration = type === 'hat' ? 0.065 : 0.18;
          envelope.gain.setValueAtTime(type === 'hat' ? 0.32 : 0.65, now);
          envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
          source.connect(filter); filter.connect(envelope);
          source.start(now); source.stop(now + duration + 0.01);
          source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
        }
        button.classList.add('is-hit');
        clearTimeout(timers.get(button));
        timers.set(button, setTimeout(() => button.classList.remove('is-hit'), 140));
      } catch {
        machine.querySelector('.beat-error').hidden = false;
      }
    });
  });
})();

/*
 * Exemplos sonoros de cada serviço.
 * Se a lista de faixas (assets/audio/faixas.js) tiver trabalhos da categoria, eles aparecem aqui.
 * Sem trabalhos publicados, a página toca esboços sintetizados no próprio navegador, só para mostrar
 * o estilo de cada serviço. Eles não são trabalhos de clientes e a página avisa isso.
 */
(() => {
  const Context = window.AudioContext || window.webkitAudioContext;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const n = s => { const m = /^([A-G])([#b]?)(\d)$/.exec(s); return 12 * (+m[3] + 1) + NOTES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const f = s => mtof(n(s));

  let ctx, master, reverb, noiseBuf;
  function build(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5;
    const m = c.createGain(); m.gain.value = 0.85;
    m.connect(comp); comp.connect(c.destination);
    const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7); }
    const rv = c.createConvolver(); rv.buffer = ir;
    const rg = c.createGain(); rg.gain.value = 0.55; rv.connect(rg); rg.connect(m);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return { m, rv, nb };
  }
  function engine() {
    if (ctx) return ctx;
    ctx = new Context();
    ({ m: master, rv: reverb, nb: noiseBuf } = build(ctx));
    return ctx;
  }

  /* Vozes. s é a sessão do exemplo: { t0, bus, send } */
  function tone(s, { p, t, d, type = 'sine', g = 0.2, a = 0.01, r = 0.25, lp, det = 0, wet = 0, pluck = false, f0 }) {
    const o = ctx.createOscillator(), e = ctx.createGain(), st = s.t0 + t;
    o.type = type; o.frequency.value = f0 || f(p); o.detune.value = det;
    e.gain.setValueAtTime(0.0001, st);
    if (pluck) { e.gain.exponentialRampToValueAtTime(g, st + a); e.gain.exponentialRampToValueAtTime(0.0001, st + d + r); }
    else { e.gain.linearRampToValueAtTime(g, st + a); e.gain.setValueAtTime(g, st + d); e.gain.linearRampToValueAtTime(0.0001, st + d + r); }
    let src = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); src = fl; }
    src.connect(e); e.connect(s.bus);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; e.connect(w); w.connect(s.send); }
    o.start(st); o.stop(st + d + r + 0.05);
  }
  function hush(s, { t, d, g = 0.05, type = 'highpass', fr = 6000, q = 0.7, wet = 0, fr2, a = 0.005 }) {
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), e = ctx.createGain(), st = s.t0 + t;
    src.buffer = noiseBuf; src.loop = true;
    fl.type = type; fl.frequency.setValueAtTime(fr, st); fl.Q.value = q;
    if (fr2) fl.frequency.linearRampToValueAtTime(fr2, st + d);
    e.gain.setValueAtTime(0.0001, st); e.gain.linearRampToValueAtTime(g, st + Math.max(a, 0.002)); e.gain.linearRampToValueAtTime(0.0001, st + d);
    src.connect(fl); fl.connect(e); e.connect(s.bus);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; e.connect(w); w.connect(s.send); }
    src.start(st); src.stop(st + d + 0.05);
  }
  function kick(s, t, g = 0.8) {
    const o = ctx.createOscillator(), e = ctx.createGain(), st = s.t0 + t;
    o.frequency.setValueAtTime(150, st); o.frequency.exponentialRampToValueAtTime(42, st + 0.14);
    e.gain.setValueAtTime(g, st); e.gain.exponentialRampToValueAtTime(0.001, st + 0.38);
    o.connect(e); e.connect(s.bus); o.start(st); o.stop(st + 0.4);
  }
  function snare(s, t, g = 0.3) { hush(s, { t, d: 0.18, g, type: 'bandpass', fr: 1900, q: 0.8, wet: 0.2 }); tone(s, { f0: 190, t, d: 0.05, type: 'triangle', g: g * 0.6, r: 0.08, pluck: true }); }
  const hat = (s, t, g = 0.04) => hush(s, { t, d: 0.05, g, fr: 7500 });

  /* Esboços */
  const SKETCHES = {
    abertura(s) {
      const b = 60 / 112;
      [['C5', 0, 0.5], ['E5', 0.5, 0.5], ['G5', 1, 0.5], ['A5', 1.5, 0.5], ['G5', 2, 0.5], ['E5', 2.5, 0.5], ['D5', 3, 0.5], ['G5', 3.5, 0.5], ['C6', 4, 2]].forEach(([p, st, du]) => {
        tone(s, { p, t: st * b, d: du * b * 0.8, type: 'triangle', g: 0.22, a: 0.008, r: 0.3, pluck: true, wet: 0.25 });
        tone(s, { f0: f(p) * 2, t: st * b, d: du * b * 0.4, g: 0.05, pluck: true });
      });
      [['C3', 0], ['C3', 2], ['G2', 3], ['C3', 4]].forEach(([p, st]) => tone(s, { p, t: st * b, d: b * 0.9, type: 'triangle', g: 0.32, r: 0.2, pluck: true }));
      for (let i = 0; i < 12; i++) hat(s, i * 0.5 * b, i % 2 ? 0.035 : 0.05);
      ['C5', 'E5', 'G5', 'C6'].forEach(p => tone(s, { p, t: 4 * b, d: 1.1, type: 'square', g: 0.05, a: 0.01, r: 0.6, lp: 2600, wet: 0.35 }));
      return 6 * b + 1.4;
    },
    assinatura(s) {
      const b = 60 / 100;
      [['A4', 0, 0.5], ['A4', 0.75, 0.25], ['C5', 1, 0.5], ['D5', 1.5, 0.5], ['C5', 2, 0.5], ['A4', 2.5, 0.5], ['G4', 3, 0.5], ['F4', 3.5, 0.5], ['A4', 4, 0.5], ['C5', 4.5, 0.5], ['F5', 5, 1.5]].forEach(([p, st, du]) => {
        tone(s, { p, t: st * b, d: 0.3, g: 0.26, a: 0.005, r: 0.35, pluck: true, wet: 0.3 });
        tone(s, { f0: f(p) * 4, t: st * b, d: 0.12, g: 0.07, a: 0.003, r: 0.1, pluck: true });
      });
      [0, 2, 4, 5].forEach(st => tone(s, { p: st === 4 ? 'Bb2' : 'F2', t: st * b, d: b * 1.2, type: 'triangle', g: 0.3, r: 0.3, pluck: true }));
      for (let i = 0; i < 7; i++) hush(s, { t: (i + 0.5) * b, d: 0.09, g: 0.045, fr: 5500, q: 0.5 });
      ['F4', 'A4', 'C5'].forEach(p => tone(s, { p, t: 5 * b, d: 1.2, type: 'triangle', g: 0.09, a: 0.02, r: 0.9, wet: 0.4 }));
      return 7 * b + 1.2;
    },
    base(s) {
      const chords = [['A3', 'C4', 'E4', 'B4'], ['F3', 'A3', 'C4', 'E4'], ['C4', 'E4', 'G4', 'B4'], ['G3', 'B3', 'D4', 'A4']];
      const bass = ['A1', 'F1', 'C2', 'G1'];
      chords.forEach((ch, i) => {
        const t = i * 2.5;
        ch.forEach(p => [-7, 7].forEach(det => tone(s, { p, t, d: 2.6, type: 'sawtooth', det, g: 0.028, a: 0.9, r: 1.6, lp: 1000, wet: 0.6 })));
        tone(s, { p: bass[i], t, d: 2.4, g: 0.2, a: 0.4, r: 1.2 });
        ch.concat(ch).forEach((p, k) => tone(s, { f0: f(p) * 2, t: t + 0.3 + k * 0.3, d: 0.2, g: 0.045, a: 0.01, r: 0.5, pluck: true, wet: 0.5 }));
      });
      return 10 + 1.8;
    },
    cena(s) {
      const b = 60 / 112, steps = 16;
      const line = ['E2', 'E2', 'G2', 'E2', 'B1', 'B1', 'D2', 'E2'];
      for (let i = 0; i < steps; i++) {
        kick(s, i * b);
        if (i % 2 === 1) snare(s, i * b);
        hat(s, i * b + b / 2, 0.045); hat(s, i * b, 0.025);
        if (i < steps - 1) line.forEach((p, k) => tone(s, { p, t: i * b + k * (b / 2), d: b * 0.3, type: 'sawtooth', g: 0.11, a: 0.004, r: 0.1, lp: 520, pluck: true }));
      }
      [0, 4, 8, 12].forEach(i => ['E4', 'G4', 'B4'].forEach(p => tone(s, { p, t: i * b, d: b * 1.4, type: 'square', g: 0.04, a: 0.01, r: 0.3, lp: 1800, wet: 0.25 })));
      hush(s, { t: (steps - 4) * b, d: 4 * b, g: 0.12, type: 'bandpass', fr: 300, fr2: 6000, q: 1.5, a: 4 * b - 0.01 });
      hush(s, { t: steps * b, d: 1.0, g: 0.1, fr: 5000, wet: 0.5 });
      kick(s, steps * b, 0.9);
      return steps * b + 1.1;
    },
    loja(s) {
      [['C3', 'G3', 'B3', 'E4', 0, 7], ['A2', 'E3', 'G3', 'C4', 5, 7.5]].forEach(([a1, a2, a3, a4, t, d]) =>
        [a1, a2, a3, a4].forEach(p => [-6, 6].forEach(det => tone(s, { p, t, d, type: 'triangle', det, g: 0.05, a: 2.4, r: 2.6, lp: 750, wet: 0.5 }))));
      [[1.2, 'E5'], [3, 'G5'], [4.4, 'D5'], [6.3, 'A4'], [7.8, 'C5'], [9.5, 'E5'], [10.7, 'G4']].forEach(([t, p]) => {
        tone(s, { p, t, d: 1.6, g: 0.09, a: 0.008, r: 1.2, pluck: true, wet: 0.8 });
        tone(s, { f0: f(p) * 3.76, t, d: 0.3, g: 0.014, a: 0.005, r: 0.3, pluck: true, wet: 0.8 });
      });
      hush(s, { t: 0, d: 12, g: 0.03, type: 'lowpass', fr: 500, q: 0.4, a: 3 });
      return 12 + 2.4;
    },
    paisagem(s) {
      const st = s.t0, drone = ctx.createBiquadFilter();
      drone.type = 'lowpass'; drone.frequency.setValueAtTime(180, st);
      drone.frequency.linearRampToValueAtTime(520, st + 6); drone.frequency.linearRampToValueAtTime(200, st + 12);
      const de = ctx.createGain(); de.gain.setValueAtTime(0.0001, st); de.gain.linearRampToValueAtTime(0.16, st + 3); de.gain.setValueAtTime(0.16, st + 10); de.gain.linearRampToValueAtTime(0.0001, st + 13);
      drone.connect(de); de.connect(s.bus); const dw = ctx.createGain(); dw.gain.value = 0.5; de.connect(dw); dw.connect(s.send);
      [['D2', 'sawtooth', 0], ['A2', 'sine', 0], ['D3', 'triangle', 4]].forEach(([p, type, det]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f(p); o.detune.value = det; o.connect(drone); o.start(st); o.stop(st + 13.2);
      });
      [[2, 'D5'], [4.2, 'A5'], [6.8, 'F#5'], [9, 'E5']].forEach(([t, p]) => {
        tone(s, { p, t, d: 2.4, g: 0.07, a: 0.01, r: 2.2, pluck: true, wet: 0.9 });
        tone(s, { f0: f(p) * 2.01, t, d: 1.2, g: 0.025, a: 0.01, r: 1.6, pluck: true, wet: 0.9 });
      });
      hush(s, { t: 1, d: 10, g: 0.07, type: 'bandpass', fr: 400, fr2: 1300, q: 1.2, wet: 0.5, a: 4 });
      return 13 + 2.2;
    }
  };

  const EXEMPLOS = {
    jingle: [
      { k: 'abertura', titulo: 'Vinheta de abertura', desc: 'Melodia curta e brilhante, para abrir um podcast ou um programa.', dur: 4 },
      { k: 'assinatura', titulo: 'Assinatura de anúncio', desc: 'Frase musical simples para fechar um comercial, com cara de marimba.', dur: 5 }
    ],
    trilha: [
      { k: 'base', titulo: 'Base suave para fala', desc: 'Acordes longos que ficam por baixo de uma narração, sem competir com ela.', dur: 11 },
      { k: 'cena', titulo: 'Cena em movimento', desc: 'Ritmo marcado que acompanha os cortes de um vídeo mais dinâmico.', dur: 9 }
    ],
    ambiente: [
      { k: 'loja', titulo: 'Textura de loja', desc: 'Música calma e discreta, feita para tocar por horas em um espaço.', dur: 14 },
      { k: 'paisagem', titulo: 'Paisagem sonora', desc: 'Camadas lentas e graves, pensadas para uma instalação ou exposição.', dur: 15 }
    ]
  };

  const fmt = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const CATEGORIA = { jingle: 'Jingle', trilha: 'Trilha', ambiente: 'Ambiente' };

  /* Toca ao vivo, para os exemplos dentro de cada serviço */
  async function live(key) {
    engine(); await ctx.resume();
    const bus = ctx.createGain(), send = ctx.createGain();
    bus.connect(master); send.connect(reverb);
    const dur = SKETCHES[key]({ t0: ctx.currentTime + 0.06, bus, send });
    return {
      dur,
      stop() {
        const now = ctx.currentTime;
        [bus, send].forEach(g => { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 0.12); });
        setTimeout(() => { bus.disconnect(); send.disconnect(); }, 400);
      }
    };
  }

  /* Gera o esboço como arquivo de áudio (WAV) na memória, para o player principal tocar como uma faixa comum */
  function wav(buf) {
    const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, bytes = 44 + n * ch * 2, v = new DataView(new ArrayBuffer(bytes));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, bytes - 8, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * ch * 2, true);
    const data = []; let peak = 0;
    for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); data.push(d); for (let i = 0; i < n; i += 4) peak = Math.max(peak, Math.abs(d[i])); }
    const k = peak > 0 ? Math.min(1.5, 0.9 / peak) : 1;
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, data[c][i] * k)); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; }
    return new Blob([v], { type: 'audio/wav' });
  }
  async function render(key) {
    const SR = 44100;
    const run = c => {
      const saved = [ctx, master, reverb, noiseBuf];
      try {
        ctx = c; ({ m: master, rv: reverb, nb: noiseBuf } = build(c));
        const bus = c.createGain(), send = c.createGain();
        bus.connect(master); send.connect(reverb);
        return SKETCHES[key]({ t0: 0, bus, send });
      } finally { [ctx, master, reverb, noiseBuf] = saved; }
    };
    const dur = run(new OfflineContext(2, SR, SR));
    const oc = new OfflineContext(2, Math.ceil(dur * SR), SR);
    run(oc);
    return wav(await oc.startRendering());
  }

  /* Os esboços no formato da lista de faixas, para o player principal */
  const faixas = () => Object.keys(EXEMPLOS).flatMap(cat => EXEMPLOS[cat].map(x => ({
    titulo: x.titulo, arquivo: 'sketch:' + x.k, categoria: CATEGORIA[cat], descricao: x.desc, duracao: fmt(x.dur), demo: true
  })));

  window.AbtSom = { EXEMPLOS, live, render, faixas, aoVivo: !!Context, offline: !!OfflineContext };
})();

/* Player de faixas. A lista vem de assets/audio/faixas.js e nada toca sem o clique da pessoa. */
(() => {
  const root = document.querySelector('[data-listen]');
  if (!root) return;
  const reais = (window.FAIXAS || []).filter(f => f && f.titulo && f.arquivo);
  const demo = !reais.length && window.FAIXAS_EXEMPLOS !== false && !!window.AbtSom && AbtSom.offline;
  const all = reais.length ? reais : (demo ? AbtSom.faixas() : []);

  const $ = s => root.querySelector(s);
  const empty = $('.listen-empty'), player = $('.player'), playlist = $('.playlist'), list = $('.tracklist'), cats = $('.cats');
  const playBtn = $('.play'), seek = $('.seek'), canvas = $('.wave-canvas'), g = canvas.getContext('2d');
  const tCur = $('.t-cur'), tDur = $('.t-dur'), errorBox = $('.player-error'), coverBox = $('.cover'), demoNote = $('.player-demo');
  const wrap = $('.wave-wrap'), tip = $('.wave-tip'), volume = $('.volume'), muteBtn = $('.mute');
  const heroLink = document.querySelector('.hero-listen');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  empty.hidden = true; player.hidden = false; playlist.hidden = false;

  const audio = new Audio();
  audio.preload = 'none';
  const resolved = new Map(), peaksCache = new Map();
  let ready = Promise.resolve(), tracks = all, index = 0, raf = 0, level = 0, hoverX = null, pendingSeek = null, accent = '#FFC629';
  const flat = Array(200).fill(0.18);

  /* Faixas "sketch:" são esboços gerados no navegador. Viram um arquivo na memória na primeira vez que são tocadas. */
  const srcFor = async t => {
    if (!t.arquivo.startsWith('sketch:')) return t.arquivo;
    if (!resolved.has(t.arquivo)) resolved.set(t.arquivo, URL.createObjectURL(await AbtSom.render(t.arquivo.slice(7))));
    return resolved.get(t.arquivo);
  };

  const fmt = s => Number.isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
  const secs = txt => { const m = /^(\d+):(\d{2})$/.exec(txt || ''); return m ? +m[1] * 60 + +m[2] : 0; };
  const current = () => tracks[index];
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const PLAY = 'M7 4.5v15l12-7.5z';

  /* Cor e nome de cada tipo de trabalho */
  const ACENTO = { jingle: 'var(--sol)', trilha: 'var(--laranja)', ambiente: 'var(--ceu)', 'sound design': 'var(--verde)' };
  const NOME = { jingle: 'Jingles', trilha: 'Trilhas', ambiente: 'Ambientes', 'sound design': 'Sound design' };
  const SOBRE = { jingle: 'Músicas curtas para marcas', trilha: 'Música para vídeo e cena', ambiente: 'Sons para espaços', 'sound design': 'Efeitos, movimentos e texturas' };
  const kind = t => (t.categoria || '').toLowerCase();
  const accentOf = t => ACENTO[kind(t)] || 'var(--sol)';

  /* Capas geradas com as formas da marca, uma por faixa. Uma capa própria (campo "capa") tem prioridade. */
  const C = { sol: '#FFC629', lar: '#FF6B35', ceu: '#8ED8F8', verde: '#00B87C', papel: '#FFE5CF', tinta: '#151718' };
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function coverSvg(t) {
    const h = hash(t.titulo), a = (h % 21) - 10, b = ((h >> 5) % 21) - 10;
    let body;
    if (kind(t) === 'trilha') {
      body = `<rect width="200" height="200" fill="${C.lar}"/><g class="pulse"><circle cx="${140 + a}" cy="${58 + b}" r="34" fill="${C.sol}"/></g><path d="M26 190V122A48 48 0 0 1 122 122V190Z" fill="${C.papel}"/><path d="M58 190V132A16 16 0 0 1 90 132V190Z" fill="${C.tinta}"/><rect x="132" y="118" width="46" height="72" rx="23" fill="${C.ceu}"/>`;
    } else if (kind(t) === 'ambiente') {
      const x = 100 + a, y = 104 + b;
      body = `<rect width="200" height="200" fill="${C.ceu}"/><g class="pulse" fill="none" stroke-width="10"><circle cx="${x}" cy="${y}" r="82" stroke="${C.verde}"/><circle cx="${x}" cy="${y}" r="58" stroke="${C.tinta}"/><circle cx="${x}" cy="${y}" r="34" stroke="${C.verde}"/></g><circle cx="${x}" cy="${y}" r="11" fill="${C.tinta}"/><path d="M0 176Q25 156 50 176T100 176T150 176T200 176" fill="none" stroke="${C.tinta}" stroke-width="7"/>`;
    } else {
      body = `<rect width="200" height="200" fill="${C.sol}"/><g class="pulse"><circle cx="${96 + a}" cy="${92 + b}" r="70" fill="${C.lar}"/></g><path d="M200 200V118A82 82 0 0 0 118 200Z" fill="${C.tinta}"/><circle cx="40" cy="40" r="13" fill="${C.papel}"/><g fill="${C.tinta}"><rect x="24" y="146" width="10" height="26" rx="5"/><rect x="40" y="132" width="10" height="54" rx="5"/><rect x="56" y="142" width="10" height="34" rx="5"/></g>`;
    }
    return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  function setCover(el, t) {
    el.innerHTML = '';
    if (t.capa) { const im = document.createElement('img'); im.src = t.capa; im.alt = ''; el.appendChild(im); } else el.innerHTML = coverSvg(t);
  }

  /* Sem faixas na lista e sem esboços: o player aparece em espera, desabilitado, e nenhuma música é inventada. */
  if (!all.length) {
    player.classList.add('is-empty');
    $('.now-cat').textContent = 'Em breve';
    $('.now-title').textContent = 'Nenhuma faixa publicada ainda';
    $('.now-desc').innerHTML = 'As faixas estão sendo selecionadas. Enquanto isso, <a class="text-link" href="mailto:contato@abt.dev.br?subject=Projeto%20musical">escreva contando o que você procura</a>.';
    root.querySelectorAll('.play, .seek, .prev, .next, .mute, .volume').forEach(el => { el.disabled = true; });
    list.setAttribute('aria-hidden', 'true');
    list.innerHTML = '<li class="track-placeholder"><span class="track-cover"></span><span class="ph-text"><span class="ph-bar"></span><span class="ph-bar short"></span></span></li>'.repeat(3);
    const redraw = () => drawWave();
    if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(canvas); else window.addEventListener('resize', redraw);
    drawWave();
    return;
  }
  if (heroLink && !demo) heroLink.hidden = false;

  /* Forma de onda: barras arredondadas, parte tocada na cor do tipo, passagem do mouse como prévia */
  function drawWave() {
    const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const t = current(), peaks = (t && peaksCache.get(t.arquivo)) || flat;
    const gap = 3, bw = 4, n = Math.max(24, Math.floor((w + gap) / (bw + gap))), step = w / n;
    const progress = audio.duration ? audio.currentTime / audio.duration : 0;
    for (let i = 0; i < n; i++) {
      const frac = (i + 0.5) / n, p = peaks[Math.floor(i / n * peaks.length)], bh = Math.max(5, p * h * 0.92);
      g.fillStyle = frac <= progress ? accent : (hoverX != null && frac <= hoverX / w ? 'rgba(255,229,207,.62)' : 'rgba(255,229,207,.26)');
      const x = i * step, y = (h - bh) / 2, ww = step - gap;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, ww, bh, 2); else g.rect(x, y, ww, bh);
      g.fill();
    }
  }

  async function loadPeaks(t) {
    if (peaksCache.has(t.arquivo)) return;
    try {
      const res = await fetch(await srcFor(t));
      if (!res.ok || (+res.headers.get('content-length') || 0) > 40e6) return;
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const data = await ac.decodeAudioData(await res.arrayBuffer());
      if (ac.close) ac.close();
      const ch = data.getChannelData(0), N = 200, size = Math.max(1, Math.floor(ch.length / N)), skip = Math.max(1, size >> 6), peaks = [];
      for (let i = 0; i < N; i++) {
        let m = 0;
        for (let j = i * size; j < (i + 1) * size && j < ch.length; j += skip) m = Math.max(m, Math.abs(ch[j]));
        peaks.push(m);
      }
      const max = Math.max(...peaks) || 1;
      peaksCache.set(t.arquivo, peaks.map(v => Math.max(0.06, v / max)));
      drawWave();
    } catch (e) { /* sem forma de onda real, a barra simples continua funcionando */ }
  }

  /* Enquanto toca, a capa pulsa com a intensidade da faixa naquele ponto. */
  function frame() {
    const dur = audio.duration || 0, prog = dur ? audio.currentTime / dur : 0, t = current();
    tCur.textContent = fmt(audio.currentTime);
    if (dur) seek.value = prog * 1000;
    const peaks = (t && peaksCache.get(t.arquivo)) || flat;
    const target = reduce ? 0 : peaks[Math.min(peaks.length - 1, Math.floor(prog * peaks.length))];
    level += (target - level) * 0.35;
    coverBox.style.setProperty('--lvl', level.toFixed(3));
    const row = list.querySelector('.track[aria-current]');
    if (row) row.style.setProperty('--p', prog.toFixed(4));
    drawWave();
    raf = audio.paused ? 0 : requestAnimationFrame(frame);
  }
  const startLoop = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const stopLoop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; level = 0; coverBox.style.setProperty('--lvl', 0); };

  function setPlaying(on) {
    playBtn.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-label', on ? 'Pausar' : 'Tocar');
    root.classList.toggle('is-playing', on);
  }

  function renderList() {
    list.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'track'; b.dataset.i = i; b.style.setProperty('--accent', accentOf(t));
      b.innerHTML = `<span class="track-cover"></span><span class="track-text"><span class="track-title"></span><span class="track-desc"></span><span class="track-meta"><span class="track-cat"></span><span class="track-dur"></span></span></span><span class="track-state" aria-hidden="true">${icon(PLAY)}<i></i><i></i><i></i></span>`;
      setCover(b.querySelector('.track-cover'), t);
      b.querySelector('.track-title').textContent = t.titulo;
      b.querySelector('.track-desc').textContent = t.descricao || '';
      b.querySelector('.track-cat').textContent = (t.categoria || '') + (t.demo ? ' · esboço' : '');
      b.querySelector('.track-dur').textContent = t.duracao || '';
      b.setAttribute('aria-label', 'Tocar ' + t.titulo);
      li.appendChild(b); list.appendChild(li);
    });
  }

  function select(i, play) {
    index = (i + tracks.length) % tracks.length;
    const t = current();
    errorBox.hidden = true; pendingSeek = null;
    audio.pause();
    player.classList.add('is-loading');
    ready = srcFor(t).then(url => { if (current() === t) audio.src = url; }).catch(() => { errorBox.hidden = false; })
      .finally(() => { if (current() === t) player.classList.remove('is-loading'); });
    accent = accentOf(t);
    player.style.setProperty('--accent', accent);
    accent = getComputedStyle(player).getPropertyValue('--accent').trim() || '#FFC629';
    if (demoNote) demoNote.hidden = !t.demo;
    $('.now-cat').textContent = (t.categoria || '') + (t.demo ? ' · esboço' : '');
    $('.now-title').textContent = t.titulo;
    $('.now-desc').textContent = t.descricao || '';
    setCover(coverBox, t);
    tCur.textContent = '0:00'; tDur.textContent = t.duracao || '0:00';
    seek.value = 0;
    list.querySelectorAll('.track').forEach((b, k) => { b.toggleAttribute('aria-current', k === index); if (k !== index) b.style.removeProperty('--p'); });
    setPlaying(false); stopLoop();
    drawWave();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.titulo, artist: 'Abt Sonora', album: t.categoria || 'Abt Sonora' });
    }
    if (t.demo) ready.then(() => loadPeaks(t));
    if (play) ready.then(() => { if (current() === t) audio.play().catch(() => { errorBox.hidden = false; }); });
  }

  const toggle = () => ready.then(() => { if (audio.paused) audio.play().catch(() => { errorBox.hidden = false; }); else audio.pause(); });
  const jump = d => { if (audio.duration) { audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + d)); drawWave(); } };

  /* Abas por tipo, com contagem. Só aparecem quando há mais de um tipo. */
  function renderCats() {
    const names = [...new Set(all.map(f => f.categoria).filter(Boolean))];
    if (names.length < 2) return;
    cats.hidden = false;
    const itens = [{ label: 'Todas', sobre: 'Tudo o que está publicado', count: all.length, cor: 'var(--papel)', cat: null },
      ...names.map(c => ({ label: NOME[c.toLowerCase()] || c, sobre: SOBRE[c.toLowerCase()] || '', count: all.filter(f => f.categoria === c).length, cor: accentOf({ categoria: c }), cat: c }))];
    itens.forEach((it, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cat'; b.setAttribute('aria-pressed', String(k === 0)); b.style.setProperty('--accent', it.cor);
      b.innerHTML = '<span class="cat-dot"></span><span class="cat-text"><strong></strong><span></span></span><span class="cat-count"></span>';
      b.querySelector('strong').textContent = it.label;
      b.querySelector('.cat-text span').textContent = it.sobre;
      b.querySelector('.cat-count').textContent = it.count;
      b.addEventListener('click', () => {
        cats.querySelectorAll('.cat').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        audio.pause();
        tracks = it.cat ? all.filter(f => f.categoria === it.cat) : all;
        renderList(); select(0, false);
      });
      cats.appendChild(b);
    });
  }

  /* Eventos */
  playBtn.addEventListener('click', toggle);
  $('.prev').addEventListener('click', () => select(index - 1, !audio.paused));
  $('.next').addEventListener('click', () => select(index + 1, !audio.paused));
  list.addEventListener('click', e => {
    const b = e.target.closest('.track'); if (!b) return;
    const i = +b.dataset.i;
    if (i === index) toggle(); else select(i, true);
  });
  /* Clicar ou arrastar na onda pula para o ponto e, se estiver pausado, já começa a tocar dali */
  seek.addEventListener('input', () => {
    if (audio.duration) { audio.currentTime = seek.value / 1000 * audio.duration; drawWave(); }
    else pendingSeek = seek.value / 1000;
    if (audio.paused) toggle();
  });
  wrap.addEventListener('pointermove', e => {
    const r = wrap.getBoundingClientRect(), x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    hoverX = x; tip.hidden = false; tip.style.left = Math.max(22, Math.min(r.width - 22, x)) + 'px';
    tip.textContent = fmt(x / r.width * (audio.duration || secs(current().duracao)));
    if (audio.paused) drawWave();
  });
  wrap.addEventListener('pointerleave', () => { hoverX = null; tip.hidden = true; drawWave(); });
  root.addEventListener('keydown', e => {
    const t = e.target;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { if (t === seek) { e.preventDefault(); jump(e.key === 'ArrowLeft' ? -5 : 5); } return; }
    if ((e.key === ' ' || e.key === 'k') && (t === seek || !t.closest('button, a, input, select, textarea'))) { e.preventDefault(); toggle(); }
  });

  /* Volume lembrado entre visitas */
  const savedVol = (() => { try { return localStorage.getItem('abt-volume'); } catch { return null; } })();
  if (savedVol !== null && !Number.isNaN(+savedVol)) { volume.value = savedVol; audio.volume = Math.max(0, Math.min(1, +savedVol / 100)); } else audio.volume = 0.8;
  volume.addEventListener('input', () => {
    audio.volume = volume.value / 100; audio.muted = audio.volume === 0;
    muteBtn.classList.toggle('is-muted', audio.muted);
    try { localStorage.setItem('abt-volume', volume.value); } catch { /* sem armazenamento, segue normal */ }
  });
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle('is-muted', audio.muted);
    muteBtn.setAttribute('aria-label', audio.muted ? 'Ativar o som' : 'Silenciar');
  });

  audio.addEventListener('play', () => { setPlaying(true); startLoop(); loadPeaks(current()); document.dispatchEvent(new CustomEvent('abt-audio', { detail: 'player' })); });
  document.addEventListener('abt-audio', e => { if (e.detail !== 'player') audio.pause(); });
  audio.addEventListener('pause', () => { setPlaying(false); stopLoop(); drawWave(); });
  audio.addEventListener('ended', () => {
    if (index < tracks.length - 1) select(index + 1, true);
    else { audio.currentTime = 0; seek.value = 0; tCur.textContent = '0:00'; setPlaying(false); stopLoop(); drawWave(); }
  });
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) { errorBox.hidden = false; setPlaying(false); stopLoop(); } });
  audio.addEventListener('loadedmetadata', () => {
    tDur.textContent = fmt(audio.duration);
    const dur = list.querySelector('.track[aria-current] .track-dur');
    if (dur && !current().duracao) dur.textContent = fmt(audio.duration);
    if (pendingSeek !== null) { audio.currentTime = pendingSeek * audio.duration; pendingSeek = null; }
  });
  audio.addEventListener('timeupdate', () => {
    tCur.textContent = fmt(audio.currentTime);
    if (audio.duration) {
      const prog = audio.currentTime / audio.duration;
      seek.value = prog * 1000;
      seek.setAttribute('aria-valuetext', `${fmt(audio.currentTime)} de ${fmt(audio.duration)}`);
      const row = list.querySelector('.track[aria-current]');
      if (row) row.style.setProperty('--p', prog.toFixed(4));
    }
    if (!raf) drawWave();
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => select(index - 1, true));
    navigator.mediaSession.setActionHandler('nexttrack', () => select(index + 1, true));
  }
  if ('ResizeObserver' in window) new ResizeObserver(drawWave).observe(canvas); else window.addEventListener('resize', drawWave);

  renderCats(); renderList(); select(0, false);
})();

/* Botão que copia o e-mail. Sem suporte a área de transferência ele continua escondido e o link funciona igual. */
(() => {
  const button = document.querySelector('[data-copy-mail]');
  if (!button || !navigator.clipboard) return;
  button.hidden = false;
  const label = button.textContent;
  let timer;
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copyMail); button.textContent = 'E-mail copiado'; }
    catch { button.textContent = 'Copie o endereço acima'; }
    clearTimeout(timer);
    timer = setTimeout(() => { button.textContent = label; }, 2200);
  });
})();

/* Menu do celular. Sem JavaScript os links principais continuam no cabeçalho. */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const header = document.querySelector('.header');
  if (!toggle || !header) return;
  document.documentElement.classList.add('js-menu');
  toggle.hidden = false;
  const set = open => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fechar' : 'Menu';
  };
  toggle.addEventListener('click', () => set(!header.classList.contains('is-open')));
  header.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && header.classList.contains('is-open')) { set(false); toggle.focus(); } });
  window.matchMedia('(min-width: 641px)').addEventListener('change', e => { if (e.matches) set(false); });
})();

/* Exemplos dentro de cada serviço. Usa trabalhos reais da categoria, se houver, e senão os esboços. */
(() => {
  const blocks = document.querySelectorAll('[data-examples]');
  if (!blocks.length || !window.AbtSom) return;
  const CATEGORIAS = { jingle: 'jingle', trilha: 'trilha', ambiente: 'ambiente' };
  const real = (window.FAIXAS || []).filter(x => x && x.titulo && x.arquivo);

  const PLAY = 'M7 4.5v15l12-7.5z', PAUSE = 'M6 4h4.5v16H6zM13.5 4H18v16h-4.5z';
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  let current = null; // { stop() }
  const stopCurrent = () => { if (current) { current.stop(); current = null; } };
  document.addEventListener('abt-audio', e => { if (e.detail !== 'example') stopCurrent(); });

  const fileAudio = new Audio();
  fileAudio.preload = 'none';

  blocks.forEach(block => {
    const kind = block.dataset.examples;
    const doBrowser = AbtSom.aoVivo;
    const trabalhos = real.filter(x => (x.categoria || '').toLowerCase() === CATEGORIAS[kind]).slice(0, 2);
    const items = trabalhos.length
      ? trabalhos.map(x => ({ real: x, titulo: x.titulo, desc: x.descricao || '', dur: x.duracao || '' }))
      : (doBrowser ? AbtSom.EXEMPLOS[kind] : []);
    if (!items.length) return;

    block.hidden = false;
    block.innerHTML = '<p class="ex-title">' + (trabalhos.length ? 'Ouça trabalhos' : 'Ouça como soa') + '</p>';
    items.forEach(it => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ex';
      b.innerHTML = '<span class="ex-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + PLAY + '"/></svg></span><span class="ex-text"><strong></strong><span></span></span><span class="ex-dur"></span>';
      b.querySelector('strong').textContent = it.titulo;
      b.querySelector('.ex-text span').textContent = it.desc;
      b.querySelector('.ex-dur').textContent = it.real ? (it.dur || '') : fmt(it.dur);
      b.setAttribute('aria-label', 'Tocar exemplo, ' + it.titulo);
      const icon = b.querySelector('path'), set = on => {
        b.classList.toggle('is-playing', on);
        icon.setAttribute('d', on ? PAUSE : PLAY);
        b.setAttribute('aria-label', (on ? 'Pausar exemplo, ' : 'Tocar exemplo, ') + it.titulo);
      };
      b.addEventListener('click', async () => {
        if (b.classList.contains('is-playing')) { stopCurrent(); return; }
        stopCurrent();
        document.dispatchEvent(new CustomEvent('abt-audio', { detail: 'example' }));
        if (it.real) {
          fileAudio.src = it.real.arquivo;
          const end = () => { set(false); fileAudio.removeEventListener('ended', end); };
          fileAudio.addEventListener('ended', end);
          try { await fileAudio.play(); } catch { set(false); return; }
          b.style.setProperty('--dur', '0s'); set(true);
          current = { stop() { fileAudio.pause(); set(false); fileAudio.removeEventListener('ended', end); } };
          return;
        }
        try {
          const run = await AbtSom.live(it.k);
          b.style.setProperty('--dur', run.dur.toFixed(1) + 's');
          set(true);
          const timer = setTimeout(() => { if (current && current.id === timer) current = null; set(false); }, run.dur * 1000);
          current = { id: timer, stop() { clearTimeout(timer); set(false); run.stop(); } };
        } catch { set(false); block.hidden = true; }
      });
      block.appendChild(b);
    });
    const nota = document.createElement('p');
    nota.className = 'ex-note';
    nota.textContent = trabalhos.length ? '' : 'Esboços sintetizados no navegador, só para mostrar o estilo. Não são trabalhos de clientes.';
    if (nota.textContent) block.appendChild(nota);
  });
})();
