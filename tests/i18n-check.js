import { loadLocale, loadFile, login, getQuiz, submitQuiz } from "../js/api.js";
import { setSession, saveResult, removeStore, setStore } from "../js/store.js";
import { test, assert, run, frame, snapshotStorage } from "./harness.js";
import { PAGES, withMode } from "./pages.js";

const LANGS = ["lo", "th", "en"];
const SOURCES = [
  ...["index", "login", "register", "forgot", "subjects", "summary", "quiz", "score", "review", "stats", "profile", "language", "change-password", "404", "styleguide"].map((p) => `${p}.html`),
  ...["config", "api", "store", "i18n", "theme", "ui", "shell", "guard"].map((f) => `js/${f}.js`),
  ...["index", "login", "register", "forgot", "subjects", "summary", "quiz", "score", "review", "stats", "profile", "language", "change-password", "not-found", "styleguide"].map((f) => `js/pages/${f}.js`),
];
// keys built at runtime from data: `status.${s}`, `nav.${id}`, `errors.${code}`, `stats.days.${d}`, `lang.${l}`
const DYNAMIC = [
  ...["done", "running", "todo"].map((s) => `status.${s}`),
  ...["subjects", "stats", "profile"].map((s) => `nav.${s}`),
  ...["invalid_credentials", "email_taken", "wrong_password", "server_error", "network_error", "not_found", "unauthorized", "validation_error", "confirm_email", "unknown"].map((c) => `errors.${c}`),
  ...["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => `stats.days.${d}`),
  ...LANGS.map((l) => `lang.${l}`),
];
const KEY_SHAPE = /^[a-z][A-Za-z]*(\.[A-Za-z0-9_]+)+$/;

const flatten = (node, prefix = "", out = {}) => {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const collectStrings = (node, out = new Set()) => {
  if (typeof node === "string") out.add(node.trim());
  else if (node && typeof node === "object") Object.values(node).forEach((v) => collectStrings(v, out));
  return out;
};
// Placeholder values must be numbers/symbols or mock data; these hold system values (URL path, error code, typed email, lesson id).
const FREE_VARS = new Set(["path", "code", "email", "lesson"]);
const toMatcher = (template) => {
  const names = [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const literal = template.trim().split(/\{\w+\}/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`^${literal.join("([\\s\\S]+?)")}$`);
  return (text) => {
    const match = re.exec(text);
    return !!match && match.slice(1).every((value, i) => FREE_VARS.has(names[i]) || !/\p{L}/u.test(value) || DATA.has(value.trim()));
  };
};

const locales = Object.fromEntries(await Promise.all(LANGS.map(async (l) => [l, flatten(await loadLocale(l))])));
const dataFiles = await Promise.all(["subjects", "lessons", "summaries", "quizzes", "answers", "dashboard", "me"].map((f) => loadFile(`data/${f}.json`)));
const DATA = collectStrings(dataFiles);

for (const lang of ["th", "en"]) {
  test(`${lang}.json has exactly the keys of lo.json`, () => {
    const lo = Object.keys(locales.lo);
    const other = Object.keys(locales[lang]);
    const missing = lo.filter((k) => !(k in locales[lang]));
    const extra = other.filter((k) => !(k in locales.lo));
    assert(!missing.length && !extra.length, `missing: ${missing.join(", ") || "-"} | extra: ${extra.join(", ") || "-"}`);
  });
  test(`${lang}.json placeholders match lo.json`, () => {
    const bad = Object.keys(locales.lo).filter((k) => placeholders(locales.lo[k]) !== placeholders(locales[lang][k]));
    assert(!bad.length, bad.join(", "));
  });
}
test("self-check: the scanner rejects planted text and accepts real output", () => {
  const lo = Object.values(locales.lo).map(toMatcher);
  const ok = (text) => lo.some((matches) => matches(text));
  assert(!ok("ໜ້ານີ້ບໍ່ມີ hardcoded") && !ok("Hello world") && !ok("Loading data"), "planted text accepted");
  assert(ok("ບົດຮຽນ · ພາສາອັງກິດ") && ok("3/8 ບົດ") && ok("1. Yesterday I ___ to school.") && ok("500 server_error"), "real output rejected");
});
// Keys allowed to hold Latin words in lo.json: programmer-style tokens from design-ref ($ login, PASS/FAIL, ...),
// the loanword "Quiz" the design uses inside Lao sentences, the book title, example email, language/font names, styleguide labels.
const LO_LATIN_OK = new Set(`title.quiz nav.explorer common.retry common.toSubjects state.errorTitle state.errorCode auth.term.start
auth.login.submit auth.login.mockHint auth.register.submit auth.forgot.submit auth.forgot.resend summary.bookRef summary.keyPoints
summary.runQuiz summary.ready quiz.exit quiz.prev quiz.next quiz.submit quiz.shortcutHint quiz.retryHint quiz.exitTitle quiz.empty
welcome.title welcome.lead score.command score.pass score.fail score.expected score.received score.passed score.failed score.totalCount score.toReview
score.toStats score.empty review.eyebrow review.retry review.empty stats.eyebrow stats.quizzes profile.eyebrow profile.logout
lang.en language.eyebrow password.submit notFound.command notFound.line notFound.home styleguide.eyebrow styleguide.colors
styleguide.bodyFont styleguide.bodySample styleguide.thaiFont styleguide.monoFont styleguide.monoSample styleguide.states
styleguide.loading styleguide.error styleguide.empty styleguide.quiz styleguide.showToast styleguide.showConfirm
styleguide.showDanger styleguide.retried`.split(/\s+/));
const LO_THAI_OK = new Set(["lang.th", "styleguide.thaiSample"]);
test("lo.json is Lao: no Latin words or Thai letters outside the reviewed token keys", () => {
  const bad = [];
  for (const [key, value] of Object.entries(locales.lo)) {
    if (!LO_LATIN_OK.has(key) && /[A-Za-z]{2,}/.test(value.replace(/\{\w+\}/g, ""))) bad.push(`${key}="${value}"`);
    if (!LO_THAI_OK.has(key) && /[\u0E00-\u0E7F]/.test(value)) bad.push(`${key} has Thai script`);
  }
  assert(!bad.length, bad.join(" | "));
});
test("no empty or non-string values in any language", () => {
  const bad = LANGS.flatMap((l) => Object.entries(locales[l]).filter(([, v]) => typeof v !== "string" || !v.trim()).map(([k]) => `${l}:${k}`));
  assert(!bad.length, bad.join(", "));
});
test(`every key used in ${SOURCES.length} source files exists`, async () => {
  const used = new Set(DYNAMIC);
  for (const path of SOURCES) {
    const src = await loadFile(path, "text");
    for (const m of src.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/["']([a-z][A-Za-z]*(?:\.[A-Za-z0-9_]+)+)["']/g)) {
      const [first] = m[1].split(".");
      if (first in Object.fromEntries(Object.keys(locales.lo).map((k) => [k.split(".")[0], 1])) && !/\.(html|js|json|css|md|txt)$/.test(m[1])) used.add(m[1]);
    }
  }
  const missing = [...used].filter((k) => !(k in locales.lo));
  assert(!missing.length, `missing: ${missing.join(", ")}`);
});

// ---------- rendered pages: every visible string must come from i18n (current language) or from data ----------
function scan(doc, templates) {
  const problems = [];
  const check = (raw, where) => {
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text || !/\p{L}/u.test(text) || DATA.has(text)) return;
    if (KEY_SHAPE.test(text)) problems.push(`missing key "${text}" (${where})`);
    else if (!templates.some((matches) => matches(text))) problems.push(`not from i18n: "${text}" (${where})`);
  };
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.parentElement.closest("script, style, [translate='no']")) check(n.textContent, n.parentElement.tagName.toLowerCase());
  }
  for (const el of doc.querySelectorAll("[aria-label], [title], [placeholder], [alt]")) {
    if (el.closest("[translate='no']")) continue;
    for (const attr of ["aria-label", "title", "placeholder", "alt"]) if (el.hasAttribute(attr)) check(el.getAttribute(attr), `@${attr}`);
  }
  check(doc.title, "<title>");
  return problems;
}

async function seedResult() {
  setSession(await login({ email: "user@example.com", password: "password123" }));
  const quiz = await getQuiz("g10");
  const answers = quiz.questions.map((q, i) => ({ questionId: q.id, choiceId: i === 1 ? "a" : q.choices[1].id }));
  saveResult("g10", quiz, await submitQuiz({ lessonId: "g10", answers }));
}

const restore = snapshotStorage();
const runs = [
  ...LANGS.map((lang) => ({ lang, mode: "" })),
  { lang: "th", mode: "error" },
  { lang: "en", mode: "empty" },
];
for (const { lang, mode } of runs) {
  test(`rendered pages · ${lang}${mode ? ` · ?mock=${mode}` : ""}: no hard-coded or missing text`, async () => {
    const templates = Object.values(locales[lang]).map(toMatcher);
    const problems = [];
    for (const auth of [false, true]) {
      if (auth) await seedResult();
      else removeStore("token");
      setStore("lang", lang);
      const group = PAGES.filter((p) => p.auth === auth && (!mode || auth));
      const frames = await Promise.all(group.map((p) => frame(`../${withMode(p.url, mode)}`)));
      frames.forEach((f, i) => {
        const where = group[i].url;
        if (f.timedOut) problems.push(`${where}: did not finish rendering`);
        if (f.doc.documentElement.lang !== lang) problems.push(`${where}: <html lang> is ${f.doc.documentElement.lang}`);
        scan(f.doc, templates).forEach((p) => problems.push(`${where}: ${p}`));
        f.remove();
      });
    }
    assert(!problems.length, `\n${[...new Set(problems)].join("\n")}`);
  });
}

await run();
restore();
