import * as api from "../js/api.js";
import { getToken, setSession, setStore, saveResult } from "../js/store.js";
import { safeNext } from "../js/guard.js";
import { test, assert, rejects, run, frame, snapshotStorage } from "./harness.js";

const restore = snapshotStorage();
const withMock = async (mode, fn) => {
  const before = window.location.search;
  window.history.replaceState(null, "", mode ? `?mock=${mode}` : window.location.pathname);
  try {
    return await fn();
  } finally {
    window.history.replaceState(null, "", window.location.pathname + before);
  }
};
const isApiError = (status, code) => (error) => {
  assert(error instanceof api.ApiError, `expected ApiError, got ${error?.name}`);
  assert(error.status === status, `status ${error.status} !== ${status}`);
  assert(error.code === code, `code ${error.code} !== ${code}`);
  assert(typeof error.message === "string" && error.message.length > 0, "message missing");
};
const PAST = ["a", "c", "b", "d", "b", "b", "b", "c", "c", "b"]; // g10 (was/were + Past Simple): q10 deliberately wrong (correct is a)

window.localStorage.removeItem("hianngai:mockdb2");
window.sessionStorage.clear();

test("POST /api/auth/login → {token,user}", async () => {
  const res = await api.login({ email: "user@example.com", password: "password123" });
  assert(res.token.startsWith("mock-"), "token");
  assert(res.user.email === "user@example.com" && res.user.username && res.user.id !== undefined, "user shape");
  setSession(res);
});
test("login wrong password → 401 invalid_credentials", () =>
  rejects(api.login({ email: "user@example.com", password: "short" }), isApiError(401, "invalid_credentials")));
test("login other email → 401 invalid_credentials", () =>
  rejects(api.login({ email: "x@example.com", password: "password123" }), isApiError(401, "invalid_credentials")));
test("register taken@example.com → 409 email_taken", () =>
  rejects(api.register({ username: "taken", email: "taken@example.com", password: "password123" }), isApiError(409, "email_taken")));
test("register new → {token,user}", async () => {
  const res = await api.register({ username: "noy", email: "noy@example.com", password: "password123" });
  assert(res.token && res.user.username === "noy" && res.user.email === "noy@example.com", "shape");
  setSession(await api.login({ email: "user@example.com", password: "password123" }));
});
test("forgot → {ok:true}", async () => assert((await api.forgot({ email: "user@example.com" })).ok === true));
test("GET /api/me → {id,username,email}", async () => {
  const me = await api.getMe();
  assert(me.email === "user@example.com" && me.username && me.id !== undefined);
});
test("GET /api/subjects → ພາສາອັງກິດ (11) + ຄະນິດສາດ (5) + ສ້ອມແປງຄອມພິວເຕີ (11), nothing done yet", async () => {
  const subjects = await api.getSubjects();
  assert(subjects.length === 3, "count");
  const byId = Object.fromEntries(subjects.map((s) => [s.id, s]));
  assert(byId.english.name === "ພາສາອັງກິດ" && byId.english.lessonCount === 11, "english");
  assert(byId.math.name === "ຄະນິດສາດ" && byId.math.lessonCount === 5, "math");
  assert(byId.repair.name === "ສ້ອມແປງຄອມພິວເຕີ" && byId.repair.lessonCount === 11, "repair");
  assert(subjects.every((s) => s.doneCount === 0), "doneCount 0");
});
test("GET lessons: every lesson has a summary with a picture, examples and tasks + a quiz (English/maths: 5 questions per merged topic, repair: the teacher's 15 split over 11 lessons), unknown 404", async () => {
  for (const [subjectId, n] of [["english", 11], ["math", 5], ["repair", 11]]) {
    const lessons = await api.getLessons(subjectId);
    assert(lessons.length === n, `${subjectId}: ${lessons.length} lessons`);
    assert(lessons.every((l) => l.id && l.order && l.slug && l.title && l.status === "todo"), `${subjectId} shape`);
    assert(lessons.every((l) => Number.isInteger(l.level)) && new Set(lessons.map((l) => l.level)).size === ({ english: 3, math: 1, repair: 2 })[subjectId], `${subjectId} levels`);
    for (const l of lessons) {
      const summary = await api.getSummary(l.id);
      assert(summary.intro && summary.order === l.order, `${l.id} summary (lesson number ${summary.order} vs list ${l.order})`);
      assert(summary.image?.alt && summary.image.caption && (await api.loadFile(summary.image.src, "text")).includes("<svg"), `${l.id} picture`);
      assert(summary.examples?.every((e) => e.title && e.lines?.length) && summary.tryIt?.every((t) => t.task && t.answer) && summary.idea, `${l.id} examples / tasks / idea`);
      for (const photo of summary.photos ?? []) {
        assert(photo.alt && photo.credit && photo.source.startsWith("https://commons.wikimedia.org/wiki/File:") && photo.width > 0 && photo.height > 0, `${l.id} photo ${photo.src}: alt, credit, source and size`);
        await api.loadFile(photo.src, "text"); // rejects when the file is missing
      }
      const n = (await api.getQuiz(l.id)).questions.length;
      assert(n >= (subjectId === "repair" ? 1 : 5), `${l.id} quiz has ${n} questions`);
    }
  }
  await rejects(api.getLessons("nope"), isApiError(404, "not_found"));
});
test("GET summary → title/readMinutes/intro/keyPoints/table/bookRef", async () => {
  const s = await api.getSummary("g10");
  assert(s.id === "g10" && s.title && typeof s.readMinutes === "number" && s.intro, "fields");
  assert(Array.isArray(s.keyPoints) && s.keyPoints.length > 0, "keyPoints");
  assert(s.table.every((row) => row.from && row.to), "table rows");
  assert(typeof s.bookRef === "string", "bookRef");
});
test("GET quiz → 10 questions × 4 choices, no answers leaked", async () => {
  const quiz = await api.getQuiz("g10");
  assert(quiz.lessonId === "g10" && quiz.questions.length === 10, "10 questions");
  assert(quiz.questions.every((q) => q.id && q.text && q.choices.length === 4 && q.choices.every((c) => c.id && c.label)), "shape");
  const raw = JSON.stringify(quiz);
  assert(!/correct|explanation|answer/i.test(raw), "quiz payload contains answer data");
  assert(quiz.questions[5].text === "Yesterday I ___ to school.", "q6 text");
});
test("POST submit → server-side score 9/10 = 90%", async () => {
  const quiz = await api.getQuiz("g10");
  const answers = quiz.questions.map((q, i) => ({ questionId: q.id, choiceId: PAST[i] }));
  const res = await api.submitQuiz({ lessonId: "g10", answers });
  assert(res.score === 9 && res.total === 10 && res.percent === 90, `got ${res.score}/${res.total} ${res.percent}%`);
  assert(res.results.length === 10 && res.results.every((r) => "correct" in r && r.correctChoiceId && r.explanation), "results shape");
  const wrong = res.results.find((r) => !r.correct);
  assert(wrong.questionId === "q10" && wrong.yourChoiceId === "b" && wrong.correctChoiceId === "a", "wrong row");
});
test("g01 all correct → 10/10 = 100%", async () => {
  const answers = ["b", "c", "a", "d", "b", "b", "a", "c", "b", "c"].map((choiceId, i) => ({ questionId: `q${i + 1}`, choiceId }));
  const res = await api.submitQuiz({ lessonId: "g01", answers });
  assert(res.score === 10 && res.percent === 100, `got ${res.score}/${res.total}`);
});
test("after submit: lessons done, doneCount 2, dashboard shows them", async () => {
  const lesson = (await api.getLessons("english")).find((l) => l.id === "g10");
  assert(lesson.status === "done" && lesson.score === 9 && lesson.total === 10, "lesson done with score");
  const grammar = (await api.getSubjects()).find((s) => s.id === "english");
  assert(grammar.doneCount === 2, `doneCount ${grammar.doneCount}`);
  const d = await api.getDashboard();
  assert(d.recent[0].lessonId === "g01" && d.recent[1].lessonId === "g10" && d.recent[1].lessonTitle.includes("Past Simple"), "recent");
  assert(d.quizzesTaken === 2 && d.lessonsTotal === 27 && d.lessonsDone === 2 && d.avgScore === 95, `counts ${d.quizzesTaken}/${d.lessonsDone}/${d.lessonsTotal}/${d.avgScore}`);
  assert(typeof d.avgScore === "number" && d.activity.every((a) => /^\d{4}-\d\d-\d\d$/.test(a.date) && a.count > 0), "activity");
});
test("math m03 (3 topics) all correct → 15/15, m08 one wrong → 9/10 with Lao explanation", async () => {
  const ok = await api.submitQuiz({ lessonId: "m03", answers: ["b", "b", "c", "b", "a", "a", "d", "b", "c", "a", "a", "b", "c", "b", "d"].map((choiceId, i) => ({ questionId: `q${i + 1}`, choiceId })) });
  assert(ok.score === 15 && ok.percent === 100, `m03 ${ok.score}/${ok.total}`);
  const bad = await api.submitQuiz({ lessonId: "m08", answers: ["a", "c", "b", "d", "c", "a", "a", "d", "a", "c"].map((choiceId, i) => ({ questionId: `q${i + 1}`, choiceId })) });
  assert(bad.score === 9 && bad.results[5].correct === false && bad.results[5].correctChoiceId === "b" && bad.results[5].explanation.length > 0, `m08 ${bad.score}/${bad.total}`);
});
test("repair: the teacher's 15 questions are all there, scored from the answer key, with the lesson-number gap kept", async () => {
  const lessons = await api.getLessons("repair");
  assert(lessons.map((l) => l.order).join() === "1,2,3,5,6,7,8,9,10,11,12", "orders follow the slide chapters (3-4 is one lesson)");
  let total = 0;
  for (const l of lessons) total += (await api.getQuiz(l.id)).questions.length;
  assert(total === 15, `${total} questions`);
  // r05 = ch.6: ALU (c) and volatile memory (b); answering c then a must score 1/2 and explain the miss
  const res = await api.submitQuiz({ lessonId: "r05", answers: [{ questionId: "q1", choiceId: "c" }, { questionId: "q2", choiceId: "a" }] });
  assert(res.score === 1 && res.total === 2 && res.results[1].correctChoiceId === "b" && res.results[1].explanation.includes("volatile"), `r05 ${res.score}/${res.total}`);
  const table = await api.getSummary("r09");
  assert(table.tableHeaders?.length === 2 && table.table.length === 5 && table.order === 10, "RAM table with custom headers");
});
test("summary page: a lesson without a code sample (r09) prints no stray 'undefined' / 'false'", async () => {
  const f = await frame("../summary.html?lesson=r09");
  const text = f.doc.querySelector("main").textContent;
  f.remove();
  assert(!/undefined|false/.test(text), `stray "${text.match(/undefined|false/)?.[0]}" on the page`);
  assert(text.includes("DDR4"), `lesson content missing (timedOut: ${f.timedOut})`);
});
test("summary page: the picture loads and has alt text; 'try it' answers stay folded until opened; real photos carry their licence credit", async () => {
  const f = await frame("../summary.html?lesson=v01");
  const img = f.doc.querySelector(".shot__img");
  const answers = [...f.doc.querySelectorAll(".try__answer")];
  const loaded = await img?.decode().then(() => true, () => false); // rejects when the file is missing or broken
  const folded = answers.length === 3 && answers.every((a) => !a.open);
  const alt = img?.alt;
  f.remove();
  assert(loaded && alt && folded, `picture loaded: ${loaded}, alt: "${alt}", ${answers.length} answers, all folded: ${folded}`);
  const g = await frame("../summary.html?lesson=r08");
  const credits = g.doc.querySelectorAll('.photos .shot__credit a[href^="https://commons.wikimedia.org/"][rel~="noopener"]').length;
  g.remove();
  assert(credits === 3, `r08 shows ${credits} real photos with a licence credit link (expected 3)`);
});
test("styleguide page runs to the end (it borrows a real quiz and lesson rows from the mock data)", async () => {
  const f = await frame("../styleguide.html");
  const found = ["#sg-files .file", "#sg-choices .choice", "#sg-review .reason", "#sg-overlay-row button"].filter((selector) => f.doc.querySelector(selector));
  f.remove();
  assert(found.length === 4, `only rendered: ${found.join(", ") || "nothing"}`);
});
// ---- study flow: continue card, next lesson, review link ----
const until = async (find, ms = 5000) => {
  for (const t0 = Date.now(); Date.now() - t0 < ms; await new Promise((r) => setTimeout(r, 100))) {
    const found = find();
    if (found) return found;
  }
  return null;
};
const answersFor = (key, quiz, lessonId, wrongFirst) =>
  quiz.questions.map((q, i) => {
    const right = key[lessonId][q.id].correctChoiceId;
    return { questionId: q.id, choiceId: wrongFirst && i === 0 ? (right === "a" ? "b" : "a") : right };
  });
test("getNextLesson: the following lesson in order; null after the last one or for an unknown id", async () => {
  assert((await api.getNextLesson("v01"))?.id === "v03", "v01 → v03");
  assert((await api.getNextLesson("r03"))?.id === "r04", "numbering gap 3 → 5 still moves on to the next lesson");
  assert((await api.getNextLesson("g10")) === null, "g10 is the last English lesson");
  assert((await api.getNextLesson("nope")) === null, "unknown lesson");
});
test("subjects page: continue card opens the first lesson not done; the last subject is remembered", async () => {
  let f = await frame("../subjects.html?subject=english");
  const english = (await until(() => f.doc.querySelector(".continue a.btn")))?.getAttribute("href");
  f.remove();
  assert(english === "summary.html?lesson=v01", `english card → ${english}`);
  f = await frame("../subjects.html?subject=math"); // m03 and m08 are done, m01 comes first
  const math = (await until(() => f.doc.querySelector(".continue a.btn")))?.getAttribute("href");
  f.remove();
  assert(math === "summary.html?lesson=m01", `math card → ${math}`);
  f = await frame("../subjects.html"); // no ?subject=: opens the subject used last
  const pressed = f.doc.querySelector('.subject-card[aria-pressed="true"]')?.textContent ?? "";
  f.remove();
  assert(pressed.includes("ຄະນິດສາດ"), `remembered subject: ${pressed}`);
});
test("score page: 'next lesson' button; primary is 'see answers' after a mistake, 'next lesson' when all correct", async () => {
  const key = await api.loadFile("data/answers.json");
  const quiz = await api.getQuiz("v01");
  for (const wrongFirst of [false, true]) {
    saveResult("v01", quiz, await api.submitQuiz({ lessonId: "v01", answers: answersFor(key, quiz, "v01", wrongFirst) }));
    const f = await frame("../score.html?lesson=v01");
    const next = await until(() => f.doc.querySelector('a[href="summary.html?lesson=v03"]'));
    const review = f.doc.querySelector('a[href="review.html?lesson=v01"]');
    const primary = { next: next?.classList.contains("btn--primary"), review: review?.classList.contains("btn--primary") };
    f.remove();
    assert(next && review, `buttons present (wrongFirst=${wrongFirst})`);
    assert(primary.next === !wrongFirst && primary.review === wrongFirst, `wrongFirst=${wrongFirst}: primary ${JSON.stringify(primary)}`);
  }
});
test("review page: 'review this lesson' link only when something was wrong", async () => {
  const quiz = await api.getQuiz("v01");
  const key = await api.loadFile("data/answers.json");
  const links = [];
  for (const wrongFirst of [true, false]) {
    saveResult("v01", quiz, await api.submitQuiz({ lessonId: "v01", answers: answersFor(key, quiz, "v01", wrongFirst) }));
    const f = await frame("../review.html?lesson=v01");
    links.push(!!f.doc.querySelector('a[href="summary.html?lesson=v01"]'));
    f.remove();
  }
  assert(links[0] === true && links[1] === false, `link when wrong / when all correct: ${links}`);
});
test("subjects page: when every lesson is done the card says so instead of offering a lesson", async () => {
  const key = await api.loadFile("data/answers.json");
  for (const lesson of await api.getLessons("math")) {
    if (lesson.status === "done") continue;
    const quiz = await api.getQuiz(lesson.id);
    await api.submitQuiz({ lessonId: lesson.id, answers: answersFor(key, quiz, lesson.id, false) });
  }
  const f = await frame("../subjects.html?subject=math");
  const done = await until(() => f.doc.querySelector(".continue--done"));
  const offersLesson = !!f.doc.querySelector(".continue a.btn");
  f.remove();
  assert(done && !offersLesson, "all-done card shown, no lesson link");
});
test("submit with bad lesson → 400 validation_error", () =>
  rejects(api.submitQuiz({ lessonId: "no_such_lesson", answers: [] }), isApiError(400, "validation_error")));
test("change-password wrong current → 400 wrong_password; ok → {ok:true}", async () => {
  await rejects(api.changePassword({ current: "1234", next: "newpassword1" }), isApiError(400, "wrong_password"));
  assert((await api.changePassword({ current: "password123", next: "newpassword1" })).ok === true);
});
test("logout → {ok:true}", async () => assert((await api.logout()).ok === true));
test("?mock=error → every request 500 server_error (auth too), locales still load", () =>
  withMock("error", async () => {
    await rejects(api.getSubjects(), isApiError(500, "server_error"));
    await rejects(api.login({ email: "user@example.com", password: "password123" }), isApiError(500, "server_error"));
    assert((await api.loadLocale("lo")).app.name === "ຮຽນງ່າຍ", "locale");
  }));
test("?mock=empty → empty lists and zero dashboard", () =>
  withMock("empty", async () => {
    assert((await api.getSubjects()).length === 0, "subjects");
    assert((await api.getLessons("english")).length === 0, "lessons");
    assert((await api.getQuiz("g10")).questions.length === 0, "quiz");
    const d = await api.getDashboard();
    assert(d.quizzesTaken === 0 && d.activity.length === 0 && d.recent.length === 0, "dashboard");
  }));
test("?mock=slow → ~3 s latency", () =>
  withMock("slow", async () => {
    const t0 = performance.now();
    await api.getMe();
    const ms = performance.now() - t0;
    assert(ms >= 2900, `took ${Math.round(ms)}ms`);
  }));
test("default latency ~400 ms", async () => {
  const t0 = performance.now();
  await api.getMe();
  const ms = performance.now() - t0;
  assert(ms >= 390 && ms < 1500, `took ${Math.round(ms)}ms`);
});
test("safeNext keeps same-origin paths only", () => {
  assert(safeNext("quiz.html?lesson=g11").endsWith("/quiz.html?lesson=g11"), "relative ok");
  for (const bad of ["https://evil.example/x", "//evil.example", "/\\evil.example", "javascript:alert(1)", "data:text/html,x", "login.html", ""]) {
    assert(safeNext(bad) === "subjects.html", `not rejected: ${bad}`);
  }
});
test("quiz: Enter on a selected choice goes next; Enter on an unselected choice keeps its native action", async () => {
  setSession(await api.login({ email: "user@example.com", password: "password123" }));
  const f = await frame("../quiz.html?lesson=g01");
  const press = (target) => {
    const event = new f.win.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const heading = () => f.doc.querySelector("#quiz-q").textContent;
  const [a, b] = f.doc.querySelectorAll("[data-choice]");
  const first = heading();
  a.click();
  assert(press(b) === false && heading() === first, "Enter on an unselected choice must not be hijacked");
  assert(press(a) === true && heading() !== first, "Enter on the selected choice must go to the next question");
  f.remove();
});
test("guard: no token → login.html?next=…", async () => {
  window.localStorage.removeItem("hianngai:token");
  const f = await frame("../stats.html?x=1");
  const url = new URL(f.win.location.href);
  f.remove();
  assert(url.pathname.endsWith("/login.html") && url.searchParams.get("next") === "stats.html?x=1", url.href);
});
test("guard: invalid token → 401 clears session and goes to login", async () => {
  setStore("token", "forged-token");
  const f = await frame("../subjects.html");
  const href = f.win.location.href;
  f.remove();
  assert(href.includes("/login.html?next=subjects.html"), href);
  assert(getToken() === null, "token not cleared");
});
test("guard: signed in → login/register bounce to subjects", async () => {
  setSession(await api.login({ email: "user@example.com", password: "password123" }));
  for (const page of ["../login.html", "../register.html"]) {
    const f = await frame(page);
    const href = f.win.location.href;
    f.remove();
    assert(href.endsWith("/subjects.html"), `${page} → ${href}`);
  }
});

await run();
restore();
