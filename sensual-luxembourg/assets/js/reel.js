/* =========================================================
   Sensual Luxembourg — « Le Rituel », film interactif
   Le défilement fait avancer le film (WebGL) :
   zoom lent + transition liquide bordée d'un fin liseré rouge.
   - Accroche automatique sur chaque chapitre : un geste = un chapitre.
   - Dessin uniquement quand la position change (aucun calcul à l'arrêt).
   - Images allégées sur mobile.
   ========================================================= */
(function () {
  "use strict";

  const section = document.querySelector("[data-reel]");
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const qs = (s) => section.querySelector(s);
  const canvas = qs("[data-reel-canvas]");
  const chapters = [...section.querySelectorAll("[data-chapter]")];
  const endCard = qs("[data-reel-end]");
  const bar = qs("[data-reel-progress]");
  const count = qs("[data-reel-count]");
  const hint = qs("[data-reel-hint]");
  const small = window.matchMedia("(max-width: 760px)").matches;
  const pick = (el) => (small && el.dataset.imgSm) || el.dataset.img;
  const sources = chapters.map(pick).concat(pick(endCard));
  const N = sources.length;

  /* ---------- Rendu ---------- */
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  const ctx2d = gl ? null : canvas.getContext("2d");
  const images = sources.map(() => null);
  const sizes = sources.map(() => [1, 1]);
  let textures = [];
  const U = {};

  if (gl) {
    const vert = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
    const frag = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uA, uB;
      uniform vec2 uRes, uSizeA, uSizeB;
      uniform float uMix, uZoomA, uZoomB, uSeed;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      vec2 cover(vec2 uv, vec2 size, float zoom) {
        float rs = uRes.x / uRes.y, ri = size.x / size.y;
        vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
        return clamp((uv - 0.5) * s / zoom + 0.5, 0.001, 0.999);
      }
      void main() {
        vec2 uv = vUv;
        float d = fbm(uv * vec2(3.0, 2.2) + uSeed);
        float t = uMix;
        float v = d * 0.75 + length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)) * 0.4;
        float th = mix(-0.12, 1.2, t);
        float w = 0.04;
        float m = 1.0 - smoothstep(th - w, th + w, v);
        vec2 disp = vec2(d - 0.5) * 0.14;
        vec3 a = texture2D(uA, cover(uv + disp * t, uSizeA, uZoomA)).rgb;
        vec3 b = texture2D(uB, cover(uv - disp * (1.0 - t), uSizeB, uZoomB)).rgb;
        vec3 col = mix(a, b, m);
        float glow = (1.0 - smoothstep(0.0, w * 1.5, abs(v - th))) * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.92, 1.0, t));
        col += vec3(0.9, 0.1, 0.25) * glow * 0.5;
        float vig = smoothstep(1.2, 0.35, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
        col *= mix(0.5, 1.0, vig);
        gl_FragColor = vec4(col, 1.0);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["uA", "uB", "uRes", "uSizeA", "uSizeB", "uMix", "uZoomA", "uZoomB", "uSeed"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
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
    // on laisse d'abord la page (et la photo du hero) se charger
    if (document.readyState !== "complete") { window.addEventListener("load", load, { once: true }); return; }
    loaded = true;
    sources.forEach((src, k) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[k] = img;
        sizes[k] = [img.naturalWidth, img.naturalHeight];
        if (gl) { gl.bindTexture(gl.TEXTURE_2D, textures[k]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); }
        request();
      };
      img.src = src;
    });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.25);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (gl) gl.viewport(0, 0, w, h);
    }
  }

  /* ---------- Progression : scroll + accroche par chapitre ---------- */
  let target = 0, cur = -1, raf = 0;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  ScrollTrigger.create({
    trigger: section, start: "top top", end: "bottom bottom",
    snap: { snapTo: 1 / (N - 1), duration: { min: 0.35, max: 0.8 }, delay: 0.06, ease: "power2.inOut", directional: true },
    onUpdate: (self) => { target = self.progress; request(); },
  });

  function draw() {
    const x = cur * (N - 1);
    const i = Math.min(Math.floor(x), N - 2);
    const f = x - i;
    const mix = smooth(0.35, 0.95, f);
    const zoomA = 1.04 + 0.12 * f + 0.3 * mix * mix;
    const zoomB = 1.0 + 0.04 * mix;

    if (gl) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[i + 1]);
      gl.uniform2f(U.uSizeA, sizes[i][0], sizes[i][1]);
      gl.uniform2f(U.uSizeB, sizes[i + 1][0], sizes[i + 1][1]);
      gl.uniform1f(U.uMix, mix);
      gl.uniform1f(U.uZoomA, zoomA);
      gl.uniform1f(U.uZoomB, zoomB);
      gl.uniform1f(U.uSeed, i * 3.7);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (ctx2d) {
      const paint = (img, zoom, alpha) => {
        if (!img) return;
        const cw = canvas.width, ch = canvas.height;
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom;
        ctx2d.globalAlpha = alpha;
        ctx2d.drawImage(img, (cw - img.naturalWidth * s) / 2, (ch - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
      };
      ctx2d.globalAlpha = 1;
      ctx2d.fillStyle = "#050816";
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      paint(images[i], zoomA, 1);
      paint(images[i + 1], zoomB, mix);
    }

    chapters.forEach((el, k) => {
      const d = x - k;
      const o = smooth(-0.45, -0.15, d) * (1 - smooth(0.25, 0.5, d));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${(-d * 60).toFixed(1)}px, 0)`;
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    });
    const e = smooth(N - 1.4, N - 1.08, x);
    endCard.style.opacity = e.toFixed(3);
    endCard.style.transform = `translate3d(0, ${((1 - e) * 40).toFixed(1)}px, 0)`;
    endCard.style.visibility = e < 0.01 ? "hidden" : "visible";

    bar.style.transform = `scaleX(${cur.toFixed(4)})`;
    count.textContent = String(Math.min(chapters.length, Math.round(x) + 1)).padStart(2, "0");
    hint.style.opacity = String(1 - smooth(0.01, 0.06, cur));
  }

  function loop() {
    raf = 0;
    resize();
    cur = cur < 0 ? target : cur + (target - cur) * 0.18;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    draw();
    if (cur !== target) raf = requestAnimationFrame(loop);
  }
  function request() { if (!raf) raf = requestAnimationFrame(loop); }

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { load(); request(); }
  }, { rootMargin: "100% 0px" }).observe(section);
  window.addEventListener("resize", request, { passive: true });
})();
