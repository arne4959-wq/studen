import { getStore, setStore } from "./store.js";

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function syncSwitches() {
  const dark = String(getTheme() === "dark");
  document.querySelectorAll("[data-theme-switch]").forEach((button) => button.setAttribute("aria-checked", dark));
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
  setStore("theme", getTheme());
  syncSwitches();
}

export function toggleTheme() {
  applyTheme(getTheme() === "light" ? "dark" : "light");
  return getTheme();
}

// The inline <head> snippet already set data-theme before first paint; this only re-syncs.
export function initTheme() {
  document.documentElement.dataset.theme = getStore("theme") === "light" ? "light" : "dark";
  syncSwitches();
  return getTheme();
}

export { syncSwitches };
