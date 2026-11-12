/* =========================================================
   Sensual Luxembourg — Interactions & animations
   GSAP + ScrollTrigger + Lenis (défilement fluide)
   ========================================================= */
(function () {
  "use strict";

  const CONFIG = window.SL_CONFIG || {};
  const SL = (window.SL = window.SL || {});

  const root = document.documentElement;
  const body = document.body;
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Sans GSAP (fichier bloqué, vieux navigateur…), on affiche tout simplement le site.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove("js");
    qs(".loader")?.remove();
    body.classList.remove("is-loading");
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out" });

  /* ---------------------------------------------------------
     Défilement fluide (Lenis)
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const lockScroll = (on) => {
    body.classList.toggle("is-locked", on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.6 });
    else (typeof target === "string" ? qs(target) : target)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  /* ---------------------------------------------------------
     Découpage du texte (lettres / mots) pour les animations
     --------------------------------------------------------- */
  function splitChars(el) {
    const units = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const word = document.createElement("span");
            word.className = "split-word";
            [...part].forEach((c) => {
              const s = document.createElement("span");
              s.className = "split-char";
              s.textContent = c;
              word.appendChild(s);
              units.push(s);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName === "EM") {
          // le dégradé du <em> ne supporte pas d'être découpé : on l'anime d'un bloc
          const wrap = document.createElement("span");
          wrap.className = "split-char split-em";
          child.replaceWith(wrap);
          wrap.appendChild(child);
          units.push(wrap);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return units;
  }

  // Mots masqués : chaque mot remonte depuis un masque (effet "rideau")
  function splitWordsMasked(el) {
    const inners = [];
    const wrapUnit = (content) => {
      const mask = document.createElement("span");
      mask.className = "split-word";
      mask.style.cssText = "overflow:hidden;vertical-align:top;padding-bottom:.12em;margin-bottom:-.12em;";
      const inner = document.createElement("span");
      inner.style.display = "inline-block";
      inner.appendChild(content);
      mask.appendChild(inner);
      inners.push(inner);
      return mask;
    };
    [...el.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
          else frag.appendChild(wrapUnit(document.createTextNode(part)));
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        const placeholder = document.createComment("");
        child.replaceWith(placeholder);
        placeholder.replaceWith(wrapUnit(child));
      }
    });
    return inners;
  }

  /* ---------------------------------------------------------
     Préchargement → vérification d'âge → intro du hero
     --------------------------------------------------------- */
  const loader = qs(".loader");
  const gate = qs(".gate");
  const AGE_KEY = "sl-age-ok";
  const loaderState = { p: 0 };
  const countEl = qs("[data-loader-count]");
  const barEl = qs(".loader__bar span");
  const renderLoader = () => {
    const v = Math.round(loaderState.p);
    if (countEl) countEl.textContent = v;
    if (barEl) barEl.style.width = v + "%";
  };
  const loaderTween = gsap.to(loaderState, { p: 88, duration: 1.4, ease: "power2.out", onUpdate: renderLoader });

  const pageReady = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
    setTimeout(resolve, 3500); // filet de sécurité
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([pageReady, fontsReady, new Promise((r) => setTimeout(r, 1100))]).then(() => {
    loaderTween.kill();
    gsap.to(loaderState, {
      p: 100, duration: 0.5, ease: "power2.inOut", onUpdate: renderLoader,
      onComplete: () => {
        gsap.to(loader, {
          clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut",
          onComplete: () => { loader.remove(); body.classList.remove("is-loading"); ScrollTrigger.refresh(); },
        });
        let ok = false;
        try { ok = localStorage.getItem(AGE_KEY) === "1"; } catch (e) { /* navigation privée */ }
        if (ok) { lockScroll(false); gsap.delayedCall(0.45, heroIntro); }
        else openGate();
      },
    });
  });

  function openGate() {
    gate.hidden = false;
    lockScroll(true);
    gsap.fromTo(".gate__bg", { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out", delay: 0.3 });
    gsap.fromTo(".gate__card", { opacity: 0, y: 60, scale: 0.94, rotateX: 12 }, { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.4, delay: 0.5 });
    qs("[data-gate-accept]").focus({ preventScroll: true });
  }
  qs("[data-gate-accept]")?.addEventListener("click", () => {
    try { localStorage.setItem(AGE_KEY, "1"); } catch (e) { /* ignore */ }
    gsap.to(".gate__card", { opacity: 0, y: -40, scale: 0.96, duration: 0.6, ease: "power2.in" });
    gsap.to(".gate__bg", {
      opacity: 0, duration: 0.8, delay: 0.2, ease: "power2.inOut",
      onComplete: () => { gate.hidden = true; lockScroll(false); heroIntro(); },
    });
  });

  /* ---------------------------------------------------------
     Intro du hero (entrée cinématique)
     --------------------------------------------------------- */
  const heroTitle = qs("[data-hero-title]");
  const heroChars = splitChars(heroTitle);
  let introPlayed = false;

  function heroIntro() {
    if (introPlayed) return;
    introPlayed = true;
    if (reduced) { gsap.set(["[data-hero-fade]", ".hero__visual"], { opacity: 1 }); return; }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".nav__inner", { y: -40, opacity: 0, duration: 1.2 }, 0)
      .fromTo(".hero__visual", { opacity: 0, y: 80, rotateY: -14, scale: 0.9 }, { opacity: 1, y: 0, rotateY: 0, scale: 1, duration: 2 }, 0)
      .from(".arch img", { scale: 1.5, duration: 2.4 }, 0)
      .from(".arch", { clipPath: "inset(100% 0 0 0 round 999px 999px 40px 40px)", duration: 1.8, ease: "expo.inOut" }, 0)
      .from(heroChars.filter((c) => !c.classList.contains("split-em")), {
        yPercent: 120, rotateX: -90, opacity: 0, transformOrigin: "50% 100% -30px", duration: 1.4, stagger: 0.028,
      }, 0.2)
      .from(qsa(".split-em", heroTitle), { opacity: 0, y: 60, scale: 0.85, filter: "blur(14px)", duration: 1.8 }, 0.65)
      .fromTo("[data-hero-fade]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.6)
      .from(".float-card, .float-thumb", { opacity: 0, scale: 0.6, y: 40, duration: 1.4, stagger: 0.12, ease: "back.out(1.6)" }, 1)
      .from(".orbit", { opacity: 0, scale: 0.4, rotate: -120, duration: 1.6 }, 1.1)
      .from(".hero__scroll", { opacity: 0, y: 20, duration: 1 }, 1.4);
  }

  /* ---------------------------------------------------------
     Hero : parallaxe 3D à la souris + sortie au défilement
     --------------------------------------------------------- */
  const stage = qs("[data-stage]");
  if (stage && !reduced) {
    qsa("[data-depth]", stage).forEach((el) => gsap.set(el, { z: Number(el.dataset.depth) || 0 }));
    if (finePointer) {
      const rx = gsap.quickTo(stage, "rotationX", { duration: 1.2, ease: "power3.out" });
      const ry = gsap.quickTo(stage, "rotationY", { duration: 1.2, ease: "power3.out" });
      const movers = qsa("[data-depth]", stage).map((el) => ({
        d: Number(el.dataset.depth) || 0,
        x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }),
      }));
      qs(".hero").addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 14);
        rx(-ny * 10);
        movers.forEach((m) => { m.x(nx * m.d * 0.35); m.y(ny * m.d * 0.35); });
      });
    }
    gsap.to(".hero__copy", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__visual", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------------------------------------------------------
     Navigation : masquage au défilement, menu mobile, liens actifs
     --------------------------------------------------------- */
  const nav = qs("[data-nav]");
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-scrolled", y > 40);
    if (!body.classList.contains("menu-open")) nav.classList.toggle("is-hidden", y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
    const past = y > window.innerHeight * 0.7;
    qs("[data-fab]").classList.toggle("is-visible", past);
    qs("[data-mbar]").classList.toggle("is-visible", past);
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  const burger = qs("[data-burger]");
  const menu = qs("[data-menu]");
  const toggleMenu = (open) => {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    menu.setAttribute("aria-hidden", String(!open));
    lockScroll(open);
    if (open) nav.classList.remove("is-hidden");
  };
  burger.addEventListener("click", () => toggleMenu(!body.classList.contains("menu-open")));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) toggleMenu(false); });

  // Ancres internes en défilement fluide
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute("data-wa")) return;
    const id = a.getAttribute("href");
    if (id.length < 2 && id !== "#") return;
    e.preventDefault();
    if (body.classList.contains("menu-open")) toggleMenu(false);
    if (id === "#" || id === "#top") scrollToTarget(0);
    else if (qs(id)) scrollToTarget(qs(id));
  });

  const navLinks = qsa(".nav__links a");
  navLinks.forEach((link) => {
    const section = qs(link.getAttribute("href"));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: "top 45%", end: "bottom 45%",
      onToggle: (self) => { if (self.isActive) navLinks.forEach((l) => l.classList.toggle("is-active", l === link)); },
    });
  });

  /* ---------------------------------------------------------
     Curseur personnalisé + boutons magnétiques
     --------------------------------------------------------- */
  if (finePointer && !reduced) {
    root.classList.add("has-cursor");
    const cursor = qs(".cursor");
    const dot = qs(".cursor__dot");
    const ring = qs(".cursor__ring");
    const label = qs(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3.out" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3.out" });
    window.addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const hoverable = e.target.closest("a, button, label, select, input, textarea, [data-tilt]");
      cursor.classList.toggle("is-label", !!labelled);
      cursor.classList.toggle("is-hover", !labelled && !!hoverable);
      label.textContent = labelled ? labelled.dataset.cursor : "";
    });
    document.addEventListener("pointerleave", () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
    document.addEventListener("pointerenter", () => gsap.to(cursor, { opacity: 1, duration: 0.3 }));

    qsa("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.28);
        my((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });

    // Cartes inclinables en 3D + reflet lumineux
    qsa("[data-tilt]").forEach((card) => {
      const tx = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3.out" });
      const ty = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3.out" });
      gsap.set(card, { transformPerspective: 1000 });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tx((px - 0.5) * 9);
        ty(-(py - 0.5) * 7);
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("pointerleave", () => { tx(0); ty(0); });
    });
  }

  /* ---------------------------------------------------------
     Bandeau défilant réactif à la vitesse du scroll
     --------------------------------------------------------- */
  const marquee = qs("[data-marquee]");
  if (marquee && !reduced) {
    let x = 0, dir = -1;
    gsap.ticker.add(() => {
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      x += (0.55 + Math.min(v, 60) * 0.12) * dir;
      const half = marquee.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      marquee.style.transform = `translate3d(${x}px,0,0)`;
    });
    if (lenis) lenis.on("scroll", ({ direction }) => { if (direction) dir = direction > 0 ? -1 : 1; });
  }

  /* ---------------------------------------------------------
     Apparitions au défilement (effets « waouh »)
     --------------------------------------------------------- */
  if (reduced) {
    gsap.set("[data-reveal], [data-reveal-card]", { opacity: 1 });
  } else {
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%", once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.1 }),
    });
    // cartes génériques
    ScrollTrigger.batch("[data-reveal-card]:not(.service):not(.price):not(.bento__item)", {
      start: "top 90%", once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 90, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.5, stagger: 0.12, clearProps: "scale" }),
    });
    // massages : les cartes basculent en 3D, l'image se dévoile comme un rideau
    gsap.set(".service", { transformPerspective: 1100, transformOrigin: "50% 0%" });
    ScrollTrigger.batch(".service", {
      start: "top 92%", once: true,
      onEnter: (els) => {
        gsap.fromTo(els, { opacity: 0, rotationX: -48, y: 140, z: -260 }, { opacity: 1, rotationX: 0, y: 0, z: 0, duration: 1.8, stagger: 0.14 });
        els.forEach((card, k) => {
          gsap.fromTo(qs(".service__media", card), { clipPath: "inset(100% 0% 0% 0% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.6, delay: 0.15 + k * 0.14, ease: "expo.inOut" });
          gsap.fromTo(qs(".service__media img", card), { scale: 1.5 }, { scale: 1, duration: 2.2, delay: 0.15 + k * 0.14, clearProps: "transform" });
        });
      },
    });
    // engagements : la grille s'assemble depuis le centre
    gsap.set(".bento__item", { transformPerspective: 1000 });
    ScrollTrigger.create({
      trigger: ".bento", start: "top 80%", once: true,
      onEnter: () => gsap.fromTo(".bento__item", { opacity: 0, scale: 0.7, rotationX: 30, y: 80 }, { opacity: 1, scale: 1, rotationX: 0, y: 0, duration: 1.6, stagger: { each: 0.1, from: "center" }, clearProps: "scale" }),
    });
    // tarifs : les cartes s'ouvrent en éventail
    ScrollTrigger.create({
      trigger: ".pricing__grid", start: "top 82%", once: true,
      onEnter: () => {
        const cards = qsa(".pricing__grid .price");
        const wide = window.innerWidth > 1180;
        cards.forEach((c, k) => {
          const side = wide ? (c.classList.contains("price--featured") ? 0 : (k === 0 ? -1 : 1)) : 0;
          gsap.fromTo(c, { opacity: 0, x: -side * 260, y: 120, rotation: side * 14, scale: 0.9 },
            { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 1.8, delay: side === 0 ? 0 : 0.15, clearProps: "scale,rotation" });
        });
      },
    });
    // titres de section : les mots remontent derrière un masque
    qsa("[data-split]").forEach((title) => {
      const words = splitWordsMasked(title);
      gsap.from(words, {
        yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.06,
        scrollTrigger: { trigger: title, start: "top 86%", once: true },
      });
    });
    // pied de page : le grand « Sensual » se lève lettre par lettre au défilement
    const giant = qs(".footer__giant");
    if (giant) {
      const letters = [...giant.textContent].map((c) => `<span class="split-char" style="background:inherit;-webkit-background-clip:text;background-clip:text">${c}</span>`).join("");
      giant.innerHTML = letters;
      gsap.from(qsa(".split-char", giant), {
        yPercent: 70, opacity: 0, rotationX: -70, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: giant, start: "top bottom", end: "bottom 85%", scrub: 0.8 },
      });
    }
    // déformation légère des images selon la vitesse du défilement
    if (lenis) {
      const skewables = qsa(".service__media, .step__media, .bento__item--hero > img");
      const setSkew = skewables.map((el) => gsap.quickTo(el, "skewY", { duration: 0.6, ease: "power3.out" }));
      lenis.on("scroll", ({ velocity }) => {
        const k = gsap.utils.clamp(-4, 4, velocity * 0.12);
        setSkew.forEach((fn) => fn(k));
      });
    }
  }

  // Manifeste : les mots s'allument au fil du défilement
  const manifesto = qs("[data-words]");
  if (manifesto) {
    const units = [];
    [...manifesto.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "w";
          w.textContent = part;
          frag.appendChild(w);
          units.push(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        child.classList.add("w");
        units.push(child);
      }
    });
    if (!reduced) {
      gsap.to(units, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: manifesto, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
      });
      qsa(".inline-img", manifesto).forEach((pill) => {
        gsap.from(pill, { width: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: pill, start: "top 80%", once: true } });
      });
    }
  }

  /* ---------------------------------------------------------
     Massages : filtres par univers
     --------------------------------------------------------- */
  const tabs = qs("[data-tabs]");
  const ind = qs(".tabs__ind", tabs);
  const moveInd = (btn) => { ind.style.width = btn.offsetWidth + "px"; ind.style.transform = `translateX(${btn.offsetLeft - 5}px)`; };
  const firstTab = qs('[aria-selected="true"]', tabs);
  moveInd(firstTab);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => moveInd(qs('[aria-selected="true"]', tabs)));
  qsa("[data-filter]", tabs).forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa("[data-filter]", tabs).forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      moveInd(btn);
      const f = btn.dataset.filter;
      const cards = qsa(".service");
      gsap.to(cards, {
        opacity: 0, y: 20, duration: 0.3, ease: "power2.in",
        onComplete: () => {
          cards.forEach((c) => c.classList.toggle("is-hidden", f !== "all" && c.dataset.cat !== f));
          const shown = cards.filter((c) => !c.classList.contains("is-hidden"));
          gsap.fromTo(shown, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 });
          ScrollTrigger.refresh();
        },
      });
    });
  });

  /* ---------------------------------------------------------
     Expérience : défilement horizontal épinglé (desktop)
     --------------------------------------------------------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 961px)", () => {
    const track = qs("[data-steps-track]");
    const bar = qs("[data-steps-bar]");
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "[data-steps-pin]", start: "top top", end: () => "+=" + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
    qsa(".step", track).forEach((step) => {
      gsap.fromTo(qs("img", step), { xPercent: -4 }, {
        xPercent: 4, ease: "none",
        scrollTrigger: { trigger: step, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
      });
      gsap.fromTo(step, { rotationY: -28, z: -120, transformPerspective: 1200 }, {
        rotationY: 20, z: -60, ease: "none",
        scrollTrigger: { trigger: step, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
      });
    });
    return () => gsap.set(track, { clearProps: "x" });
  });

  /* ---------------------------------------------------------
     Compteurs animés
     --------------------------------------------------------- */
  qsa("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.dec || 0);
    const fmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const o = { v: 0 };
    if (reduced) { el.textContent = fmt.format(target); return; }
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 2.4, ease: "power3.out", onUpdate: () => { el.textContent = fmt.format(o.v); } }),
    });
  });

  /* ---------------------------------------------------------
     Film d'ambiance : ouverture du cadre au défilement
     --------------------------------------------------------- */
  const film = qs("[data-film]");
  const video = qs("[data-film-video]");
  if (film) {
    if (!reduced) {
      const small = window.innerWidth < 640;
      gsap.fromTo(film, { clipPath: small ? "inset(4% 4% 4% 4% round 28px)" : "inset(8% 9% 8% 9% round 40px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: film, start: "top 85%", end: "top top", scrub: true },
      });
      gsap.fromTo(video, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: film, start: "top bottom", end: "bottom top", scrub: true } });
    }
    new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) video.play().catch(() => {}); else video.pause(); });
    }, { threshold: 0.15 }).observe(film);
  }

  /* ---------------------------------------------------------
     Visionneuse photo (galerie 3D)
     --------------------------------------------------------- */
  const lb = qs("[data-lightbox]");
  const lbImg = qs("[data-lightbox-img]");
  const closeLb = () => {
    lb.classList.remove("is-open");
    setTimeout(() => { lb.hidden = true; }, 400);
    lockScroll(false);
  };
  qsa(".tunnel__item").forEach((item) => {
    item.addEventListener("click", () => {
      const img = qs("img", item);
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("is-open"));
      lockScroll(true);
      qs("[data-lightbox-close]").focus();
    });
  });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("[data-lightbox-close]")) closeLb(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* ---------------------------------------------------------
     Tarifs : salon / hôtel
     --------------------------------------------------------- */
  const sw = qs(".switch");
  const swInd = qs(".switch__ind", sw);
  const moveSw = (btn) => { swInd.style.width = btn.offsetWidth + "px"; swInd.style.transform = `translateX(${btn.offsetLeft - 5}px)`; };
  moveSw(qs(".is-active", sw));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => moveSw(qs(".is-active", sw)));
  qsa("[data-place]", sw).forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa("[data-place]", sw).forEach((b) => b.classList.toggle("is-active", b === btn));
      SL.pricePlace = btn.dataset.place;
      moveSw(btn);
      qsa("[data-price]").forEach((el) => {
        const o = { v: Number(el.textContent) };
        gsap.to(o, { v: Number(el.dataset[btn.dataset.place]), duration: 0.9, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
      });
    });
  });

  /* ---------------------------------------------------------
     FAQ en accordéon
     --------------------------------------------------------- */
  const faqBtns = qsa(".faq__q");
  faqBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      faqBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", String(!open));
      clearTimeout(btn._t);
      btn._t = setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  /* ---------------------------------------------------------
     Notifications + liens WhatsApp directs
     --------------------------------------------------------- */
  const toast = qs("[data-toast]");
  let toastTimer;
  function showToast(html, ms = 5200) {
    toast.innerHTML = html;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), ms);
  }
  const waLink = (text) => CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}` : "";
  const hello = "Bonjour Sensual Luxembourg, j'aimerais avoir des informations sur vos massages.";
  qsa("[data-wa]").forEach((a) => {
    if (CONFIG.whatsapp) {
      a.href = waLink(hello);
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("<strong>Mode démo :</strong> ce bouton ouvrira la conversation WhatsApp du salon dès que le numéro sera ajouté.");
      });
    }
  });
  if (CONFIG.whatsappDisplay) qs("[data-whatsapp-label]").textContent = CONFIG.whatsappDisplay;
  if (CONFIG.email) qs("[data-email-label]").innerHTML = `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`;

  // API partagée avec booking.js, reel.js et tunnel.js
  Object.assign(SL, { lenis, lockScroll, scrollToTarget, showToast, waLink, closeMenu: () => toggleMenu(false), reduced, finePointer });

  qsa("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Recalcule les positions quand les images différées arrivent
  let refreshT;
  qsa("img[loading='lazy']").forEach((img) => img.addEventListener("load", () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 200); }, { once: true }));
})();
