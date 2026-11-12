import { requireAuth, redirectIfAuthed } from "./guard.js";
import { initTheme } from "./theme.js";
import { initI18n } from "./i18n.js";
import { el, themeSwitch, ensureToastRegion } from "./ui.js";

const NAV = [
  ["subjects", "{ }"],
  ["stats", "▁▃▅"],
  ["profile", "~/"],
];

// One <nav>: bottom tab bar on mobile, left "explorer" sidebar from 768px (see layout.css).
function mountShell(active) {
  document.body.classList.add("app");
  const topbar = el("header", { class: "topbar" },
    el("a", { class: "brand", href: "subjects.html" },
      el("span", { class: "brand__prompt", "aria-hidden": "true", text: "❯" }),
      el("span", { i18n: "app.name" })),
    el("span", { class: "topbar__spacer" }),
    themeSwitch());
  const nav = el("nav", { class: "nav", i18nAttr: { "aria-label": "a11y.mainNav" } },
    el("p", { class: "nav__title", "aria-hidden": "true", i18n: "nav.explorer" }),
    el("ul", { class: "nav__list", role: "list" }, NAV.map(([id, icon]) =>
      el("li", {}, el("a", { class: "nav__link", href: `${id}.html`, "aria-current": id === active ? "page" : null },
        el("span", { class: "nav__icon", "aria-hidden": "true", text: icon }),
        el("span", { class: "nav__label" },
          el("span", { i18n: `nav.${id}` }),
          el("span", { class: "nav__slash", "aria-hidden": "true", text: "/" })))))));
  document.body.prepend(el("a", { class: "skip-link", href: "#main", i18n: "a11y.skip" }), topbar);
  document.querySelector("main").after(nav);
}

/**
 * Every page starts with: `if (await initPage({...})) { ...render }`
 * auth: needs a token · guest: auth page (signed-in users go to subjects) · shell: false = no topbar/nav
 */
export async function initPage({ nav = "", auth = true, guest = false, shell = true } = {}) {
  if (auth && !requireAuth()) return false;
  if (guest && redirectIfAuthed()) return false;
  if (shell) mountShell(nav);
  initTheme();
  ensureToastRegion();
  await initI18n();
  return true;
}
