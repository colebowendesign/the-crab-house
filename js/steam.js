/* ============================================================
   Steam over the hero.

   Raw WebGL rather than a scene library: this is one full-screen
   quad and one shader, so pulling in a 3D engine would cost half
   a megabyte to draw two triangles. Domain-warped fBm scrolling
   upward, masked so the plumes stay off the headline on the left
   and thin out before they reach the top of the frame.
   ============================================================ */
window.initSteam = function initSteam(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
  });
  if (!gl) return null;

  const VERT = `
    attribute vec2 p;
    varying vec2 uv;
    void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    varying vec2 uv;
    uniform float t;
    uniform float aspect;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 st = uv;
      vec2 p = vec2(st.x * aspect, st.y);

      /* the warp is what turns a rising noise field into something that
         curls; without it the plumes read as drifting fog */
      vec2 q = p * 2.3;
      q.y -= t * 0.075;
      q.x += fbm(p * 1.5 + vec2(0.0, -t * 0.05)) * 0.6;

      float n = fbm(q);
      n = fbm(q + n * 0.65);

      float body = smoothstep(0.44, 0.93, n);

      // nothing at the pot line, gone again before the top of the frame
      float rise = smoothstep(0.03, 0.34, st.y) * (1.0 - smoothstep(0.52, 1.0, st.y));
      // and kept clear of the headline, which sits on the left third
      float side = smoothstep(0.24, 0.66, st.x) * (1.0 - smoothstep(0.88, 1.08, st.x));

      float a = body * rise * side * 0.32;
      vec3 col = mix(vec3(0.84, 0.79, 0.70), vec3(1.0, 0.87, 0.63), st.y * 0.65);
      gl_FragColor = vec4(col * a, a);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('steam shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uT = gl.getUniformLocation(prog, 't');
  const uAspect = gl.getUniformLocation(prog, 'aspect');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* A noise field this soft gains nothing from retina resolution and costs
     four times the fragments for it, so the buffer is capped well below DPR. */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform1f(uAspect, h ? w / h : 1.7);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let raf = 0;
  let running = false;
  let last = performance.now();
  let clock = 0;

  function frame(now) {
    if (!running) return;
    // clamp the step so a backgrounded tab does not resume mid-jump
    clock += Math.min((now - last) / 1000, 0.05);
    last = now;
    resize();
    gl.uniform1f(uT, clock);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  return {
    resume() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
};
