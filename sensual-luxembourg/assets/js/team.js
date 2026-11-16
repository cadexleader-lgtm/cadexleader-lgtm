/* =========================================================
   Sensual Luxembourg — Contenus gérés depuis /admin (Supabase)
   1. « Nos praticiennes » : profils publiés ; section masquée s'il n'y en a aucun.
   2. « Ambiance » : photos de l'établissement ; s'il n'y en a aucune,
      les photos d'illustration par défaut restent affichées.
   ========================================================= */
(function () {
  "use strict";

  const cfg = (window.SL_CONFIG || {}).supabase || {};
  const section = document.querySelector("[data-team]");
  const list = document.querySelector("[data-team-list]");
  if (!cfg.url || !cfg.key) return;

  const base = cfg.url.replace(/\/+$/, "");
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fileUrl = (bucket, path) => `${base}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const photoUrl = (path) => fileUrl("praticiennes", path);

  // ---------- Ambiance ----------
  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    fetch(`${base}/rest/v1/ambiance_photos?select=photo_path,legende&publie=is.true&order=ordre.asc,created_at.asc`, { headers: { apikey: cfg.key } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!Array.isArray(rows) || !rows.length) return;
        gallery.innerHTML = rows.map((p) => `
          <button class="gallery__item" aria-label="Agrandir la photo"><img src="${esc(fileUrl("ambiance", p.photo_path))}" alt="${esc(p.legende || "Photo de l'établissement")}" loading="lazy" decoding="async"></button>`).join("");
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      })
      .catch(() => { /* on garde les photos par défaut */ });
  }

  // ---------- Praticiennes ----------
  if (!section || !list) return;
  fetch(`${base}/rest/v1/praticiennes?select=id,prenom,accroche,specialites,langues,photo_path&publie=is.true&order=ordre.asc,created_at.asc`, {
    headers: { apikey: cfg.key },
  })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows) => {
      if (!Array.isArray(rows) || !rows.length) return;
      const chips = (...texts) => texts.join("·").split(/[·,;/|]+/).map((t) => t.trim()).filter(Boolean).slice(0, 6);
      list.classList.toggle("team--single", rows.length === 1);
      list.innerHTML = rows.map((p) => {
        const tags = chips(p.specialites || "", p.langues || "");
        const visual = p.photo_path
          ? `<img src="${esc(photoUrl(p.photo_path))}" alt="${esc(p.prenom)}" loading="lazy" decoding="async">`
          : `<span class="member__mono" aria-hidden="true">${esc(String(p.prenom).trim().charAt(0).toUpperCase())}</span>`;
        return `
          <article class="member">
            <div class="member__photo">
              ${visual}
              <div class="member__info">
                <h3>${esc(p.prenom)}</h3>
                ${p.accroche ? `<p>${esc(p.accroche)}</p>` : ""}
              </div>
            </div>
            <div class="member__body">
              ${tags.length ? `<ul class="member__chips">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
              <button class="btn btn--primary btn--block" data-book data-with="${esc(p.prenom)}">Réserver</button>
            </div>
          </article>`;
      }).join("");

      // Téléphone : petits points sous le carrousel, comme dans une application
      const dots = document.querySelector("[data-team-dots]");
      if (dots && rows.length > 1) {
        dots.innerHTML = rows.map((_, k) => `<i${k === 0 ? ' class="is-on"' : ""}></i>`).join("");
        const cards = [...list.children];
        let ticking = false;
        list.addEventListener("scroll", () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const mid = list.scrollLeft + list.clientWidth / 2;
            let best = 0, bestDist = Infinity;
            cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bestDist) { bestDist = d; best = k; } });
            [...dots.children].forEach((d, k) => d.classList.toggle("is-on", k === best));
          });
        }, { passive: true });
      }
      section.hidden = false;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    })
    .catch(() => { /* base injoignable : la section reste simplement masquée */ });
})();
