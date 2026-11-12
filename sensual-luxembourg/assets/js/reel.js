/* =========================================================
   Sensual Luxembourg — « Le Rituel », film interactif
   Le défilement fait avancer un film rendu en WebGL :
   zooms lents, transitions liquides bordées de lumière rouge,
   aberration chromatique selon la vitesse, étalonnage bleu/rouge, grain.
   ========================================================= */
(function () {
  "use strict";

  const section = document.querySelector("[data-reel]");
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  const SL = window.SL || {};
  const qs = (s, el = section) => el.querySelector(s);
  const qsa = (s, el = section) => [...el.querySelectorAll(s)];

  const canvas = qs("[data-reel-canvas]");
  const chapters = qsa("[data-chapter]");
  const endCard = qs("[data-reel-end]");
  const bar = qs("[data-reel-progress]");
  const tc = qs("[data-reel-tc]");
  const stateEl = qs("[data-reel-state]");
  const hint = qs("[data-reel-hint]");
  const sources = chapters.map((c) => c.dataset.img).concat(endCard.dataset.img);
  const N = sources.length;
  const DURATION = 84; // durée « fictive » du film, pour le timecode (secondes)

  /* ---------- Contexte de rendu ---------- */
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  const ctx2d = gl ? null : canvas.getContext("2d");
  const images = sources.map(() => null);
  const sizes = sources.map(() => [1, 1]);
  let textures = [];
  let prog, U = {};

  if (gl) {
    const vert = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uA, uB;
      uniform vec2 uRes, uSizeA, uSizeB, uPanA, uPanB;
      uniform float uMix, uZoomA, uZoomB, uTime, uVel;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

      vec2 cover(vec2 uv, vec2 size, float zoom, vec2 pan) {
        float rs = uRes.x / uRes.y, ri = size.x / size.y;
        vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
        return clamp((uv - 0.5) * s / zoom + 0.5 + pan, 0.001, 0.999);
      }
      vec3 tex(sampler2D t, vec2 uv, float split) {
        return vec3(texture2D(t, uv + vec2(split, 0.0)).r, texture2D(t, uv).g, texture2D(t, uv - vec2(split, 0.0)).b);
      }
      void main() {
        vec2 uv = vUv;
        float d = fbm(uv * vec2(3.2, 2.4) + vec2(0.0, uTime * 0.04));
        float t = uMix;
        float v = d * 0.75 + length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)) * 0.42;
        float th = mix(-0.12, 1.25, t);
        float w = 0.035;
        float m = 1.0 - smoothstep(th - w, th + w, v);
        vec2 disp = (vec2(d, fbm(uv * 2.0 + 7.3)) - 0.5) * 0.2;
        float split = clamp(uVel, -1.0, 1.0) * 0.0045;
        vec3 a = tex(uA, cover(uv + disp * t, uSizeA, uZoomA, uPanA), split);
        vec3 b = tex(uB, cover(uv - disp * (1.0 - t), uSizeB, uZoomB, uPanB), split);
        vec3 col = mix(a, b, m);

        // liseré de lumière sur le front de la transition (rouge carmin → blanc)
        float glow = (1.0 - smoothstep(0.0, w * 1.6, abs(v - th))) * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.92, 1.0, t));
        col += vec3(0.95, 0.12, 0.28) * glow * 0.55 + vec3(1.0, 0.85, 0.9) * pow(glow, 6.0) * 0.3;

        // étalonnage : ombres bleutées, contraste doux
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, col * vec3(0.78, 0.88, 1.22), (1.0 - l) * 0.6);
        col = (col - 0.5) * 1.06 + 0.5;
        // vignettage + grain
        float vig = smoothstep(1.15, 0.3, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
        col *= mix(0.4, 1.0, vig);
        col += (hash(uv * uRes + fract(uTime * 7.0) * 113.0) - 0.5) * 0.05;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, vert);
    const fs = sh(gl.FRAGMENT_SHADER, frag);
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["uA", "uB", "uRes", "uSizeA", "uSizeB", "uPanA", "uPanB", "uMix", "uZoomA", "uZoomB", "uTime", "uVel"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.uA, 0);
    gl.uniform1i(U.uB, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    textures = sources.map(() => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([6, 9, 24, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
  }

  let loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    sources.forEach((src, k) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[k] = img;
        sizes[k] = [img.naturalWidth, img.naturalHeight];
        if (gl) {
          gl.bindTexture(gl.TEXTURE_2D, textures[k]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        }
        dirty = true;
      };
      img.src = src;
    });
  }

  /* ---------- Taille du canvas ---------- */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (gl) gl.viewport(0, 0, w, h);
      dirty = true;
    }
  }

  /* ---------- Progression pilotée par le scroll ---------- */
  let target = 0, cur = 0, dirty = true, running = false, lastTime = 0;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pans = [[0.0, 0.02], [0.0, -0.03], [0.03, 0.0], [-0.02, 0.0], [0.02, 0.02], [0.0, -0.04], [0.0, 0.0]];

  ScrollTrigger.create({
    trigger: section, start: "top top", end: "bottom bottom",
    onUpdate: (self) => { target = self.progress; start(); },
    onToggle: (self) => { if (self.isActive) start(); },
  });
  // bandes cinéma qui se referment à l'entrée
  gsap.fromTo(qs("[data-reel-bars]"), { "--bars": 0 }, {
    "--bars": 1, ease: "none",
    scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
  });

  function draw(now) {
    const x = cur * (N - 1);
    const i = Math.min(Math.floor(x), N - 2);
    const f = x - i;
    const mix = smooth(0.5, 1.0, f);
    const zoomA = 1.06 + 0.16 * f + 0.55 * mix * mix;
    const zoomB = 1.0 + 0.06 * mix;
    const vel = (target - cur) * 22;
    const pa = pans[i % pans.length].map((p) => p * f);
    const pb = [0, 0];

    if (gl) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[i + 1]);
      gl.uniform2f(U.uSizeA, sizes[i][0], sizes[i][1]);
      gl.uniform2f(U.uSizeB, sizes[i + 1][0], sizes[i + 1][1]);
      gl.uniform2f(U.uPanA, pa[0], pa[1]);
      gl.uniform2f(U.uPanB, pb[0], pb[1]);
      gl.uniform1f(U.uMix, mix);
      gl.uniform1f(U.uZoomA, zoomA);
      gl.uniform1f(U.uZoomB, zoomB);
      gl.uniform1f(U.uTime, now / 1000);
      gl.uniform1f(U.uVel, vel);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (ctx2d) {
      const paint = (img, zoom, alpha) => {
        if (!img) return;
        const cw = canvas.width, ch = canvas.height;
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom;
        ctx2d.globalAlpha = alpha;
        ctx2d.drawImage(img, (cw - img.naturalWidth * s) / 2, (ch - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
      };
      ctx2d.fillStyle = "#050816";
      ctx2d.globalAlpha = 1;
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      paint(images[i], zoomA, 1);
      paint(images[i + 1], zoomB, mix);
      ctx2d.globalAlpha = 1;
    }

    // chapitres : apparition, dérive verticale, flou de sortie
    chapters.forEach((el, k) => {
      const d = x - k;
      const o = smooth(-0.38, -0.12, d) * (1 - smooth(0.3, 0.5, d));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${(-d * 90).toFixed(1)}px, 0)`;
      el.style.filter = o < 0.98 ? `blur(${((1 - o) * 10).toFixed(1)}px)` : "none";
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    });
    const e = smooth(N - 1.42, N - 1.08, x);
    endCard.style.opacity = e.toFixed(3);
    endCard.style.transform = `translate3d(0, ${((1 - e) * 60).toFixed(1)}px, 0) scale(${(0.94 + e * 0.06).toFixed(3)})`;
    endCard.style.visibility = e < 0.01 ? "hidden" : "visible";
    endCard.style.pointerEvents = e > 0.6 ? "auto" : "none";

    // interface « lecteur vidéo »
    bar.style.transform = `scaleX(${cur.toFixed(4)})`;
    const secs = cur * DURATION;
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(Math.floor(secs % 60)).padStart(2, "0");
    const ff = String(Math.floor((secs % 1) * 24)).padStart(2, "0");
    tc.textContent = `${mm}:${ss}:${ff}`;
    const playing = Math.abs(target - cur) > 0.0004;
    stateEl.textContent = playing ? "● Lecture" : "❚❚ Pause";
    stateEl.classList.toggle("is-playing", playing);
    hint.style.opacity = String(1 - smooth(0.02, 0.08, cur));
  }

  function loop(now) {
    if (!running) return;
    resize();
    const prev = cur;
    cur += (target - cur) * 0.085;
    if (Math.abs(target - cur) < 0.00005) cur = target;
    // le grain et le bruit vivent même à l'arrêt : on redessine en continu tant que la section est visible
    draw(now);
    dirty = false;
    lastTime = now;
    if (prev === cur && !visible) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  let visible = false;
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      visible = en.isIntersecting;
      if (visible) { load(); start(); }
    });
  }, { rootMargin: "200px 0px" }).observe(section);
  // préchargement en douceur une fois la page prête
  window.addEventListener("load", () => setTimeout(load, 1500), { once: true });
  window.addEventListener("resize", () => { dirty = true; start(); }, { passive: true });
})();
