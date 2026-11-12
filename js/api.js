// The only module that touches the network. Pages call the exported functions below.
import { USE_MOCK, API_BASE, MOCK_DELAY_MS, MOCK_SLOW_DELAY_MS } from "./config.js";
import { getToken, getJSON, setJSON } from "./store.js";
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
    return USE_MOCK ? await mockRequest(method, path, body) : await httpRequest(method, path, body);
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(0, "network_error", error?.message);
    if (apiError.status === 401 && path !== "/api/auth/login") handleUnauthorized();
    throw apiError;
  }
}

async function httpRequest(method, path, body) {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(API_BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error ?? "unknown", data?.message ?? response.statusText);
  return data;
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
const FILES = ["subjects", "lessons", "summaries", "quizzes", "answers", "dashboard", "me"];
let mockData;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (n) => String(n).padStart(2, "0");
const isoDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (status, code, message) => new ApiError(status, code, message);

export function mockMode() {
  return new URLSearchParams(window.location.search).get("mock");
}

async function loadMockData() {
  mockData ??= Promise.all(FILES.map((name) => loadFile(`data/${name}.json`))).then((files) =>
    Object.fromEntries(FILES.map((name, index) => [name, files[index]])),
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
