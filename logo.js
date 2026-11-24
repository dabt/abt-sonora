const vertexSource = `
  attribute vec2 position;
  varying vec2 uv;
  void main() {
    uv = position * .5 + .5;
    gl_Position = vec4(position, 0., 1.);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D logo;
  uniform float time;
  uniform float intensity;
  uniform vec2 waveArea;
  varying vec2 uv;
  void main() {
    float x = uv.x * (.309 / waveArea.x);
    float symbol = (1. - smoothstep(.276, .309, x)) * smoothstep(0., .026, x);
    symbol *= smoothstep(waveArea.y, waveArea.y + .04, uv.y);
    float bend = sin(x * 29. - time * 4.2) * .026 * symbol * intensity;
    vec4 ink = texture2D(logo, uv + vec2(0., bend));
    float beam = .025 + mod(time * .215, .37);
    float distance = (x - beam) * 24.;
    float light = exp(-distance * distance) * symbol * intensity;
    ink.rgb += light * vec3(.34, .15, .07) * (1. - ink.rgb);
    gl_FragColor = ink;
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

const motion = matchMedia('(prefers-reduced-motion: reduce)');

async function createLogoAnimation(brand) {
  const image = brand.querySelector('img');
  try { await image.decode(); } catch { return; }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return;

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const time = gl.getUniformLocation(program, 'time');
  const intensity = gl.getUniformLocation(program, 'intensity');
  const waveArea = gl.getUniformLocation(program, 'waveArea');
  // The footer lockup places the wave above the wordmark, across the full image.
  const footer = brand.dataset.logo === 'footer';
  gl.uniform2f(waveArea, footer ? 1 : .309, footer ? .365 : -.04);

  canvas.setAttribute('aria-hidden', 'true');
  brand.append(canvas);
  let frame = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    brand.classList.remove('is-rendering');
  }

  function run() {
    if (frame || motion.matches || document.hidden || gl.isContextLost()) return;
    const scale = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.round(image.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(image.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const start = performance.now();
    const duration = 1850;
    let last = -Infinity;
    function render(now) {
      const elapsed = now - start;
      if (elapsed >= duration) return stop();
      if (now - last >= 27) {
        const strength = Math.min(1, elapsed / 230, (duration - elapsed) / 340);
        gl.uniform1f(time, elapsed / 1000);
        gl.uniform1f(intensity, strength);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        last = now;
        brand.classList.add('is-rendering');
      }
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
  }

  canvas.addEventListener('webglcontextlost', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  motion.addEventListener('change', stop);
  return run;
}

for (const brand of document.querySelectorAll('[data-logo]')) {
  let animation;
  const start = async () => {
    if (motion.matches) return;
    animation ??= createLogoAnimation(brand);
    const run = await animation;
    run?.();
  };
  brand.addEventListener('pointerenter', start);
  brand.addEventListener('focus', start);

  if (brand.dataset.logo === 'footer') {
    if (!('IntersectionObserver' in window)) continue;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    }, { threshold: .35 });
    observer.observe(brand);
  } else if (document.body.classList.contains('home')) {
    start();
  }
}
