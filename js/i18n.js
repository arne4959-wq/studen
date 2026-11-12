import { loadLocale } from "./api.js";
import { getStore, setStore } from "./store.js";

export const LANGS = ["lo", "th", "en"];
let messages = {};
let current = "lo";

export function getLang() {
  return current;
}

export function getSavedLang() {
  const saved = getStore("lang");
  return LANGS.includes(saved) ? saved : "lo";
}

export function t(key, vars) {
  const value = key.split(".").reduce((node, part) => node?.[part], messages);
  if (typeof value !== "string") return key;
  return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : value;
}

function readVars(node) {
  try {
    return node.dataset.i18nVars ? JSON.parse(node.dataset.i18nVars) : undefined;
  } catch {
    return undefined;
  }
}

// data-i18n=KEY sets textContent; data-i18n-attr=ATTR:KEY,ATTR:KEY sets attributes;
// data-i18n-vars='{"n":3}' fills {n} placeholders in both.
export function translateNode(node) {
  const vars = readVars(node);
  if (node.dataset.i18n) node.textContent = t(node.dataset.i18n, vars);
  for (const pair of node.dataset.i18nAttr?.split(",") ?? []) {
    const [attr, key] = pair.split(":").map((part) => part.trim());
    if (attr && key) node.setAttribute(attr, t(key, vars));
  }
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n], [data-i18n-attr]").forEach(translateNode);
}

export async function setLang(lang) {
  const next = LANGS.includes(lang) ? lang : "lo";
  messages = await loadLocale(next);
  current = next;
  document.documentElement.lang = next;
  setStore("lang", next);
  applyI18n();
  document.documentElement.dataset.langReady = next;
  document.dispatchEvent(new CustomEvent("langchange", { detail: next }));
}

export async function initI18n() {
  try {
    await setLang(getSavedLang());
  } catch (error) {
    console.error("Unable to load translations.", error);
    document.documentElement.dataset.langReady = "failed";
  }
}
