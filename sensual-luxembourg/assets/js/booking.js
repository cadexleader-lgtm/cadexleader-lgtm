/* =========================================================
   Sensual Luxembourg — Parcours de réservation
   1. Massage + durée + lieu  →  2. Jour + heure  →  3. Coordonnées + paiement
   →  envoi pré-rempli sur WhatsApp  →  paiement en ligne / agenda
   Le catalogue est lu dans la page (attributs data-service des cartes).
   ========================================================= */
(function () {
  "use strict";

  const C = window.SL_CONFIG || {};
  const SL = (window.SL = window.SL || {});
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const drawer = qs("[data-drawer]");
  if (!drawer) return;

  const gsap = window.gsap;
  const panel = qs(".drawer__panel", drawer);
  const scroller = qs("[data-bd-body]", drawer);
  const nextBtn = qs("[data-bd-next]", drawer);
  const prevBtn = qs("[data-bd-prev]", drawer);
  const foot = qs("[data-bd-foot]", drawer);
  const toast = (html, ms) => (SL.showToast ? SL.showToast(html, ms) : window.alert(html.replace(/<[^>]+>/g, "")));
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const euro = (n) => n.toLocaleString("fr-FR") + " €";
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const ICON = (id) => `<svg><use href="#i-${id}"/></svg>`;

  /* ---------- Catalogue ---------- */
  const fees = Object.assign({ salon: 0, hotel: 40, domicile: 40 }, C.placeFees || {});
  const PLACES = [
    { id: "salon", label: "Salon privé", note: "Luxembourg-Ville" },
    { id: "hotel", label: "Mon hôtel", note: fees.hotel ? `+${fees.hotel} €` : "inclus" },
    { id: "domicile", label: "Domicile", note: fees.domicile ? `+${fees.domicile} €` : "inclus" },
  ];
  const services = [];
  qsa("[data-service]").forEach((el) => {
    if (services.some((s) => s.id === el.dataset.service)) return;
    services.push({
      id: el.dataset.service,
      name: el.dataset.name,
      group: el.dataset.group || "Massages",
      img: el.dataset.img,
      prices: el.dataset.prices.split(",").map((p) => { const [d, price] = p.split(":").map(Number); return { d, price }; }),
    });
  });
  const byId = Object.fromEntries(services.map((s) => [s.id, s]));
  const groups = [...new Set(services.map((s) => s.group))];
  const pct = (C.payment && C.payment.depositPercent) || 30;
  const SLOTS = C.slots || ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"];

  const state = { step: 1, service: null, duration: null, place: "salon", address: "", day: null, slot: null, pay: "onsite", ref: "", message: "" };

  /* ---------- Calculs ---------- */
  const current = () => byId[state.service];
  const basePrice = () => { const s = current(); const p = s && s.prices.find((x) => x.d === state.duration); return p ? p.price : 0; };
  const total = () => basePrice() + (fees[state.place] || 0);
  const deposit = () => Math.ceil((total() * pct) / 100);
  const dueNow = () => (state.pay === "deposit" ? deposit() : state.pay === "full" ? total() : 0);

  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const days = () => Array.from({ length: C.daysAhead || 14 }, (_, k) => { const d = startOfDay(new Date()); d.setDate(d.getDate() + k); return d; });
  const slotDate = (day, hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    if (h < 6) d.setDate(d.getDate() + 1); // créneaux après minuit = nuit suivante
    return d;
  };
  const isPast = (day, hhmm) => slotDate(day, hhmm).getTime() < Date.now() + (C.minNoticeMinutes ?? 60) * 60000;
  const isBusy = (day, hhmm) => {
    if (!C.simulateBusySlots) return false;
    let h = 7;
    for (const ch of day.toDateString() + hhmm) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % 100 < 22;
  };
  const available = (day, hhmm) => !isPast(day, hhmm) && !isBusy(day, hhmm);
  const dayHasSlots = (day) => SLOTS.some((s) => available(day, s));
  const fmtDay = (d, opts = { weekday: "long", day: "numeric", month: "long" }) => d.toLocaleDateString("fr-FR", opts);
  const fmtWhen = () => {
    if (!state.day || !state.slot) return "";
    const real = slotDate(state.day, state.slot);
    if (real.getDate() !== state.day.getDate()) {
      return `nuit du ${fmtDay(state.day, { weekday: "long", day: "numeric" })} au ${fmtDay(real)}, à ${state.slot}`;
    }
    return `${fmtDay(real)} à ${state.slot}`;
  };

  /* ---------- Rendu étape 1 ---------- */
  const servicesBox = qs("[data-bd-services]", drawer);
  servicesBox.innerHTML = groups.map((g) => `
    <div class="bd-services__group">${esc(g)}</div>
    ${services.filter((s) => s.group === g).map((s) => `
      <button type="button" class="bd-service" data-id="${s.id}" aria-pressed="false">
        <img src="${s.img}" alt="" loading="lazy">
        <span class="bd-service__txt"><strong>${esc(s.name)}</strong><small>${s.prices.map((p) => p.d).join(" · ")} min</small></span>
        <span class="bd-service__price">dès ${euro(Math.min(...s.prices.map((p) => p.price)))}</span>
        <span class="bd-radio" aria-hidden="true"></span>
      </button>`).join("")}`).join("");

  const durWrap = qs("[data-bd-durations-wrap]", drawer);
  const durBox = qs("[data-bd-durations]", drawer);
  const placeBox = qs("[data-bd-places]", drawer);
  const addrField = qs("[data-bd-address]", drawer);
  const addrInput = qs("#bd-address", drawer);

  function renderDurations() {
    const s = current();
    durWrap.hidden = !s;
    if (!s) return;
    durBox.innerHTML = s.prices.map((p) => `
      <button type="button" class="bd-chip${p.d === state.duration ? " is-on" : ""}" data-d="${p.d}">
        <strong>${p.d} min</strong><small>${euro(p.price + (fees[state.place] || 0))}</small>
      </button>`).join("");
  }
  function renderPlaces() {
    placeBox.innerHTML = PLACES.map((p) => `
      <button type="button" class="bd-chip${p.id === state.place ? " is-on" : ""}" data-place="${p.id}">
        <strong>${p.label}</strong><small>${p.note}</small>
      </button>`).join("");
    addrField.hidden = state.place === "salon";
  }
  function markService() {
    qsa(".bd-service", servicesBox).forEach((b) => {
      const on = b.dataset.id === state.service;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  function selectService(id, keepDuration) {
    const s = byId[id];
    if (!s) return;
    state.service = id;
    if (!keepDuration || !s.prices.some((p) => p.d === state.duration)) state.duration = s.prices[0].d;
    markService();
    renderDurations();
    updateSummary();
  }
  servicesBox.addEventListener("click", (e) => {
    const b = e.target.closest(".bd-service");
    if (!b) return;
    selectService(b.dataset.id, false);
    if (gsap) gsap.fromTo(durWrap, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
  });
  durBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]");
    if (!b) return;
    state.duration = Number(b.dataset.d);
    renderDurations();
    updateSummary();
  });
  placeBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-place]");
    if (!b) return;
    state.place = b.dataset.place;
    renderPlaces();
    renderDurations();
    updateSummary();
    if (!addrField.hidden) addrInput.focus({ preventScroll: true });
  });
  addrInput.addEventListener("input", () => { state.address = addrInput.value.trim(); });

  /* ---------- Rendu étape 2 ---------- */
  const daysBox = qs("[data-bd-days]", drawer);
  const slotsBox = qs("[data-bd-slots]", drawer);
  function renderDays() {
    const list = days();
    if (!state.day || !dayHasSlots(state.day)) state.day = list.find(dayHasSlots) || list[0];
    daysBox.innerHTML = list.map((d, k) => {
      const ok = dayHasSlots(d);
      const on = state.day && d.getTime() === state.day.getTime();
      const top = k === 0 ? "Auj." : k === 1 ? "Demain" : cap(fmtDay(d, { weekday: "short" }).replace(".", ""));
      return `<button type="button" class="bd-day${on ? " is-on" : ""}" data-day="${d.getTime()}"${ok ? "" : " disabled"}>
        <small>${top}</small><strong>${d.getDate()}</strong><small>${fmtDay(d, { month: "short" }).replace(".", "")}</small></button>`;
    }).join("");
  }
  function renderSlots() {
    if (state.slot && !available(state.day, state.slot)) state.slot = null;
    slotsBox.innerHTML = SLOTS.map((t) => {
      const past = isPast(state.day, t);
      const busy = !past && isBusy(state.day, t);
      const cls = ["bd-slot", t === state.slot ? "is-on" : "", busy ? "is-busy" : "", past ? "is-past" : ""].join(" ");
      return `<button type="button" class="${cls}" data-slot="${t}"${past || busy ? " disabled" : ""}>${t}${busy ? "<small>complet</small>" : ""}</button>`;
    }).join("");
  }
  daysBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (!b || b.disabled) return;
    state.day = new Date(Number(b.dataset.day));
    renderDays();
    renderSlots();
    updateSummary();
    if (gsap) gsap.fromTo(".bd-slot", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.015, ease: "power2.out" });
  });
  slotsBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-slot]");
    if (!b || b.disabled) return;
    state.slot = b.dataset.slot;
    renderSlots();
    updateSummary();
  });

  /* ---------- Rendu étape 3 ---------- */
  const payBox = qs("[data-bd-pay]", drawer);
  const recapBox = qs("[data-bd-recap]", drawer);
  const nameInput = qs("#bd-name", drawer);
  const phoneInput = qs("#bd-phone", drawer);
  const msgInput = qs("#bd-msg", drawer);
  const adultInput = qs("[data-bd-adult]", drawer);
  function renderPay() {
    const opts = [
      { id: "onsite", icon: "hotel", title: "Payer sur place", sub: "Espèces, carte bancaire ou Payconiq" },
      { id: "deposit", icon: "lock", title: `Acompte en ligne · ${pct} %`, sub: `${euro(deposit())} maintenant, le reste sur place` },
      { id: "full", icon: "gem", title: "Tout régler en ligne", sub: `${euro(total())} · paiement sécurisé, libellé discret` },
    ];
    payBox.innerHTML = opts.map((o) => `
      <button type="button" class="bd-payopt${o.id === state.pay ? " is-on" : ""}" data-pay="${o.id}">
        <span class="bd-payopt__ico">${ICON(o.icon)}</span>
        <span class="bd-payopt__txt"><strong>${o.title}</strong><small>${o.sub}</small></span>
        <span class="bd-radio" aria-hidden="true"></span>
      </button>`).join("");
  }
  function renderRecap() {
    const s = current();
    const place = PLACES.find((p) => p.id === state.place);
    const rows = [
      ["Massage", s ? `${s.name} · ${state.duration} min` : "—"],
      ["Date", cap(fmtWhen()) || "—"],
      ["Lieu", place.label + (state.address ? ` — ${state.address}` : "")],
    ];
    recapBox.innerHTML = `
      ${rows.map(([k, v]) => `<div class="bd-recap__row"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("")}
      <div class="bd-recap__total"><span>Total</span><strong>${euro(total())}</strong></div>
      ${dueNow() ? `<div class="bd-recap__due"><span>À régler en ligne maintenant</span><strong>${euro(dueNow())}</strong></div>` : ""}`;
  }
  payBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pay]");
    if (!b) return;
    state.pay = b.dataset.pay;
    renderPay();
    renderRecap();
  });

  /* ---------- Navigation entre étapes ---------- */
  const tabs = qsa("[data-bd-tabs] li", drawer);
  const bar = qs("[data-bd-bar]", drawer);
  const sumLabel = qs("[data-bd-sum-label]", drawer);
  const sumTotal = qs("[data-bd-total]", drawer);
  const nextLabel = qs("[data-bd-next-label]", drawer);

  function updateSummary() {
    const s = current();
    if (!s) { sumLabel.textContent = "Votre sélection"; sumTotal.textContent = "—"; return; }
    sumLabel.textContent = `${s.name} · ${state.duration} min` + (state.slot ? ` · ${state.slot}` : "");
    sumTotal.textContent = euro(total());
  }

  function goTo(step, dir = 1) {
    state.step = step;
    qsa(".bd-step", drawer).forEach((el) => el.classList.toggle("is-active", Number(el.dataset.step) === step));
    tabs.forEach((li, k) => { li.classList.toggle("is-active", k + 1 === step); li.classList.toggle("is-done", k + 1 < step); });
    bar.style.transform = `scaleX(${Math.min(step - 1, 3) / 3})`;
    prevBtn.hidden = step === 1 || step === 4;
    foot.hidden = step === 4;
    foot.dataset.step = String(step);
    nextLabel.textContent = step === 3 ? "Envoyer sur WhatsApp" : "Continuer";
    qs("use", nextBtn).setAttribute("href", step === 3 ? "#i-whatsapp" : "#i-arrow");
    nextBtn.classList.toggle("is-wa", step === 3);
    if (step === 2) { renderDays(); renderSlots(); }
    if (step === 3) { renderPay(); renderRecap(); }
    scroller.scrollTop = 0;
    const active = qs(`.bd-step[data-step="${step}"]`, drawer);
    if (gsap) gsap.fromTo(active.children, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
  }

  function shake(el) { if (gsap && el) gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" }); }

  nextBtn.addEventListener("click", () => {
    if (state.step === 1) {
      if (!state.service) { toast("Choisissez d'abord votre massage."); shake(servicesBox); return; }
      goTo(2);
    } else if (state.step === 2) {
      if (!state.slot) { toast("Choisissez une heure d'arrivée."); shake(slotsBox); return; }
      goTo(3);
    } else if (state.step === 3) {
      const nameOk = nameInput.value.trim().length > 0;
      nameInput.closest(".field").classList.toggle("is-invalid", !nameOk);
      qs("[data-bd-consent]", drawer).classList.toggle("is-invalid", !adultInput.checked);
      if (!nameOk || !adultInput.checked) { toast("Merci d'indiquer votre prénom et de confirmer votre majorité."); shake(nameOk ? adultInput.closest("label") : nameInput.closest(".field")); return; }
      confirmBooking();
    }
  });
  prevBtn.addEventListener("click", () => goTo(Math.max(1, state.step - 1), -1));
  nameInput.addEventListener("input", () => nameInput.closest(".field").classList.remove("is-invalid"));
  adultInput.addEventListener("change", () => qs("[data-bd-consent]", drawer).classList.remove("is-invalid"));

  /* ---------- Confirmation ---------- */
  const makeRef = () => "SL-" + Array.from({ length: 4 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");

  function buildMessage() {
    const s = current();
    const place = PLACES.find((p) => p.id === state.place);
    const payTxt = state.pay === "onsite" ? "sur place"
      : state.pay === "deposit" ? `acompte en ligne de ${euro(deposit())} (reste ${euro(total() - deposit())} sur place)`
      : `totalité en ligne (${euro(total())})`;
    const lines = [
      "Bonjour Sensual Luxembourg,",
      "je souhaite réserver :",
      `• Massage : ${s.name} (${state.duration} min)`,
      `• Date : ${fmtWhen()}`,
      `• Lieu : ${place.label}${state.address ? " (" + state.address + ")" : ""}`,
      `• Prix : ${euro(total())}`,
      `• Paiement : ${payTxt}`,
      `• Prénom : ${nameInput.value.trim()}`,
    ];
    if (phoneInput.value.trim()) lines.push(`• Téléphone : ${phoneInput.value.trim()}`);
    if (msgInput.value.trim()) lines.push(`• Message : ${msgInput.value.trim()}`);
    lines.push(`Référence : ${state.ref}`, "Merci de me confirmer le créneau.");
    return lines.join("\n");
  }

  const waUrl = (text) => (C.whatsapp ? `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}` : "");

  function confirmBooking() {
    state.ref = makeRef();
    state.message = buildMessage();
    const url = waUrl(state.message);
    if (url) window.open(url, "_blank", "noopener");

    qs("[data-bd-ref]", drawer).textContent = state.ref;
    qs("[data-bd-done-lead]", drawer).innerHTML = url
      ? "WhatsApp s'est ouvert avec votre demande : <strong>il ne reste qu'à appuyer sur Envoyer</strong>. Nous confirmons votre créneau en quelques minutes."
      : "<strong>Mode démo</strong> — voici le message que Sensual Luxembourg recevra sur WhatsApp dès que le numéro sera configuré.";
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    qs("[data-bd-preview]", drawer).innerHTML = esc(state.message).replace(/\n/g, "<br>") + `<span class="wa-preview__time">${time} ✓✓</span>`;

    const payBtn = qs("[data-bd-paynow]", drawer);
    payBtn.hidden = state.pay === "onsite";
    qs("[data-bd-paynow-label]", drawer).textContent = `Payer ${euro(dueNow())} maintenant`;
    const iban = qs("[data-bd-iban]", drawer);
    const P = C.payment || {};
    iban.hidden = !(P.iban && state.pay !== "onsite");
    if (!iban.hidden) {
      iban.innerHTML = `<small>Ou par virement instantané</small><strong>${esc(P.iban)}</strong>${P.beneficiary ? `<span>${esc(P.beneficiary)}</span>` : ""}<span>Montant : ${euro(dueNow())} · Communication : ${state.ref}</span>`;
    }
    goTo(4);
    const check = qs(".bd-done__check", drawer);
    check.classList.remove("is-anim");
    void check.offsetWidth;
    check.classList.add("is-anim");
  }

  qs("[data-bd-paynow]", drawer).addEventListener("click", () => {
    const P = C.payment || {};
    if (P.url) {
      window.open(P.url, "_blank", "noopener");
      toast(`Indiquez la référence <strong>${state.ref}</strong> et le montant de <strong>${euro(dueNow())}</strong> lors du paiement.`, 7000);
    } else {
      toast("<strong>Mode démo :</strong> le paiement sécurisé s'ouvrira ici dès que le compte de paiement du salon sera relié.", 6000);
    }
  });
  qs("[data-bd-wa-again]", drawer).addEventListener("click", () => {
    const url = waUrl(state.message);
    if (url) window.open(url, "_blank", "noopener");
    else toast("<strong>Mode démo :</strong> WhatsApp s'ouvrira avec ce message dès l'ajout du numéro du salon.");
  });
  qs("[data-bd-ics]", drawer).addEventListener("click", () => {
    const start = slotDate(state.day, state.slot);
    const end = new Date(start.getTime() + (state.duration + 15) * 60000);
    const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SL//Rendez-vous//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${state.ref}-${now.getTime()}@sl`, `DTSTAMP:${stamp}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
      "SUMMARY:Rendez-vous bien-être", `DESCRIPTION:Réf. ${state.ref} · ${state.duration} min`, "LOCATION:Luxembourg",
      "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Rendez-vous bien-être", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `rendez-vous-${state.ref}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  /* ---------- Ouverture / fermeture ---------- */
  let opener = null;
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;

  function open(serviceId, opts = {}) {
    opener = document.activeElement;
    if (SL.closeMenu && document.body.classList.contains("menu-open")) SL.closeMenu();
    if (state.step === 4) { // nouvelle réservation après une confirmation
      state.slot = null;
      adultInput.checked = false;
      msgInput.value = "";
      state.step = 1;
    }
    if (opts.place) state.place = opts.place;
    if (serviceId && byId[serviceId]) selectService(serviceId, true);
    renderPlaces();
    renderDurations();
    markService();
    updateSummary();
    goTo(1);

    drawer.hidden = false;
    document.body.classList.add("drawer-open");
    if (SL.lockScroll) SL.lockScroll(true);
    else document.body.style.overflow = "hidden";
    if (gsap) {
      gsap.fromTo(qs(".drawer__overlay", drawer), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(panel, isMobile() ? { yPercent: 100, xPercent: 0 } : { xPercent: 100, yPercent: 0 }, { xPercent: 0, yPercent: 0, duration: 0.9, ease: "expo.out" });
    }
    const sel = qs(".bd-service.is-on", servicesBox);
    if (sel) setTimeout(() => { scroller.scrollTop = Math.max(0, sel.offsetTop - 120); }, 50);
    setTimeout(() => qs(".drawer__close", drawer).focus({ preventScroll: true }), 60);
  }

  function close() {
    const done = () => {
      drawer.hidden = true;
      document.body.classList.remove("drawer-open");
      if (SL.lockScroll) SL.lockScroll(false);
      else document.body.style.overflow = "";
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    if (!gsap) return done();
    gsap.to(qs(".drawer__overlay", drawer), { opacity: 0, duration: 0.4 });
    gsap.to(panel, { ...(isMobile() ? { yPercent: 100 } : { xPercent: 100 }), duration: 0.55, ease: "power3.in", onComplete: done });
  }

  SL.openBooking = open;

  qsa("[data-drawer-close]", drawer).forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (drawer.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") { // focus piégé dans le tiroir
      const f = qsa("button:not([disabled]):not([hidden]), input, textarea, a[href]", panel).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Tous les boutons « Réserver » de la page + clic sur une carte de massage
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (btn && !drawer.contains(btn)) {
      e.preventDefault();
      const fromPricing = btn.closest(".price");
      open(btn.dataset.book || null, fromPricing && SL.pricePlace ? { place: SL.pricePlace } : {});
      return;
    }
    const card = e.target.closest(".service[data-service]");
    if (card && !e.target.closest("a, button")) open(card.dataset.service);
  });

  renderPlaces();
})();
