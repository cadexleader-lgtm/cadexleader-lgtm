/* =========================================================
   Sensual Luxembourg — Fond "soie" animé en WebGL
   Un shader plein écran qui simule des drapés de satin
   bleu nuit, traversés de reflets blancs et de veines rouges.
   ========================================================= */
(function () {
  "use strict";

  const canvas = document.querySelector("[data-silk]");
  if (!canvas) return;
  // Sur téléphone (ou mouvements réduits) : simple dégradé CSS, zéro calcul.
  if (window.matchMedia("(max-width: 760px), (prefers-reduced-motion: reduce)").matches) return;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: false });
  if (!gl) return; // le dégradé CSS du canvas sert de repli

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const vert = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                 mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 3; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
      return v;
    }
    // hauteur du tissu : ondulations longues + déformation organique
    float silk(vec2 p, float t) {
      vec2 w = vec2(fbm(p * 0.55 + vec2(t * 0.6, -t * 0.4)), fbm(p * 0.55 + vec2(-t * 0.5, t * 0.3) + 4.7));
      p += w * 1.25 + (uMouse - 0.5) * 0.35;
      float h = sin(p.x * 1.7 + p.y * 0.9 + t * 1.2) * 0.55;
      h += sin(p.x * -0.8 + p.y * 2.1 - t * 0.9) * 0.35;
      h += fbm(p * 0.9 + t * 0.2) * 0.35;
      return h;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 1.6;
      float t = uTime * 0.12;

      float e = 0.012;
      float h  = silk(p, t);
      float hx = silk(p + vec2(e, 0.0), t);
      float hy = silk(p + vec2(0.0, e), t);
      vec3 n = normalize(vec3((h - hx) / e, (h - hy) / e, 1.05));

      vec3 L = normalize(vec3(0.55 + (uMouse.x - 0.5) * 0.6, 0.7 + (uMouse.y - 0.5) * 0.4, 0.9));
      float diff = clamp(dot(n, L), 0.0, 1.0);
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 R = reflect(-L, n);
      float spec = pow(max(dot(R, V), 0.0), 16.0);
      float rim = pow(1.0 - n.z, 2.0);

      vec3 navy  = vec3(0.012, 0.02, 0.07);
      vec3 royal = vec3(0.07, 0.13, 0.48);
      vec3 blue  = vec3(0.26, 0.44, 1.0);
      vec3 red   = vec3(0.92, 0.08, 0.24);

      float redMask = smoothstep(0.05, 0.45, fbm(p * 0.45 - vec2(t * 0.7, t * 0.2) + 9.0));
      redMask *= smoothstep(0.1, 0.9, uv.y * 0.6 + uv.x * 0.7);

      vec3 base = mix(navy, royal, pow(diff, 1.7));
      vec3 tint = mix(blue, red, redMask);
      vec3 col = base + tint * spec * 1.05 + tint * rim * 0.28;
      col += vec3(1.0, 0.96, 0.98) * pow(spec, 3.0) * 0.55; // reflet blanc nacré

      // vignette + assombrissement à gauche pour la lisibilité du texte
      float vig = smoothstep(1.25, 0.25, length(uv - vec2(0.62, 0.55)));
      col *= mix(0.35, 1.0, vig);
      col *= mix(0.55, 1.0, smoothstep(0.0, 0.55, uv.x));

      // léger tramage pour éviter les bandes
      col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");

  // Rendu en résolution réduite : la soie est douce, le flou est invisible et le GPU respire.
  const QUALITY = 0.4;
  function resize() {
    const w = Math.max(1, Math.floor(canvas.clientWidth * QUALITY));
    const h = Math.max(1, Math.floor(canvas.clientHeight * QUALITY));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  let visible = true;
  let raf = 0;
  const start = performance.now() - 20000; // démarre "en mouvement"

  let last = 0;
  function frame(now) {
    raf = 0;
    if (now - last < 33) { if (visible && !document.hidden) raf = requestAnimationFrame(frame); return; } // ~30 i/s suffisent
    last = now;
    resize();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !reduced && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function play() { if (!raf) raf = requestAnimationFrame(frame); }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) play();
  }).observe(canvas);

  document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  window.addEventListener("resize", play, { passive: true });
  play();
})();
