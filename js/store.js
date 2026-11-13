const PREFIX = "hianngai:";

function area(session) {
  return session ? window.sessionStorage : window.localStorage;
}

export function getStore(key, fallback = null, session = false) {
  try {
    const value = area(session).getItem(PREFIX + key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function setStore(key, value, session = false) {
  try {
    area(session).setItem(PREFIX + key, String(value));
    return true;
  } catch (error) {
    console.warn(`Unable to save "${key}".`, error);
    return false;
  }
}

export function removeStore(key, session = false) {
  try {
    area(session).removeItem(PREFIX + key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}

export function getJSON(key, fallback = null, session = false) {
  try {
    const value = getStore(key, null, session);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value, session = false) {
  return setStore(key, JSON.stringify(value), session);
}

/* ---- session ---- */

export function getToken() {
  return getStore("token");
}

export function getUser() {
  return getJSON("user");
}

export function setSession({ token, user }) {
  setStore("token", token);
  setJSON("user", user);
}

// Removes everything tied to the signed-in person; keeps theme, language and the mock "server" DB.
export function clearSession() {
  removeStore("token");
  removeStore("refresh");
  removeStore("user");
  for (const session of [false, true]) {
    try {
      const storage = area(session);
      Object.keys(storage)
        .filter((key) => key.startsWith(`${PREFIX}result:`) || key.startsWith(`${PREFIX}quiz:`))
        .forEach((key) => storage.removeItem(key));
    } catch {
      /* storage unavailable */
    }
  }
}

/* ---- local cache for the latest result; the API restores history when this cache is missing ---- */

export function saveResult(lessonId, quiz, result) {
  setJSON(`result:${lessonId}`, { quiz, result, savedAt: new Date().toISOString() });
}

export function loadResult(lessonId) {
  const saved = getJSON(`result:${lessonId}`);
  return saved?.quiz?.questions && saved?.result?.results ? saved : null;
}
