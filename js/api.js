// The only module that touches the network. Pages call the exported functions below.
import { USE_MOCK, SUPABASE_URL, SUPABASE_KEY, MOCK_DELAY_MS, MOCK_SLOW_DELAY_MS } from "./config.js";
import { getToken, getUser, getStore, setStore, getJSON, setJSON } from "./store.js";
import { handleUnauthorized } from "./guard.js";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const ROOT = new URL("../", import.meta.url);

// Static files of this site (translations, mock data, sources for tests). Never affected by ?mock=.
export async function loadFile(path, as = "json") {
  const response = await fetch(new URL(path, ROOT));
  if (!response.ok) throw new ApiError(response.status, "not_found", `Cannot load ${path}`);
  return as === "text" ? response.text() : response.json();
}

export const loadLocale = (lang) => loadFile(`i18n/${lang}.json`);

async function request(method, path, body) {
  try {
    return USE_MOCK ? await mockRequest(method, path, body) : await realRequest(method, path, body);
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(0, "network_error", error?.message);
    if (apiError.status === 401 && path !== "/api/auth/login") handleUnauthorized();
    throw apiError;
  }
}

/* ---------------- endpoints ---------------- */

const id = encodeURIComponent;
export const login = (body) => request("POST", "/api/auth/login", body);
export const register = (body) => request("POST", "/api/auth/register", body);
export const forgot = (body) => request("POST", "/api/auth/forgot", body);
export const changePassword = (body) => request("POST", "/api/auth/change-password", body);
export const logout = () => request("POST", "/api/auth/logout", {});
export const getMe = () => request("GET", "/api/me");
export const getSubjects = () => request("GET", "/api/subjects");
export const getLessons = (subjectId) => request("GET", `/api/subjects/${id(subjectId)}/lessons`);
export const getSummary = (lessonId) => request("GET", `/api/lessons/${id(lessonId)}/summary`);
export const getQuiz = (lessonId) => request("GET", `/api/lessons/${id(lessonId)}/quiz`);
export const submitQuiz = (body) => request("POST", "/api/quiz/submit", body);
export const getDashboard = () => request("GET", "/api/dashboard");

// The lesson after this one in its subject, or null. shortcut: looks the lesson up by listing every subject (1 + one request per subject); swap for a backend field if subjects grow.
export async function getNextLesson(lessonId) {
  for (const lessons of await Promise.all((await getSubjects()).map((subject) => getLessons(subject.id)))) {
    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    const at = sorted.findIndex((lesson) => lesson.id === lessonId);
    if (at >= 0) return sorted[at + 1] ?? null;
  }
  return null;
}

/* ---------------- mock server ---------------- */

const PUBLIC = new Set(["/api/auth/login", "/api/auth/register", "/api/auth/forgot"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILES = ["subjects", "lessons", "summaries", "quizzes", "dashboard"]; // static site content, used by both backends
const MOCK_ONLY = ["answers", "me"]; // the mock server's own: the real answer key lives in the database, never on the site
let mockData;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (n) => String(n).padStart(2, "0");
const localDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const isoDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (status, code, message) => new ApiError(status, code, message);

export function mockMode() {
  return new URLSearchParams(window.location.search).get("mock");
}

async function loadMockData() {
  const names = USE_MOCK ? [...FILES, ...MOCK_ONLY] : FILES;
  mockData ??= Promise.all(names.map((name) => loadFile(`data/${name}.json`))).then((files) =>
    Object.fromEntries(names.map((name, index) => [name, files[index]])),
  );
  return mockData;
}

// "Server" state that survives reloads in mock mode (the real backend keeps this in its DB).
// "mockdb2": the lessons were merged, so progress saved under the old key ("mockdb") no longer matches and is left behind.
const loadDb = () => ({ progress: {}, attempts: [], activity: {}, user: null, ...getJSON("mockdb2", {}) });
const saveDb = (db) => setJSON("mockdb2", db);

async function mockRequest(method, path, body = {}) {
  const mode = mockMode();
  await sleep(mode === "slow" ? MOCK_SLOW_DELAY_MS : MOCK_DELAY_MS);
  if (mode === "error") throw fail(500, "server_error", "Mock server error (?mock=error)");
  if (!PUBLIC.has(path) && !getToken()?.startsWith("mock-")) throw fail(401, "unauthorized", "Missing or invalid token");
  const data = await loadMockData();
  return clone(route(method, path, body, data, loadDb(), mode === "empty"));
}

function lessonsOf(subjectId, data, db) {
  return (data.lessons[subjectId] ?? []).map((lesson) => ({ ...lesson, ...db.progress[lesson.id] }));
}

function subjectsOf(data, db) {
  return data.subjects.map((subject) => {
    const lessons = lessonsOf(subject.id, data, db);
    return lessons.length ? { ...subject, doneCount: lessons.filter((l) => l.status === "done").length } : subject;
  });
}

function findLesson(lessonId, data) {
  return Object.values(data.lessons).flat().find((lesson) => lesson.id === lessonId);
}

function startSession(user, db) {
  db.user = user;
  saveDb(db);
  return { token: `mock-${Math.random().toString(36).slice(2)}`, user };
}

function route(method, path, body, data, db, empty) {
  const key = `${method} ${path}`;
  let match;

  if (key === "POST /api/auth/login") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (email === data.me.email && String(body.password ?? "").length >= 8) return startSession(data.me, db);
    throw fail(401, "invalid_credentials", "Email or password is incorrect");
  }
  if (key === "POST /api/auth/register") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim();
    if (email === "taken@example.com") throw fail(409, "email_taken", "Email is already registered");
    if (!username || !EMAIL_RE.test(email) || String(body.password ?? "").length < 8) {
      throw fail(400, "validation_error", "Invalid registration data");
    }
    return startSession({ id: 2, username, email }, db);
  }
  if (key === "POST /api/auth/forgot") return { ok: true };
  if (key === "POST /api/auth/change-password") {
    // shortcut: the mock stores no passwords; any current password shorter than 8 chars counts as wrong.
    if (String(body.current ?? "").length < 8) throw fail(400, "wrong_password", "Current password is incorrect");
    if (String(body.next ?? "").length < 8) throw fail(400, "validation_error", "New password is too short");
    return { ok: true };
  }
  if (key === "POST /api/auth/logout") return { ok: true };
  if (key === "GET /api/me") return db.user ?? data.me;
  if (key === "GET /api/subjects") return empty ? [] : subjectsOf(data, db);

  if (method === "GET" && (match = path.match(/^\/api\/subjects\/([\w-]+)\/lessons$/))) {
    if (!(match[1] in data.lessons)) throw fail(404, "not_found", "Subject not found");
    return empty ? [] : lessonsOf(match[1], data, db);
  }
  if (method === "GET" && (match = path.match(/^\/api\/lessons\/([\w-]+)\/summary$/))) {
    const lesson = findLesson(match[1], data);
    const summary = lesson && { ...data.summaries[lesson.id], order: lesson.order }; // number comes from the lesson list, not a stored copy
    if (!summary?.id) throw fail(404, "not_found", "Lesson not found");
    return empty ? { id: summary.id, title: summary.title, readMinutes: 0, intro: "", keyPoints: [], table: [] } : summary;
  }
  if (method === "GET" && (match = path.match(/^\/api\/lessons\/([\w-]+)\/quiz$/))) {
    if (!findLesson(match[1], data)) throw fail(404, "not_found", "Lesson not found");
    return { lessonId: match[1], questions: empty ? [] : data.quizzes[match[1]]?.questions ?? [] };
  }
  if (key === "POST /api/quiz/submit") return submit(body, data, db);
  if (key === "GET /api/dashboard") return dashboard(data, db, empty);

  throw fail(404, "not_found", `No mock route for ${key}`);
}

function submit(body, data, db) {
  const questions = data.quizzes[body.lessonId]?.questions;
  const key = data.answers[body.lessonId];
  if (!questions?.length || !key || !Array.isArray(body.answers)) throw fail(400, "validation_error", "Invalid submission");
  const given = new Map(body.answers.map((answer) => [answer?.questionId, answer?.choiceId]));
  const results = questions.map((question) => {
    const yourChoiceId = given.get(question.id) ?? null;
    const { correctChoiceId, explanation } = key[question.id];
    return { questionId: question.id, correct: yourChoiceId === correctChoiceId, yourChoiceId, correctChoiceId, explanation };
  });
  const score = results.filter((result) => result.correct).length;
  const total = results.length;
  const today = isoDaysAgo(0);
  db.progress[body.lessonId] = { status: "done", score, total };
  db.attempts.push({ lessonId: body.lessonId, score, total, date: today });
  db.activity[today] = (db.activity[today] ?? 0) + 1;
  saveDb(db);
  return { score, total, percent: Math.round((score / total) * 100), results };
}

function dashboard(data, db, empty) {
  const subjects = subjectsOf(data, db);
  const lessonsTotal = subjects.reduce((sum, s) => sum + s.lessonCount, 0);
  if (empty) return { lessonsDone: 0, lessonsTotal, avgScore: 0, quizzesTaken: 0, activity: [], recent: [] };

  const seeded = data.dashboard.attempts.map(({ daysAgo, ...attempt }) => ({ ...attempt, date: isoDaysAgo(daysAgo) }));
  // newest first; same-day ties keep the most recent submission on top
  const attempts = [...db.attempts].reverse().concat(seeded).sort((a, b) => b.date.localeCompare(a.date));
  const seedActivity = new Map(data.dashboard.activity.map((a) => [isoDaysAgo(a.daysAgo), a.count]));
  const activity = [];
  for (let days = 27; days >= 0; days -= 1) {
    const date = isoDaysAgo(days);
    const count = (seedActivity.get(date) ?? 0) + (db.activity[date] ?? 0);
    if (count) activity.push({ date, count });
  }
  const percents = attempts.map((a) => (a.score / a.total) * 100);
  return {
    lessonsDone: subjects.reduce((sum, s) => sum + s.doneCount, 0),
    lessonsTotal,
    avgScore: percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0,
    quizzesTaken: attempts.length,
    activity,
    recent: attempts.slice(0, 10).map((a) => ({
      lessonId: a.lessonId,
      lessonTitle: findLesson(a.lessonId, data)?.title ?? a.lessonId,
      score: a.score,
      total: a.total,
      date: a.date,
    })),
  };
}

/* ---------------- real backend (Supabase) ---------------- */
// Accounts: Supabase Auth over REST. Content: the same static data/*.json as the mock. Progress and the
// answer key: Postgres, reached through two functions (submit_quiz, my_state) defined in supabase/schema.sql.

// Turns a Supabase error body into the ApiError codes the pages already know.
function backendError(status, data) {
  const code = String(data?.error_code ?? data?.code ?? "");
  const message = data?.msg ?? data?.message ?? data?.error_description ?? "";
  if (code === "invalid_credentials") return new ApiError(401, "invalid_credentials", message);
  if (code === "user_already_exists" || code === "email_exists") return new ApiError(409, "email_taken", message);
  if (["weak_password", "validation_failed", "22023", "email_address_invalid"].includes(code)) return new ApiError(400, "validation_error", message);
  if (status === 401 || ["28000", "PGRST301", "PGRST303"].includes(code)) return new ApiError(401, "unauthorized", message);
  return new ApiError(status, status >= 500 ? "server_error" : "unknown", message);
}

async function backendCall(path, { method = "POST", body, auth = true } = {}, retried = false) {
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(SUPABASE_URL + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (error) {
    throw new ApiError(0, "network_error", error?.message);
  }
  const data = await response.json().catch(() => null);
  if (response.ok) return data;
  // the access token lives about an hour: renew it once, then repeat the call
  if (auth && !retried && response.status === 401 && (await refreshSession())) return backendCall(path, { method, body, auth }, true);
  throw backendError(response.status, data);
}

async function refreshSession() {
  const refresh = getStore("refresh");
  if (!refresh) return false;
  try {
    const data = await backendCall("/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: refresh }, auth: false }, true);
    setStore("token", data.access_token);
    setStore("refresh", data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function startBackendSession(data) {
  setStore("refresh", data.refresh_token);
  remote = null;
  const { id, email, user_metadata } = data.user;
  return { token: data.access_token, user: { id, email, username: user_metadata?.username ?? email.split("@")[0] } };
}

const passwordGrant = (email, password) =>
  backendCall("/auth/v1/token?grant_type=password", { body: { email: String(email).trim(), password }, auth: false });

const backendAuth = {
  "POST /api/auth/login": async (body) => startBackendSession(await passwordGrant(body.email, body.password)),
  "POST /api/auth/register": async (body) => {
    const data = await backendCall("/auth/v1/signup", {
      body: { email: String(body.email).trim(), password: body.password, data: { username: String(body.username ?? "").trim() } },
      auth: false,
    });
    // with "Confirm email" switched on in Supabase the account exists but there is no session yet
    if (!data?.access_token) throw new ApiError(202, "confirm_email", "Confirm the email first");
    return startBackendSession(data);
  },
  // shortcut: the reset email goes out, but the site has no "choose a new password" page for its link yet; add one before relying on this.
  "POST /api/auth/forgot": async (body) => {
    await backendCall("/auth/v1/recover", { body: { email: String(body.email).trim() }, auth: false });
    return { ok: true };
  },
  "POST /api/auth/change-password": async (body) => {
    if (String(body.next ?? "").length < 8) throw new ApiError(400, "validation_error", "New password is too short");
    try {
      await passwordGrant(getUser()?.email ?? "", body.current ?? ""); // proves the person knows the current password
    } catch (error) {
      throw error.code === "invalid_credentials" ? new ApiError(400, "wrong_password", "Current password is incorrect") : error;
    }
    await backendCall("/auth/v1/user", { method: "PUT", body: { password: body.next } });
    return { ok: true };
  },
  "POST /api/auth/logout": async () => {
    await backendCall("/auth/v1/logout", { body: {} }).catch(() => {}); // signing out here must never fail
    remote = null;
    return { ok: true };
  },
};

// The person's progress and attempts, fetched once per few seconds and shaped like the mock's "db",
// so the lesson / subject / dashboard answers are produced by the very same route() code.
let remote;
function remoteDb() {
  if (!remote || Date.now() - remote.at > 3000) {
    const promise = backendCall("/rest/v1/rpc/my_state", { body: {} }).then(toDb);
    remote = { at: Date.now(), promise };
    promise.catch(() => (remote = null));
  }
  return remote.promise;
}

function toDb(state) {
  const progress = Object.fromEntries(state.progress.map((p) => [p.lessonId, { status: "done", score: p.score, total: p.total }]));
  const activity = {};
  const attempts = state.attempts.map((a) => {
    const date = localDate(new Date(a.at));
    activity[date] = (activity[date] ?? 0) + 1;
    return { lessonId: a.lessonId, score: a.score, total: a.total, date };
  });
  return { progress, attempts, activity, user: getUser() };
}

async function realRequest(method, path, body = {}) {
  const key = `${method} ${path}`;
  if (backendAuth[key]) return backendAuth[key](body);
  if (!getToken()) throw new ApiError(401, "unauthorized", "Missing token");
  if (key === "POST /api/quiz/submit") {
    const result = await backendCall("/rest/v1/rpc/submit_quiz", { body: { p_lesson_id: body.lessonId, p_answers: body.answers } });
    remote = null; // the next page must see this score
    return result;
  }
  const [data, db] = await Promise.all([loadMockData(), remoteDb()]);
  return clone(route(method, path, body, data, db, false));
}
