/* Estudo provisório de síntese e arranjo. Não representa uma gravação do catálogo. */
(() => {
  const root = document.querySelector('[data-study]');
  if (!root) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const play = root.querySelector('[data-study-play]');
  const label = root.querySelector('[data-play-label]');
  const seek = root.querySelector('.study-seek');
  const clock = root.querySelector('[data-study-time]');
  const error = root.querySelector('[data-study-error]');
  const description = root.querySelector('[data-study-description]');
  const descriptions = {
    essencia: 'As teclas fazem a melodia e os acordes. Notas curtas e pausas deixam cada frase aparecer.',
    pulso: 'Baixo e bateria entram junto das teclas. Os acentos mudam a sensação de movimento.',
    horizonte: 'Notas sustentadas e ecos se somam às teclas e ocupam os intervalos da frase.',
  };
  const duration = 12, sampleRate = 32000;
  let context, buffers, rendering, sources = [], gains = [], mix = 'essencia';
  let offset = 0, startedAt = 0, playing = false, frame = 0, generation = 0, preparing = false;
  if (!Audio || !Offline) {
    error.textContent = 'Este navegador não oferece o recurso de áudio usado no estudo.';
    error.hidden = false;
    label.textContent = 'Áudio indisponível';
    return;
  }
  play.disabled = false;
  seek.disabled = false;

  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  function seededNoise(c, seed) {
    const buffer = c.createBuffer(1, sampleRate, sampleRate), data = buffer.getChannelData(0);
    let value = seed;
    for (let i = 0; i < data.length; i++) { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; data[i] = value / 2147483648 - 1; }
    return buffer;
  }
  function note(c, bus, midi, time, length, level, type = 'sine', release = .45) {
    if (time >= duration) return;
    const oscillator = c.createOscillator(), envelope = c.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(.0001, time);
    envelope.gain.exponentialRampToValueAtTime(level, time + .012);
    envelope.gain.exponentialRampToValueAtTime(level * .22, time + Math.max(.04, length));
    envelope.gain.exponentialRampToValueAtTime(.0001, time + length + release);
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.start(time); oscillator.stop(Math.min(duration, time + length + release + .01));
  }
  async function renderMix(kind) {
    const c = new Offline(2, duration * sampleRate, sampleRate);
    const master = c.createGain(); master.gain.setValueAtTime(.75, 0);
    master.gain.setValueAtTime(.75, duration - .6); master.gain.linearRampToValueAtTime(0, duration);
    const compressor = c.createDynamicsCompressor(); compressor.threshold.value = -15; compressor.ratio.value = 3;
    master.connect(compressor); compressor.connect(c.destination);
    const keys = c.createGain(); keys.gain.value = .7; keys.connect(master);
    const chords = [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,69]];
    const melody = [[76,0,.45],[79,.75,.28],[83,1.5,.65],[76,3,.5],[72,4.125,.45],[71,5.25,.45],[69,6,.65],[72,7.125,.4],[76,7.875,.45],[74,9,.6],[71,10.125,.4],[67,10.875,.3]];
    // All three arrangements share these exact notes and timings.
    chords.forEach((chord, bar) => chord.forEach((midi, index) => {
      const t = bar * 3 + index * .018;
      note(c, keys, midi, t, .55, .065);
      note(c, keys, midi + 12, t, .16, .012, 'sine', .28);
    }));
    melody.forEach(([midi,time,length]) => {
      note(c, keys, midi, time + .16, length, .14);
      note(c, keys, midi + 12, time + .16, .1, .014, 'sine', .25);
    });
    if (kind === 'pulso') {
      const bass = [36,33,29,31];
      bass.forEach((midi, bar) => [0,1.125,1.875,2.625].forEach((beat,index) => note(c, master, midi + (index === 2 ? 12 : 0), bar * 3 + beat + .02, .22, .18, 'triangle', .2)));
      const noise = seededNoise(c, 17);
      for (let beat = 0; beat < 16; beat++) {
        const t = beat * .75 + .025;
        if (beat % 4 === 0 || beat % 4 === 2) {
          const kick = c.createOscillator(), env = c.createGain();
          kick.frequency.setValueAtTime(112,t); kick.frequency.exponentialRampToValueAtTime(43,t+.14);
          env.gain.setValueAtTime(.26,t); env.gain.exponentialRampToValueAtTime(.0001,t+.3);
          kick.connect(env);env.connect(master);kick.start(t);kick.stop(t+.32);
        }
        if (beat % 2 === 1) {
          const source = c.createBufferSource(), filter = c.createBiquadFilter(), env = c.createGain();
          source.buffer = noise; filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = .7;
          env.gain.setValueAtTime(.075,t);env.gain.exponentialRampToValueAtTime(.0001,t+.12);
          source.connect(filter);filter.connect(env);env.connect(master);source.start(t);source.stop(t+.13);
        }
        for (let half = 0; half < 2; half++) {
          const ht = t + half * .375 + (half ? .035 : 0);
          const source = c.createBufferSource(), filter = c.createBiquadFilter(), env = c.createGain();
          source.buffer = noise;filter.type='highpass';filter.frequency.value=6500;
          env.gain.setValueAtTime(half ? .026 : .018,ht);env.gain.exponentialRampToValueAtTime(.0001,ht+.055);
          source.connect(filter);filter.connect(env);env.connect(master);source.start(ht);source.stop(ht+.06);
        }
      }
    }
    if (kind === 'horizonte') {
      const pad = c.createBiquadFilter(); pad.type = 'lowpass';pad.frequency.value = 950;pad.connect(master);
      chords.forEach((chord,bar) => chord.forEach(midi => {
        const oscillator = c.createOscillator(), envelope = c.createGain(), t = bar * 3;
        oscillator.type = 'triangle';oscillator.frequency.value=frequency(midi-12);oscillator.detune.value=5;
        envelope.gain.setValueAtTime(.0001,t);envelope.gain.linearRampToValueAtTime(.045,t+.8);envelope.gain.setValueAtTime(.045,t+2);envelope.gain.linearRampToValueAtTime(0,Math.min(duration,t+3.8));
        oscillator.connect(envelope);envelope.connect(pad);oscillator.start(t);oscillator.stop(Math.min(duration,t+3.9));
      }));
      const delay = c.createDelay(2), feedback = c.createGain(), wet = c.createGain(), filter = c.createBiquadFilter();
      delay.delayTime.value=.5625;feedback.gain.value=.28;wet.gain.value=.35;filter.type='lowpass';filter.frequency.value=2400;
      keys.connect(delay);delay.connect(filter);filter.connect(wet);wet.connect(master);filter.connect(feedback);feedback.connect(delay);
    }
    const buffer = await c.startRendering();
    // Approximate RMS matching prevents the comparison from depending on volume alone.
    let sum = 0, peak = 0;
    for (let channel=0;channel<buffer.numberOfChannels;channel++) for (const value of buffer.getChannelData(channel)) { sum += value*value;peak=Math.max(peak,Math.abs(value)); }
    const rms = Math.sqrt(sum / (buffer.length * buffer.numberOfChannels));
    const scale = Math.min(.09 / Math.max(rms,.001), .72 / Math.max(peak,.001));
    for(let channel=0;channel<buffer.numberOfChannels;channel++){const data=buffer.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]*=scale;}
    return buffer;
  }
  async function getBuffers() {
    if (buffers) return buffers;
    if (!rendering) rendering = Promise.all(Object.keys(descriptions).map(renderMix)).then(value => (buffers=value)).catch(reason => { rendering=null;throw reason; });
    return rendering;
  }
  const position = () => playing ? Math.min(duration,Math.max(0,context.currentTime-startedAt)) : offset;
  const fmt = value => '0:' + String(Math.floor(value)).padStart(2,'0');
  function draw() {
    const time=position();seek.value=time;clock.textContent=`${fmt(time)} / 0:12`;
    seek.setAttribute('aria-valuetext',`${time.toFixed(1).replace('.',',')} segundos de 12`);
    label.textContent=preparing?'Preparando áudio…':playing?'Pausar estudo':'Ouvir estudo';
    play.querySelector('span[aria-hidden]').textContent=playing?'Ⅱ':'▶';
  }
  function tick(){draw();if(playing)frame=requestAnimationFrame(tick);}
  function stopSources(){sources.forEach(source=>{source.onended=null;try{source.stop();}catch{}source.disconnect();});gains.forEach(gain=>gain.disconnect());sources=[];gains=[];cancelAnimationFrame(frame);}
  function pause(){generation++;if(playing)offset=position();playing=false;stopSources();draw();}
  function start(){
    if(offset>=duration)offset=0;
    const now=context.currentTime+.04;
    startedAt=now-offset;
    sources=buffers.map((buffer,index)=>{
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
      gain.gain.value=Object.keys(descriptions)[index]===mix?1:0;
      source.connect(gain);gain.connect(context.destination);gains.push(gain);source.start(now,offset);return source;
    });
    sources[0].onended=()=>{if(!playing)return;playing=false;stopSources();offset=0;draw();};
    playing=true;document.dispatchEvent(new CustomEvent('sonora-audio',{detail:'study'}));tick();
  }
  play.addEventListener('click',async()=>{
    if(playing){pause();return;}
    const ticket=++generation;preparing=true;play.disabled=true;error.hidden=true;draw();
    try{
      context??=new Audio();await context.resume();await getBuffers();
      if(ticket===generation)start();
    }catch{error.hidden=false;}
    finally{preparing=false;play.disabled=false;draw();}
  });
  root.querySelectorAll('[data-mix]').forEach(button=>button.addEventListener('click',()=>{
    mix=button.dataset.mix;
    root.dataset.arrangement = mix;
    description.textContent=descriptions[mix];
    root.querySelectorAll('[data-mix]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    if(playing)gains.forEach((gain,index)=>{const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(Object.keys(descriptions)[index]===mix?1:0,now+.08);});
  }));
  seek.addEventListener('input',()=>{const resume=playing,target=Number(seek.value);pause();offset=target;if(resume&&offset<duration)start();else draw();});
  document.addEventListener('sonora-audio',event=>{if(event.detail!=='study')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',pause);
  draw();
})();
