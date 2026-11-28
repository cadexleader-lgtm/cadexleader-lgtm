/* =========================================================
   Sensual Luxembourg — Thème clair / sombre
   Clair par défaut ; le choix du visiteur est mémorisé.
   ========================================================= */
(function () {
  "use strict";
  const root = document.documentElement;
  const KEY = "sl-theme";
  const meta = document.querySelector('meta[name="theme-color"]');

  const current = () => (root.dataset.theme === "dark" ? "dark" : "light");
  function sync() {
    const dark = current() === "dark";
    if (meta) meta.content = dark ? "#061423" : "#ffffff";
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", String(dark));
      b.setAttribute("aria-label", dark ? "Passer en mode clair" : "Passer en mode sombre");
      b.title = dark ? "Mode clair" : "Mode sombre";
    });
  }
  function set(theme) {
    root.classList.add("theme-anim");
    root.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch (e) { /* navigation privée */ }
    sync();
    window.dispatchEvent(new CustomEvent("sl-theme", { detail: theme }));
    clearTimeout(set.t);
    set.t = setTimeout(() => root.classList.remove("theme-anim"), 600);
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (btn) set(current() === "dark" ? "light" : "dark");
  });
  sync();
})();
