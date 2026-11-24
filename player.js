const motion = matchMedia('(prefers-reduced-motion: reduce)');
const AudioContext = window.AudioContext || window.webkitAudioContext;

function createSpectrum(root, audio) {
  const stage = root.querySelector('.record-stage');
  const canvas = root.querySelector('[data-record-spectrum]');
  const paint = canvas.getContext('2d');
  const palette = [[0, 167, 225], [122, 63, 242], [255, 122, 0], [230, 57, 102], [0, 167, 225]];
  const bars = Array.from({ length: 128 }, (_, index) => {
    const angle = index / 128 * 2 * Math.PI;
    const segment = Math.floor(index / 32);
    const mix = index % 32 / 32;
    const color = palette[segment].map((value, channel) =>
      Math.round(value + (palette[segment + 1][channel] - value) * mix)
    );
    return {
      x: Math.cos(angle), y: Math.sin(angle),
      band: Math.abs(Math.cos(angle * .5 + .7)) ** 2.7,
      detail: .004 + .009 * Math.abs(Math.sin(angle * 9 + index * 1.9)),
      color: `rgb(${color.join(' ')})`,
    };
  });
  let audioContext, analyser, samples;
  let width = 0, height = 0, frame = 0, lastUpdate = -Infinity;
  let playing = false, inView = !('IntersectionObserver' in window);

  function draw(active = false) {
    if (!paint || !width || !height) return;
    if (active) analyser.getByteFrequencyData(samples);
    paint.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height);
    const radius = size * .398;
    paint.lineCap = 'round';
    for (const bar of bars) {
      const frequency = active ? samples[Math.round(1 + bar.band * samples.length * .29)] / 255 : 0;
      const amplitude = frequency ** 1.65;
      const end = radius + size * (bar.detail + amplitude * .082);
      paint.globalAlpha = .52 + amplitude * .46;
      paint.lineWidth = Math.max(.8, size * (.0024 + amplitude * .0016));
      paint.strokeStyle = bar.color;
      paint.beginPath();
      paint.moveTo(centerX + radius * bar.x, centerY + radius * bar.y);
      paint.lineTo(centerX + end * bar.x, centerY + end * bar.y);
      paint.stroke();
    }
    paint.globalAlpha = 1;
  }

  function resize() {
    if (!paint) return;
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    paint.setTransform(density, 0, 0, density, 0, 0);
    draw();
  }

  function tick(now) {
    if (now - lastUpdate >= 32) {
      draw(true);
      lastUpdate = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const animate = playing && inView && !document.hidden && !motion.matches;
    root.classList.toggle('is-spinning', animate);
    if (animate && analyser) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
    }
  }

  function arm() {
    if (!paint || !AudioContext || motion.matches) return;
    try {
      audioContext ??= new AudioContext();
      audioContext.resume().then(() => {
        if (analyser || audioContext.state !== 'running') return;
        const spectrum = audioContext.createAnalyser();
        spectrum.fftSize = 2048;
        spectrum.smoothingTimeConstant = .78;
        const source = audioContext.createMediaElementSource(audio);
        source.connect(audioContext.destination);
        source.connect(spectrum);
        analyser = spectrum;
        samples = new Uint8Array(analyser.frequencyBinCount);
        sync();
      }).catch(() => {});
    } catch {
      // The media element still plays when Web Audio is unavailable.
    }
  }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);

  return {
    arm,
    setPlaying(value) {
      playing = value;
      sync();
    },
  };
}

function formatTime(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function bindTimeline(root, audio, onMetadata) {
  const seek = root.querySelector('[data-record-seek]');
  const time = root.querySelector('[data-record-time]');
  const duration = root.querySelector('[data-record-duration]');
  const previewDuration = Number(seek.max);

  function update() {
    const loaded = Number.isFinite(audio.duration) && audio.duration > 0;
    const total = loaded ? audio.duration : previewDuration;
    const seconds = loaded ? audio.currentTime : 0;
    seek.disabled = !loaded;
    seek.max = total;
    seek.value = seconds;
    seek.style.setProperty('--record-progress', `${seconds / total * 100}%`);
    seek.setAttribute('aria-valuetext', `${formatTime(seconds)} de ${formatTime(total)}`);
    time.textContent = formatTime(seconds);
    duration.textContent = formatTime(total);
    onMetadata?.(loaded);
  }

  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'emptied']) {
    audio.addEventListener(event, update);
  }
  seek.addEventListener('input', () => {
    audio.currentTime = Number(seek.value);
    update();
  });
  update();
  return update;
}

function mountPreview(root) {
  const audio = root.querySelector('audio');
  const play = root.querySelector('[data-preview-play]');
  const volume = root.querySelector('[data-preview-mute]');
  const label = root.querySelector('[data-preview-label]');
  const length = root.querySelector('[data-preview-length]');
  const timeline = root.querySelector('[data-preview-timeline]');
  const title = root.querySelector('h2').textContent;
  const error = root.querySelector('[data-media-error]');

  function updateTransport() {
    const playing = !audio.paused && !audio.ended;
    label.textContent = playing ? 'Pausar prévia' : 'Ouvir prévia';
    play.setAttribute('aria-label', `${label.textContent} — ${title}`);
    play.toggleAttribute('data-playing', playing);
    volume.setAttribute('aria-pressed', String(audio.muted));
  }

  for (const event of ['play', 'pause', 'ended', 'error', 'volumechange']) {
    audio.addEventListener(event, updateTransport);
  }
  play.addEventListener('click', () => {
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }
    if (audio.error) audio.load();
    error.hidden = true;
    audio.play().catch(reason => {
      if (reason.name !== 'AbortError') error.hidden = false;
    });
  });
  volume.addEventListener('click', () => { audio.muted = !audio.muted; });
  bindTimeline(root, audio, loaded => {
    timeline.hidden = !loaded;
    length.hidden = loaded;
  });
  audio.hidden = true;
  root.querySelector('[data-preview-controls]').hidden = false;
}

function mountPlayer(root) {
  const audio = root.querySelector('audio');
  const [preferredSource, fallbackSource] = audio.querySelectorAll('source');
  const play = root.querySelector('[data-record-play]');
  const previous = root.querySelector('[data-record-previous]');
  const next = root.querySelector('[data-record-next]');
  const mute = root.querySelector('[data-record-mute]');
  const title = root.querySelector('[data-record-title]');
  const category = root.querySelector('[data-record-category]');
  const description = root.querySelector('[data-record-description]');
  const cover = root.querySelector('[data-record-cover]');
  const error = root.querySelector('[data-media-error]');
  const tracks = [...root.querySelectorAll('[data-record-track]')];
  const mini = document.querySelector('[data-record-mini]');
  const miniTitle = mini.querySelector('[data-mini-title]');
  const miniCover = mini.querySelector('[data-mini-cover]');
  const miniPause = mini.querySelector('[data-mini-pause]');
  const updateTimeline = bindTimeline(root, audio);
  const spectrum = createSpectrum(root, audio);
  let index = 0, request = 0;
  let mainControlVisible = true;

  function updateMini() {
    mini.hidden = audio.paused || audio.ended || Boolean(audio.error) || mainControlVisible;
  }

  function updateTransport() {
    const playing = !audio.paused && !audio.ended;
    play.setAttribute('aria-label', playing ? 'Pausar faixa' : 'Reproduzir faixa');
    play.toggleAttribute('data-playing', playing);
    mute.setAttribute('aria-pressed', String(audio.muted));
    previous.disabled = index === 0;
    next.disabled = index === tracks.length - 1;
    updateMini();
  }

  function setPlaying(active) {
    root.classList.toggle('is-playing', active);
    spectrum.setPlaying(active);
    updateTransport();
  }

  function start() {
    if (!audio.paused && !audio.ended) return;
    const ticket = ++request;
    error.hidden = true;
    if (audio.error) audio.load();
    spectrum.arm();
    audio.play().catch(reason => {
      if (ticket === request && reason.name !== 'AbortError') {
        error.hidden = false;
        setPlaying(false);
      }
    });
  }

  function selectTrack(position, autoplay) {
    if (position !== index) {
      audio.pause();
      request++;
      tracks[index].removeAttribute('aria-current');
      index = position;
      const track = tracks[index];
      track.setAttribute('aria-current', 'true');
      root.dataset.tone = track.dataset.recordTrack;
      title.textContent = track.querySelector('strong').textContent;
      category.textContent = track.querySelector('small').textContent;
      description.textContent = track.dataset.description;
      cover.src = track.querySelector('img').src;
      miniTitle.textContent = title.textContent;
      miniCover.src = cover.src;
      audio.setAttribute('aria-label', `Ouvir ${title.textContent}`);
      preferredSource.src = track.dataset.src.replace(/\.mp3$/, '.m4a');
      fallbackSource.src = track.dataset.src;
      audio.load();
      error.hidden = true;
      setPlaying(false);
      updateTimeline();
    }
    if (autoplay) start();
  }

  function isModified(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  tracks.forEach((track, position) => track.addEventListener('click', event => {
    if (isModified(event)) return;
    event.preventDefault();
    selectTrack(position, true);
  }));
  document.querySelectorAll('[data-start-record]').forEach(link => link.addEventListener('click', event => {
    if (!isModified(event)) start();
  }));
  play.addEventListener('click', () => {
    if (audio.paused || audio.ended) start();
    else audio.pause();
  });
  previous.addEventListener('click', () => selectTrack(index - 1, !audio.paused));
  next.addEventListener('click', () => selectTrack(index + 1, !audio.paused));
  mute.addEventListener('click', () => { audio.muted = !audio.muted; });
  miniPause.addEventListener('click', () => {
    if (miniPause.matches(':focus-visible')) play.focus();
    audio.pause();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      mainControlVisible = entry.intersectionRatio >= .95;
      if (mainControlVisible && document.activeElement === miniPause) play.focus({ preventScroll: true });
      updateMini();
    }, { threshold: .95 }).observe(play);
  }
  audio.addEventListener('play', updateTransport);
  audio.addEventListener('volumechange', updateTransport);
  audio.addEventListener('playing', () => setPlaying(true));
  for (const event of ['pause', 'waiting', 'error', 'emptied']) {
    audio.addEventListener(event, () => setPlaying(false));
  }
  audio.addEventListener('ended', () => {
    setPlaying(false);
    if (index + 1 < tracks.length) selectTrack(index + 1, true);
  });

  updateTransport();
  updateTimeline();
  audio.hidden = true;
  root.querySelector('[data-record-controls]').hidden = false;
}

const player = document.querySelector('[data-record-player]');
if (player) mountPlayer(player);
document.querySelectorAll('[data-audio-preview]').forEach(mountPreview);
