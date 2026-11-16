/* =========================================================
   Sensual Luxembourg — Espace administrateur
   Gestion des praticiennes (profils + photos) dans Supabase.
   Aucune bibliothèque : appels directs à l'API (auth, base, stockage).
   Les droits sont vérifiés par la base elle-même (RLS) : cette page
   ne fait qu'afficher ; un compte non administrateur ne peut rien modifier.
   ========================================================= */
(function () {
  "use strict";

  const cfg = (window.SL_CONFIG || {}).supabase || {};
  const BASE = (cfg.url || "").replace(/\/+$/, "");
  const KEY = cfg.key || "";
  const BUCKET = "praticiennes";
  const STORE = "sl-admin-session";

  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const photoUrl = (path) => `${BASE}/storage/v1/object/public/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  /* ---------- Vues ---------- */
  function show(view) {
    qsa("[data-view]").forEach((el) => { el.hidden = el.dataset.view !== view; });
    qs("[data-top-actions]").hidden = view !== "app";
  }
  const toast = qs("[data-toast]");
  let toastTimer;
  function notify(text) {
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
  }
  function setError(el, text) { el.textContent = text || ""; el.hidden = !text; }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "Un instant…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  /* ---------- Session ---------- */
  let session = null;
  try { session = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { session = null; }
  function saveSession(s) {
    session = s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600) } : null;
    try { session ? localStorage.setItem(STORE, JSON.stringify(session)) : localStorage.removeItem(STORE); } catch (e) { /* stockage indisponible */ }
  }

  async function call(path, { method = "GET", body, headers = {}, auth = true, raw = false } = {}) {
    if (auth) await fresh();
    const h = { apikey: KEY, ...headers };
    if (auth && session) h.Authorization = "Bearer " + session.access_token;
    let payload = body;
    if (body !== undefined && !raw) { h["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await fetch(BASE + path, { method, headers: h, body: payload });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
      const msg = (data && (data.msg || data.message || data.error_description || data.error)) || res.statusText || "Erreur";
      throw Object.assign(new Error(msg), { status: res.status, data });
    }
    return data;
  }

  let refreshing = null;
  async function fresh() {
    if (!session) throw Object.assign(new Error("Session expirée"), { status: 401 });
    if (session.expires_at - Date.now() / 1000 > 60) return;
    refreshing = refreshing || call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token }, auth: false })
      .then(saveSession)
      .catch((e) => { saveSession(null); throw Object.assign(e, { status: 401 }); })
      .finally(() => { refreshing = null; });
    await refreshing;
  }

  function fail(e, errorEl) {
    if (e && e.status === 401) { saveSession(null); show("login"); notify("Session expirée, reconnectez-vous."); return; }
    const text = e && e.message ? e.message : "Une erreur est survenue.";
    if (errorEl) setError(errorEl, text); else notify(text);
  }

  /* ---------- Démarrage ---------- */
  async function start() {
    if (!BASE || !KEY) return show("noconfig");
    try {
      if (session) {
        try { return await enter(); } catch (e) { saveSession(null); }
      }
      const exists = await call("/rest/v1/rpc/admin_existe", { method: "POST", body: {}, auth: false });
      show(exists ? "login" : "setup");
    } catch (e) {
      show("login");
      notify("Base de données injoignable : " + e.message);
    }
  }

  async function enter() {
    const ok = await call("/rest/v1/rpc/est_admin", { method: "POST", body: {} });
    if (!ok) {
      saveSession(null);
      throw new Error("Ce compte n'est pas administrateur.");
    }
    show("app");
    await load();
  }

  /* ---------- Installation & connexion ---------- */
  async function signIn(email, password) {
    const s = await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password }, auth: false });
    saveSession(s);
  }

  qs("[data-setup-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = qs("[data-setup-error]");
    const btn = qs("button[type=submit]", e.target);
    const code = qs("#s-code").value.trim();
    const email = qs("#s-email").value.trim();
    const pass = qs("#s-pass").value;
    setError(err, "");
    if (!code || !email) return setError(err, "Renseignez le code d'installation et votre e-mail.");
    if (pass.length < 10) return setError(err, "Le mot de passe doit contenir au moins 10 caractères.");
    if (pass !== qs("#s-pass2").value) return setError(err, "Les deux mots de passe ne correspondent pas.");
    busy(btn, true);
    try {
      const status = await call("/rest/v1/rpc/creer_admin", { method: "POST", body: { p_code: code, p_email: email, p_password: pass }, auth: false });
      const messages = {
        code_invalide: "Code d'installation incorrect.",
        bloque: "Trop d'essais : la création du compte est bloquée. Contactez le développeur.",
        deja_configure: "Un compte administrateur existe déjà. Rechargez la page pour vous connecter.",
        email_invalide: "Adresse e-mail invalide ou déjà utilisée.",
        mot_de_passe_trop_court: "Le mot de passe doit contenir au moins 10 caractères.",
      };
      if (status !== "ok") return setError(err, messages[status] || "Création impossible.");
      await signIn(email, pass);
      await enter();
      notify("Compte administrateur créé.");
    } catch (ex) { fail(ex, err); } finally { busy(btn, false); }
  });

  qs("[data-login-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = qs("[data-login-error]");
    const btn = qs("button[type=submit]", e.target);
    setError(err, "");
    busy(btn, true);
    try {
      await signIn(qs("#l-email").value.trim(), qs("#l-pass").value);
      await enter();
      qs("#l-pass").value = "";
    } catch (ex) {
      setError(err, ex.status === 400 ? "E-mail ou mot de passe incorrect." : ex.message);
    } finally { busy(btn, false); }
  });

  qs("[data-logout]").addEventListener("click", async () => {
    try { await call("/auth/v1/logout", { method: "POST" }); } catch (e) { /* déjà déconnecté */ }
    saveSession(null);
    show("login");
  });

  /* ---------- Liste ---------- */
  let rows = [];
  const listEl = qs("[data-list]");

  async function load() {
    rows = await call("/rest/v1/praticiennes?select=*&order=ordre.asc,created_at.asc");
    render();
  }

  function render() {
    const published = rows.filter((r) => r.publie).length;
    qs("[data-count]").textContent = rows.length
      ? `${rows.length} profil${rows.length > 1 ? "s" : ""}, dont ${published} publié${published > 1 ? "s" : ""} sur le site`
      : "";
    qs("[data-empty]").hidden = rows.length > 0;
    listEl.innerHTML = rows.map((r, i) => `
      <li class="adm-row" data-id="${esc(r.id)}">
        <div class="adm-row__photo">${r.photo_path ? `<img src="${esc(photoUrl(r.photo_path))}" alt="">` : `<span>${esc(String(r.prenom).trim().charAt(0).toUpperCase())}</span>`}</div>
        <div class="adm-row__txt">
          <strong>${esc(r.prenom)}</strong>
          <small>${esc([r.specialites, r.langues].filter(Boolean).join(" · ") || r.accroche || "—")}</small>
          <span class="adm-badge ${r.publie ? "is-on" : ""}">${r.publie ? "Publié" : "Brouillon"}</span>
          ${r.photo_path ? "" : `<span class="adm-badge">Sans photo</span>`}
        </div>
        <div class="adm-row__actions">
          <button class="adm-icon" data-act="up" aria-label="Monter"${i === 0 ? " disabled" : ""}>↑</button>
          <button class="adm-icon" data-act="down" aria-label="Descendre"${i === rows.length - 1 ? " disabled" : ""}>↓</button>
          <button class="btn btn--ghost btn--sm" data-act="toggle">${r.publie ? "Dépublier" : "Publier"}</button>
          <button class="btn btn--ghost btn--sm" data-act="edit">Modifier</button>
          <button class="btn btn--ghost btn--sm adm-danger" data-act="delete">Supprimer</button>
        </div>
      </li>`).join("");
  }

  const patch = (id, values) => call(`/rest/v1/praticiennes?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: values, headers: { Prefer: "return=representation" } });
  const removePhoto = (path) => call(`/storage/v1/object/${BUCKET}`, { method: "DELETE", body: { prefixes: [path] } }).catch(() => { /* fichier déjà absent */ });

  listEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest("[data-id]").dataset.id;
    const index = rows.findIndex((r) => r.id === id);
    const row = rows[index];
    const act = btn.dataset.act;
    try {
      if (act === "edit") return openProfile(row);
      if (act === "toggle") {
        await patch(id, { publie: !row.publie });
        notify(row.publie ? `${row.prenom} n'apparaît plus sur le site.` : `${row.prenom} est maintenant visible sur le site.`);
      }
      if (act === "delete") {
        if (!window.confirm(`Supprimer définitivement le profil de ${row.prenom} et sa photo ?`)) return;
        await call(`/rest/v1/praticiennes?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        if (row.photo_path) await removePhoto(row.photo_path);
        notify("Profil supprimé.");
      }
      if (act === "up" || act === "down") {
        const target = index + (act === "up" ? -1 : 1);
        if (target < 0 || target >= rows.length) return;
        const order = rows.slice();
        order.splice(target, 0, order.splice(index, 1)[0]);
        await Promise.all(order.map((r, k) => (r.ordre === k ? null : patch(r.id, { ordre: k }))));
      }
      await load();
    } catch (ex) { fail(ex); }
  });

  /* ---------- Photo : redimensionnement + allègement dans le navigateur ---------- */
  async function prepareImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Format non pris en charge : choisissez une image JPG, PNG ou WebP.");
    let source;
    try {
      source = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      source = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image illisible."));
        img.src = URL.createObjectURL(file);
      });
    }
    const w = source.width || source.naturalWidth;
    const h = source.height || source.naturalHeight;
    const scale = Math.min(1, 1200 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
    const toBlob = (type, q) => new Promise((resolve) => canvas.toBlob(resolve, type, q));
    let blob = await toBlob("image/webp", 0.82);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85); // navigateurs sans encodage WebP
    if (!blob) throw new Error("Impossible de préparer l'image.");
    return blob;
  }

  /* ---------- Fiche praticienne ---------- */
  const modal = qs('[data-modal="profile"]');
  const form = qs("[data-profile-form]");
  const preview = qs("[data-photo-preview]");
  const fileInput = qs("[data-photo-input]");
  const removeBtn = qs("[data-photo-remove]");
  const profErr = qs("[data-profile-error]");
  let editing = null;       // ligne en cours de modification (ou null pour une création)
  let newPhoto = null;      // image préparée, pas encore envoyée
  let dropPhoto = false;    // retirer la photo existante à l'enregistrement
  let previewUrl = "";

  function setPreview(src) {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ""; }
    preview.innerHTML = src ? `<img src="${esc(src)}" alt="">` : "<span>Aucune photo</span>";
    removeBtn.hidden = !src;
  }

  function openProfile(row) {
    editing = row || null;
    newPhoto = null;
    dropPhoto = false;
    fileInput.value = "";
    setError(profErr, "");
    qs("[data-profile-title]").textContent = row ? `Modifier ${row.prenom}` : "Nouvelle praticienne";
    qs("#p-prenom").value = row ? row.prenom : "";
    qs("#p-accroche").value = row ? row.accroche : "";
    qs("#p-specialites").value = row ? row.specialites : "";
    qs("#p-langues").value = row ? row.langues : "";
    qs("#p-accord").checked = row ? row.accord_ecrit : false;
    qs("#p-publie").checked = row ? row.publie : false;
    setPreview(row && row.photo_path ? photoUrl(row.photo_path) : "");
    modal.hidden = false;
    qs("#p-prenom").focus();
  }
  qs("[data-new]").addEventListener("click", () => openProfile(null));

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    setError(profErr, "");
    try {
      newPhoto = await prepareImage(file);
      dropPhoto = false;
      const url = URL.createObjectURL(newPhoto);
      setPreview(url);
      previewUrl = url;
    } catch (ex) { newPhoto = null; fileInput.value = ""; setError(profErr, ex.message); }
  });
  removeBtn.addEventListener("click", () => {
    newPhoto = null;
    dropPhoto = true;
    fileInput.value = "";
    setPreview("");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = qs("[data-profile-save]");
    const prenom = qs("#p-prenom").value.trim();
    const accord = qs("#p-accord").checked;
    const keepsPhoto = !!newPhoto || (!!editing && !!editing.photo_path && !dropPhoto);
    setError(profErr, "");
    if (!prenom) return setError(profErr, "Le prénom est obligatoire.");
    if (keepsPhoto && !accord) return setError(profErr, "Pour enregistrer une photo, cochez la case confirmant l'accord écrit de la personne.");

    busy(btn, true, "Enregistrement…");
    const id = editing ? editing.id : (crypto.randomUUID ? crypto.randomUUID() : null);
    const oldPath = editing ? editing.photo_path : null;
    let uploaded = null;
    try {
      let photo_path = dropPhoto ? null : oldPath;
      if (newPhoto) {
        const ext = newPhoto.type === "image/webp" ? "webp" : "jpg";
        const folder = id || "profil";
        uploaded = `${folder}/${Date.now()}.${ext}`;
        await call(`/storage/v1/object/${BUCKET}/${uploaded}`, {
          method: "POST", body: newPhoto, raw: true,
          headers: { "Content-Type": newPhoto.type, "cache-control": "max-age=31536000", "x-upsert": "true" },
        });
        photo_path = uploaded;
      }
      const values = {
        prenom,
        accroche: qs("#p-accroche").value.trim(),
        specialites: qs("#p-specialites").value.trim(),
        langues: qs("#p-langues").value.trim(),
        accord_ecrit: accord,
        publie: qs("#p-publie").checked,
        photo_path,
      };
      if (editing) await patch(editing.id, values);
      else await call("/rest/v1/praticiennes", { method: "POST", body: { ...(id ? { id } : {}), ...values, ordre: rows.length }, headers: { Prefer: "return=representation" } });
      if (oldPath && oldPath !== photo_path) await removePhoto(oldPath);
      modal.hidden = true;
      notify(editing ? "Profil mis à jour." : "Profil ajouté.");
      await load();
    } catch (ex) {
      if (uploaded) await removePhoto(uploaded); // pas de photo orpheline si l'enregistrement échoue
      fail(ex, profErr);
    } finally { busy(btn, false); }
  });

  /* ---------- Mot de passe ---------- */
  const pwModal = qs('[data-modal="password"]');
  qs("[data-open-password]").addEventListener("click", () => {
    qs("[data-password-form]").reset();
    setError(qs("[data-password-error]"), "");
    pwModal.hidden = false;
    qs("#n-pass").focus();
  });
  qs("[data-password-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = qs("[data-password-error]");
    const pass = qs("#n-pass").value;
    setError(err, "");
    if (pass.length < 10) return setError(err, "Au moins 10 caractères.");
    if (pass !== qs("#n-pass2").value) return setError(err, "Les deux mots de passe ne correspondent pas.");
    try {
      await call("/auth/v1/user", { method: "PUT", body: { password: pass } });
      pwModal.hidden = true;
      notify("Mot de passe modifié.");
    } catch (ex) { fail(ex, err); }
  });

  /* ---------- Fenêtres ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-modal]")) qsa("[data-modal]").forEach((m) => { m.hidden = true; });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") qsa("[data-modal]").forEach((m) => { m.hidden = true; });
  });

  start();
})();
