/* =========================================================
   Sensual Luxembourg — Galerie « vol en 3D »
   Les photos sont disposées en profondeur ; le défilement fait
   avancer la caméra à travers elles (brume au loin, passage au premier plan).
   ========================================================= */
(function () {
  "use strict";

  const section = document.querySelector("[data-tunnel]");
  if (!section) return;
  const SL = window.SL || {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) { section.classList.add("tunnel--static"); return; }

  const { gsap, ScrollTrigger } = window;
  const space = section.querySelector("[data-tunnel-space]");
  const items = [...section.querySelectorAll(".tunnel__item")];
  const intro = section.querySelector("[data-tunnel-intro]");
  const outro = section.querySelector("[data-tunnel-outro]");
  const bar = section.querySelector("[data-tunnel-bar]");

  const GAP = 1100;          // distance entre deux photos (px)
  const START = -1500;        // la première photo démarre un peu au loin
  const total = items.length * GAP + 1600;
  const mobile = () => window.innerWidth < 760;

  const data = items.map((el, k) => {
    const w = Number(el.dataset.w) || 26;
    el.style.setProperty("--w", w);
    return { el, z: START - k * GAP, x: Number(el.dataset.x) || 0, y: Number(el.dataset.y) || 0 };
  });

  let target = 0, cur = 0, running = false, visible = false;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (SL.finePointer) {
    section.addEventListener("pointermove", (e) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    });
  }

  ScrollTrigger.create({
    trigger: section, start: "top top", end: "bottom bottom",
    onUpdate: (self) => { target = self.progress; start(); },
  });

  function render() {
    const cam = cur * total;
    const xs = mobile() ? 0.62 : 1;
    data.forEach((d) => {
      const z = d.z + cam;                                  // position relative à la caméra
      const fadeIn = smooth(-4200, -2200, z);               // sort de la brume
      const fadeOut = 1 - smooth(250, 700, z);              // dépasse la caméra
      const o = fadeIn * fadeOut;
      d.el.style.opacity = o.toFixed(3);
      d.el.style.visibility = o < 0.01 ? "hidden" : "visible";
      d.el.style.pointerEvents = o > 0.5 && z < 300 ? "auto" : "none";
      d.el.style.transform = `translate(-50%, -50%) translate3d(${(d.x * xs).toFixed(2)}vw, ${d.y.toFixed(2)}vh, ${z.toFixed(1)}px)`;
      d.el.style.filter = z < -1800 ? `blur(${Math.min(6, (-1800 - z) / 300).toFixed(1)}px) brightness(${(0.6 + 0.4 * fadeIn).toFixed(2)})` : "none";
    });
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    space.style.transform = `rotateY(${(mouse.x * 8).toFixed(2)}deg) rotateX(${(-mouse.y * 6).toFixed(2)}deg)`;
    intro.style.opacity = (1 - smooth(0.015, 0.09, cur)).toFixed(3);
    intro.style.transform = `translate(-50%, -50%) scale(${(1 + cur * 3).toFixed(3)})`;
    const e = smooth(0.86, 0.97, cur);
    outro.style.opacity = e.toFixed(3);
    outro.style.transform = `translate(-50%, -50%) scale(${(0.85 + e * 0.15).toFixed(3)})`;
    outro.style.pointerEvents = e > 0.6 ? "auto" : "none";
    bar.style.transform = `scaleX(${cur.toFixed(4)})`;
  }

  function loop() {
    cur += (target - cur) * 0.09;
    if (Math.abs(target - cur) < 0.0001) cur = target;
    render();
    const settled = cur === target && Math.abs(mouse.tx - mouse.x) < 0.001 && Math.abs(mouse.ty - mouse.y) < 0.001;
    if (settled && !visible) { running = false; return; }
    if (settled) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(section);
  section.addEventListener("pointermove", start);
  render();
})();
