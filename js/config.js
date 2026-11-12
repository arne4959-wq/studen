// The save system lives in Supabase. Both values are filled in once the project exists (README: "ระบบ save").
// Empty = no backend yet: the site answers every request from data/*.json inside js/api.js (mock mode).
export const SUPABASE_URL = ""; // e.g. "https://abcdefgh.supabase.co"
// The publishable (anon) key is meant to be public: Row Level Security in supabase/schema.sql protects the data, not the key.
export const SUPABASE_KEY = "";

// On localhost (development and tests) the mock stays on so nothing touches real accounts.
// To try the real backend from localhost: localStorage.setItem("hianngai:real", "1") in the console, then reload.
const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const wantsReal = (() => {
  try {
    return window.localStorage.getItem("hianngai:real") === "1";
  } catch {
    return false;
  }
})();
export const USE_MOCK = !SUPABASE_URL || (local && !wantsReal);

export const MOCK_DELAY_MS = 400;
export const MOCK_SLOW_DELAY_MS = 3000;
