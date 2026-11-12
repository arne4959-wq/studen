// Inspection page: every shared component, state, theme and language, fed with the real mock data files.
import { initPage } from "../shell.js";
import { ApiError, loadFile } from "../api.js";
import { getLang, setLang } from "../i18n.js";
import {
  $, el, cmd, renderState, setMessage, setFieldError, themeSwitch, subjectCard, lessonRow, choiceButton,
  passFailTag, diffBox, reasonBox, statCard, heatmap, logList, isoDate, toast, confirmDialog, textBar,
} from "../ui.js";

const TOKENS = ["--bg", "--panel", "--line", "--text", "--muted", "--green", "--green-bg", "--blue", "--purple", "--red",
  "--red-bg", "--yellow", "--skeleton", "--on-green", "--heat-0", "--heat-1", "--heat-2", "--heat-3", "--heat-4"];

const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return isoDate(date);
};

if (await initPage({ auth: false, nav: "" })) {
  const [subjects, lessons, quizzes, answers, dashboard] = await Promise.all(
    ["subjects", "lessons", "quizzes", "answers", "dashboard"].map((name) => loadFile(`data/${name}.json`)));

  const select = $("#sg-lang");
  select.value = getLang();
  select.addEventListener("change", () => setLang(select.value));
  $("#sg-theme").append(themeSwitch("sg-theme-label"));

  $("#sg-swatches").append(...TOKENS.map((name) =>
    el("li", { class: "swatch" }, el("span", { class: "swatch__chip", style: `background: var(${name})` }), el("code", { translate: "no", text: name }))));

  $("#sg-button-row").append(
    cmd("button", "auth.login.submit", { class: "btn btn--primary" }),
    cmd("button", "common.retry", { class: "btn btn--secondary" }),
    cmd("button", "profile.logout", { class: "btn btn--danger-outline" }),
    el("button", { type: "button", class: "btn btn--danger", i18n: "profile.logoutConfirm" }),
    cmd("button", "quiz.next", { class: "btn btn--primary", "aria-disabled": "true" }, null),
    cmd("button", "quiz.submit", { class: "btn btn--primary", "aria-busy": "true", "aria-disabled": "true" }, null),
    el("a", { class: "btn btn--ghost", href: "#main", i18n: "summary.back" }),
    el("button", { type: "button", class: "chip", "aria-pressed": "true", i18n: "review.filterAll", vars: { n: 5 } }),
    el("button", { type: "button", class: "chip", "aria-pressed": "false", i18n: "review.filterWrong", vars: { n: 1 } }));

  setFieldError($("#sg-email"), "validation.email");
  setFieldError($("#sg-password"), "validation.passwordMin");
  setMessage($("#sg-msg-error"), "errors.invalid_credentials");
  setMessage($("#sg-msg-ok"), "password.changed", "success");

  const loading = $("#sg-loading");
  renderState(loading, "loading", { skeleton: "list" });
  loading.removeAttribute("aria-busy"); // demo only: keep tests from waiting on a permanent skeleton
  renderState($("#sg-error"), "error", { error: new ApiError(500, "server_error"), onRetry: () => toast("styleguide.retried") });
  renderState($("#sg-empty"), "empty", { emptyKey: "subjects.noLessons" });

  const cards = subjects.map((s, i) => subjectCard(s, i === 0, () => cards.forEach((c, j) => c.setAttribute("aria-pressed", String(j === i)))));
  $("#sg-cards").append(el("ul", { class: "subject-grid", role: "list" }, cards.map((c) => el("li", {}, c))));
  $("#sg-files").append(el("ul", { class: "files section", role: "list" }, lessons.english.slice(-3).map(lessonRow)));

  const quiz = quizzes.g10;
  $("#sg-summary").append(
    el("p", { class: "eyebrow" }, el("span", { i18n: "quiz.progress", vars: { i: 2, n: 5 } }), " ", textBar(2, 5, 5)),
    el("figure", { class: "code" },
      el("figcaption", { class: "code__bar" }, el("span", { class: "code__dots", "aria-hidden": "true", text: "●●●" }), el("span", { i18n: "summary.keyPoints" })),
      el("ol", { class: "code__lines" }, quiz.questions.slice(0, 2).map((q) => el("li", { class: "code__line", text: q.text })))));

  const q = quiz.questions[1];
  const choices = q.choices.map((c, k) => choiceButton(c, k, k === 1, () => choices.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.choice === c.id)))));
  $("#sg-choices").append(el("p", { class: "quiz__q", text: q.text }), el("div", { class: "choices", role: "group" }, choices));

  const key = answers.g10.q2;
  $("#sg-review").append(
    el("p", { class: "actions" }, passFailTag(true), passFailTag(false)),
    diffBox(q.choices[0].label, q.choices[1].label, false),
    diffBox(null, q.choices[1].label, true),
    reasonBox(key.explanation),
    el("div", { class: "score-big" }, el("p", { class: "score-big__value", text: "80%" }), el("p", { class: "score-big__label", i18n: "score.summary", vars: { score: 4, total: 5 } })));

  const activity = dashboard.activity.map((a) => ({ date: daysAgo(a.daysAgo), count: a.count }));
  const title = (id) => Object.values(lessons).flat().find((l) => l.id === id)?.title ?? id;
  $("#sg-dashboard").append(
    el("ul", { class: "stat-cards", role: "list" }, statCard("stats.lessons", "4/24"), statCard("stats.avgScore", "78%"), statCard("stats.quizzes", "4")),
    el("div", { class: "card" }, heatmap(activity)),
    logList(dashboard.attempts.map((a) => ({ ...a, lessonTitle: title(a.lessonId), date: daysAgo(a.daysAgo) }))),
    el("div", { class: "profile__head" }, el("span", { class: "avatar", translate: "no", "aria-hidden": "true", text: "S" }),
      el("div", {}, el("p", { class: "profile__name", text: "somphone" }), el("p", { class: "profile__email", translate: "no", text: "user@example.com" }))));

  $("#sg-overlay-row").append(
    cmd("button", "styleguide.showToast", { class: "btn btn--secondary", onClick: () => toast("language.changed") }),
    cmd("button", "styleguide.showConfirm", {
      class: "btn btn--secondary",
      onClick: async () => toast((await confirmDialog({ title: "quiz.exitTitle", message: "quiz.exitMessage" })) ? "styleguide.confirmed" : "styleguide.cancelled"),
    }),
    cmd("button", "styleguide.showDanger", {
      class: "btn btn--danger-outline",
      onClick: async () => toast((await confirmDialog({ title: "profile.logoutTitle", message: "profile.logoutMessage", confirm: "profile.logoutConfirm", danger: true })) ? "styleguide.confirmed" : "styleguide.cancelled"),
    }));
}
