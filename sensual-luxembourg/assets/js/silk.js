/* =========================================================
   Sensual Luxembourg — Soie animée de l'accueil (WebGL)
   Inspirée du drapeau, sans le dessiner : blanc nacré, plis bleu ciel,
   un reflet rouge qui glisse. Le tissu ondule doucement.
   ========================================================= */
(function () {
  "use strict";

  const canvas = document.querySelector("[data-silk]");
  if (!canvas) return;
  // Mouvements réduits : dégradé fixe en CSS, zéro calcul.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    uniform float uDark;

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

      // Soie claire aux couleurs du Luxembourg : blanc nacré, plis bleu ciel,
      // un reflet rouge qui glisse lentement dans le tissu. Pas de bandes.
      vec3 white = vec3(1.0);
      vec3 sky   = vec3(0.70, 0.88, 0.97);
      vec3 blue  = vec3(0.000, 0.639, 0.878);
      vec3 red   = vec3(0.937, 0.200, 0.251);

      vec3 col = mix(sky, white, smoothstep(0.15, 0.95, pow(diff, 1.1)));
      // creux des plis : bleu du drapeau, très léger
      col = mix(col, blue, (1.0 - diff) * 0.28);
      // voile rouge qui dérive (bas droite surtout)
      float rm = smoothstep(0.05, 0.6, fbm(p * 0.7 + vec2(t * 0.8, -t * 0.5) + 9.1) + 0.25 * (uv.x - uv.y));
      col = mix(col, mix(col, red, 0.55), rm * (1.0 - diff) * 0.55);
      // lisérés bleus sur les arêtes, éclat blanc nacré
      col += blue * rim * 0.35;
      col += vec3(1.0) * spec * 0.35;

      // éclaircit à gauche pour la lisibilité du texte
      col = mix(col, white, (1.0 - smoothstep(0.05, 0.6, uv.x)) * 0.55);

      // Mode sombre : soie bleu nuit, plis bleu ciel, même reflet rouge
      vec3 night = mix(vec3(0.016, 0.060, 0.110), vec3(0.060, 0.260, 0.420), pow(diff, 1.4));
      night = mix(night, mix(night, red * 0.75, 0.6), rm * (1.0 - diff) * 0.7);
      night += blue * rim * 0.45 + vec3(0.75, 0.9, 1.0) * spec * 0.22;
      night *= mix(0.45, 1.0, smoothstep(0.0, 0.6, uv.x));
      col = mix(col, night, uDark);
      col = clamp(col, 0.0, 1.0);

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
  const uDark = gl.getUniformLocation(prog, "uDark");
  const isDark = () => document.documentElement.dataset.theme === "dark";
  let dark = isDark() ? 1 : 0;

  // Rendu en résolution réduite : la soie est douce, le flou est invisible et le GPU respire.
  const QUALITY = window.innerWidth < 760 ? 0.3 : 0.4;
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
    dark += ((isDark() ? 1 : 0) - dark) * 0.12; // fondu doux au changement de thème
    gl.uniform1f(uDark, dark);
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
  window.addEventListener("sl-theme", play);
  play();
})();
