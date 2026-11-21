/* Comparação A/B: duas fontes no mesmo relógio, com troca suave e posição compartilhada. */
(() => {
  const root = document.querySelector('[data-comparison]');
  if (!root) return;
  const config = window.COMPARACAO_SONORA || {};
  const Context = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const $ = selector => root.querySelector(selector);
  const play = $('[data-compare-play]'), seek = $('#compare-seek'), status = $('[data-compare-state]');
  const modes = [...root.querySelectorAll('[data-compare-mode]')];
  const real = !!(config.antes && config.depois);
  const moments = (config.momentos || []).filter(m => Number.isFinite(m.tempo) && m.tempo >= 0 && m.nome).sort((a, b) => a.tempo - b.tempo);
  const fmt = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');

  if (config.titulo) $('[data-compare-title]').textContent = config.titulo;
  if (config.descricao) $('[data-compare-description]').textContent = config.descricao;
  modes[0].lastChild.textContent = config.rotuloAntes || 'Versão original';
  modes[1].lastChild.textContent = config.rotuloDepois || 'Com sound design';
  const scene = $('.compare-scene');
  scene.replaceChildren(...moments.map(m => {
    const item = document.createElement('span'), dot = document.createElement('i');
    item.append(dot, document.createTextNode(m.nome));
    return item;
  }));
  scene.hidden = !moments.length;
  if (real) $('[data-compare-note]').textContent = 'Compare duas versões do mesmo trecho. Alterne entre antes e depois durante a reprodução.';
  if (real) $('[data-compare-duration]').textContent = '—';
  if (!real && config.demo === false) {
    status.textContent = 'Os exemplos de antes e depois estão sendo preparados.';
    $('[data-compare-note]').textContent = 'Em breve, duas versões para ouvir lado a lado.';
    return;
  }
  if (!Context || (!real && !Offline)) {
    status.textContent = 'Este navegador não oferece suporte à comparação. Experimente outro navegador.';
    return;
  }
  $('.compare-modes').hidden = false;
  $('.compare-controls').hidden = false;
  status.textContent = 'Selecione uma versão e aperte o play.';

  let context, output, gains, buffers, preparing;
  let sources = [], position = 0, started = 0, duration = 8, playing = false, frame = 0, version = 0;
  let mode = 'after';

  function engine() {
    if (context) return;
    context = new Context();
    output = context.createGain();
    output.gain.value = 0.65;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -8; limiter.ratio.value = 6;
    output.connect(limiter); limiter.connect(context.destination);
    gains = [context.createGain(), context.createGain()];
    gains.forEach(g => g.connect(output));
    setMix();
  }
  function setMix() {
    if (!context) return;
    gains.forEach((gain, index) => {
      const value = (mode === 'before' ? 0 : 1) === index ? 1 : 0;
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(value, context.currentTime, 0.012);
    });
  }
  function elapsed() { return playing ? Math.min(duration, Math.max(0, context.currentTime - started)) : position; }
  function paint() {
    const time = elapsed();
    seek.value = String(Math.round(time / duration * 1000));
    seek.setAttribute('aria-valuetext', `${fmt(time)} de ${fmt(duration)}`);
    $('[data-compare-time]').textContent = fmt(time);
    [...scene.children].forEach((el, i) => {
      const active = playing && time >= moments[i].tempo && time < (moments[i + 1]?.tempo ?? duration);
      el.classList.toggle('is-active', active);
    });
    root.classList.toggle('is-playing', playing);
    play.textContent = playing ? 'Pausar' : (position > 0 ? 'Continuar' : 'Ouvir comparação');
    play.setAttribute('aria-label', playing ? 'Pausar comparação' : 'Tocar comparação');
    if (playing) frame = requestAnimationFrame(paint);
  }
  function pause(reset = false) {
    version++;
    position = reset ? 0 : elapsed();
    playing = false;
    cancelAnimationFrame(frame);
    sources.forEach(source => { try { source.stop(); } catch { /* A fonte já terminou. */ } });
    sources = [];
    paint();
  }
  function start() {
    if (position >= duration - 0.01) position = 0;
    const ticket = ++version, time = context.currentTime + 0.04;
    started = time - position;
    sources = buffers.map((buffer, index) => {
      const source = context.createBufferSource();
      source.buffer = buffer; source.connect(gains[index]);
      source.onended = () => {
        source.disconnect();
        if (index === 0 && ticket === version && playing) {
          pause(true);
          status.textContent = 'Fim da comparação. Você pode ouvir novamente ou trocar de versão.';
        }
      };
      source.start(time, position, duration - position);
      return source;
    });
    playing = true;
    status.textContent = 'Troque entre antes e depois sem reiniciar o trecho.';
    paint();
  }

  // Estudo ilustrativo de interface. A mesma base de sinais aparece nas duas versões.
  async function sketch(layered) {
    const rate = 32000, ctx = new Offline(2, rate * 8, rate);
    const bus = ctx.createGain(); bus.gain.value = 0.7; bus.connect(ctx.destination);
    let seed = 41;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
    const noise = ctx.createBuffer(1, rate, rate), samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random();
    const impulse = ctx.createBuffer(2, rate, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channel = impulse.getChannelData(ch);
      for (let i = 0; i < channel.length; i++) channel[i] = random() * Math.pow(1 - i / rate, 3);
    }
    const reverb = ctx.createConvolver(), wet = ctx.createGain();
    reverb.buffer = impulse; wet.gain.value = 0.32;
    reverb.connect(wet); wet.connect(bus);
    function tone(time, pitch, length, level, type = 'sine', endPitch) {
      const source = ctx.createOscillator(), envelope = ctx.createGain();
      source.type = type; source.frequency.setValueAtTime(pitch, time);
      if (endPitch) source.frequency.exponentialRampToValueAtTime(endPitch, time + length);
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(level, time + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
      source.connect(envelope); envelope.connect(bus);
      if (layered) envelope.connect(reverb);
      source.start(time); source.stop(time + length + 0.01);
    }
    function sweep(time, length, from, to) {
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain();
      source.buffer = noise; filter.type = 'bandpass'; filter.Q.value = 1.4;
      filter.frequency.setValueAtTime(from, time); filter.frequency.exponentialRampToValueAtTime(to, time + length);
      envelope.gain.setValueAtTime(0, time); envelope.gain.linearRampToValueAtTime(0.23, time + length * 0.6); envelope.gain.linearRampToValueAtTime(0, time + length);
      source.connect(filter); filter.connect(envelope); envelope.connect(bus); envelope.connect(reverb);
      source.start(time); source.stop(time + length);
    }
    [0.65, 3.05, 5.65].forEach((time, i) => {
      tone(time, [660, 440, 880][i], 0.14, 0.16);
      if (!layered) return;
      sweep(time - 0.42, 0.48, [180, 2400, 350][i], [2300, 180, 4000][i]);
      tone(time, 110, 0.32, 0.21, 'sine', 42);
      [1, 1.5, 2].forEach((ratio, j) => tone(time + j * 0.085, [330, 220, 440][i] * ratio, 0.65, 0.075, 'triangle'));
    });
    const buffer = await ctx.startRendering();
    // Volumes médios próximos: a diferença vem das camadas, não só de aumentar o ganho.
    let squares = 0, peak = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (const value of data) { squares += value * value; peak = Math.max(peak, Math.abs(value)); }
    }
    const rms = Math.sqrt(squares / (buffer.length * buffer.numberOfChannels));
    const gain = Math.min(0.065 / (rms || 1), 0.65 / (peak || 1));
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) data[i] *= gain;
    }
    return buffer;
  }
  function prepare() {
    if (preparing) return preparing;
    preparing = (async () => {
      if (real) {
        buffers = await Promise.all([config.antes, config.depois].map(async url => {
          const response = await fetch(url);
          if (!response.ok) throw new Error('audio');
          return context.decodeAudioData(await response.arrayBuffer());
        }));
        if (Math.abs(buffers[0].duration - buffers[1].duration) > 0.15) throw new Error('alignment');
      } else buffers = await Promise.all([sketch(false), sketch(true)]);
      duration = Math.min(...buffers.map(buffer => buffer.duration));
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('duration');
      $('[data-compare-duration]').textContent = fmt(duration);
      seek.disabled = false;
    })().catch(error => { preparing = null; throw error; });
    return preparing;
  }
  modes.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.compareMode;
    modes.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    setMix();
    status.textContent = mode === 'before' ? 'Antes: ' + (config.rotuloAntes || 'versão original') : 'Depois: ' + (config.rotuloDepois || 'com sound design');
  }));
  play.addEventListener('click', async () => {
    if (playing) { pause(); status.textContent = 'Comparação pausada.'; return; }
    const ticket = ++version;
    play.disabled = true; root.setAttribute('aria-busy', 'true'); status.textContent = 'Preparando o áudio…';
    document.dispatchEvent(new CustomEvent('abt-audio', { detail: 'comparison' }));
    try {
      engine();
      await context.resume();
      await prepare();
      if (ticket !== version) return;
      start();
    } catch (error) {
      pause();
      status.textContent = error.message === 'alignment'
        ? 'Os dois arquivos precisam ter a mesma duração para comparar. Os exemplos estão sendo revisados.'
        : 'Não foi possível preparar o áudio. Tente novamente ou use outro navegador.';
    } finally { play.disabled = false; root.removeAttribute('aria-busy'); }
  });
  seek.addEventListener('input', () => {
    const resume = playing;
    const nextPosition = Number(seek.value) / 1000 * duration;
    pause(); position = nextPosition;
    if (resume) start(); else paint();
  });
  document.addEventListener('abt-audio', event => {
    if (event.detail === 'comparison') return;
    const wasActive = playing || root.hasAttribute('aria-busy');
    pause();
    if (wasActive) status.textContent = 'Comparação pausada para ouvir outro áudio.';
  });
  window.addEventListener('pagehide', () => pause());
})();
