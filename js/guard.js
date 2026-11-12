import { getToken, clearSession } from "./store.js";

const HOME = "subjects.html";

function loginUrl() {
  const here = window.location.pathname.split("/").pop() + window.location.search + window.location.hash;
  return here ? `login.html?next=${encodeURIComponent(here)}` : "login.html";
}

export function requireAuth() {
  if (getToken()) return true;
  window.location.replace(loginUrl());
  return false;
}

export function redirectIfAuthed() {
  if (!getToken()) return false;
  window.location.replace(HOME);
  return true;
}

export function handleUnauthorized() {
  clearSession();
  window.location.replace(loginUrl());
}

// Only same-origin targets are allowed; anything else (//evil.com, javascript:, https://other) falls back home.
export function safeNext(raw, fallback = HOME) {
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.href);
    if (url.origin !== window.location.origin || /\/(login|register)\.html$/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
