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
      list.innerHTML = rows.map((p) => {
        const meta = [p.specialites, p.langues].filter(Boolean).join(" · ");
        const visual = p.photo_path
          ? `<img src="${esc(photoUrl(p.photo_path))}" alt="${esc(p.prenom)}" loading="lazy" decoding="async">`
          : `<span class="member__mono" aria-hidden="true">${esc(String(p.prenom).trim().charAt(0).toUpperCase())}</span>`;
        return `
          <article class="member">
            <div class="member__photo">${visual}</div>
            <h3>${esc(p.prenom)}</h3>
            <button class="btn btn--primary btn--block" data-book data-with="${esc(p.prenom)}">Réserver</button>
            ${p.accroche ? `<p class="member__tag">${esc(p.accroche)}</p>` : ""}
            ${meta ? `<p class="member__meta">${esc(meta)}</p>` : ""}
          </article>`;
      }).join("");
      section.hidden = false;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    })
    .catch(() => { /* base injoignable : la section reste simplement masquée */ });
})();
