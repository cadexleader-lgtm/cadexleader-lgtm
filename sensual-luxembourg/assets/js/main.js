/* =========================================================
   Sensual Luxembourg — Interactions de base
   Volontairement léger : défilement natif, apparitions en CSS,
   aucune animation qui tourne en continu.
   ========================================================= */
(function () {
  "use strict";

  const CONFIG = window.SL_CONFIG || {};
  const SL = (window.SL = window.SL || {});
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const body = document.body;

  const lockScroll = (on) => body.classList.toggle("is-locked", on);

  /* ---------- Vérification d'âge, puis entrée du hero ---------- */
  const gate = qs(".gate");
  const KEY = "sl-age-ok";
  const ready = () => requestAnimationFrame(() => body.classList.add("is-ready"));
  let adult = false;
  try { adult = localStorage.getItem(KEY) === "1"; } catch (e) { /* navigation privée */ }
  if (adult) ready();
  else {
    gate.hidden = false;
    lockScroll(true);
    qs("[data-gate-accept]").focus({ preventScroll: true });
  }
  qs("[data-gate-accept]").addEventListener("click", () => {
    try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
    gate.hidden = true;
    lockScroll(false);
    ready();
  });

  /* ---------- Navigation, bouton WhatsApp, barre mobile ---------- */
  const nav = qs("[data-nav]");
  const fab = qs("[data-fab]");
  const mbar = qs("[data-mbar]");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 30);
    const past = y > window.innerHeight * 0.7;
    fab.classList.toggle("is-visible", past);
    mbar.classList.toggle("is-visible", past);
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const burger = qs("[data-burger]");
  const menu = qs("[data-menu]");
  const toggleMenu = (open) => {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    menu.setAttribute("aria-hidden", String(!open));
    lockScroll(open);
  };
  burger.addEventListener("click", () => toggleMenu(!body.classList.contains("menu-open")));
  qsa("a", menu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Apparitions au défilement ---------- */
  const reveals = qsa("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Filtres des massages ---------- */
  const tabs = qs("[data-tabs]");
  qsa("[data-filter]", tabs).forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa("[data-filter]", tabs).forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      const f = btn.dataset.filter;
      qsa(".service").forEach((c) => c.classList.toggle("is-hidden", f !== "all" && c.dataset.cat !== f));
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* ---------- Tarifs : salon / hôtel ---------- */
  const sw = qs("[data-switch]");
  qsa("[data-place]", sw).forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa("[data-place]", sw).forEach((b) => b.classList.toggle("is-active", b === btn));
      SL.pricePlace = btn.dataset.place;
      qsa("[data-price]").forEach((el) => { el.textContent = el.dataset[btn.dataset.place]; });
    });
  });

  /* ---------- FAQ ---------- */
  const faqBtns = qsa(".faq__q");
  faqBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      faqBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------- Visionneuse photo ---------- */
  const lb = qs("[data-lightbox]");
  const lbImg = qs("[data-lightbox-img]");
  const closeLb = () => { lb.hidden = true; lockScroll(false); };
  qsa(".gallery__item").forEach((item) => {
    item.addEventListener("click", () => {
      const img = qs("img", item);
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lb.hidden = false;
      lockScroll(true);
    });
  });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("[data-lightbox-close]")) closeLb(); });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!lb.hidden) closeLb();
    if (body.classList.contains("menu-open")) toggleMenu(false);
  });

  /* ---------- Notifications + liens WhatsApp ---------- */
  const toast = qs("[data-toast]");
  let toastTimer;
  function showToast(html, ms = 5000) {
    toast.innerHTML = html;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), ms);
  }
  const waLink = (text) => (CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}` : "");
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
  if (CONFIG.whatsappDisplay) qs("[data-whatsapp-label]").textContent = "WhatsApp — " + CONFIG.whatsappDisplay;
  qsa("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // API partagée avec booking.js et reel.js
  Object.assign(SL, {
    lockScroll, showToast, waLink,
    closeMenu: () => toggleMenu(false),
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
})();
