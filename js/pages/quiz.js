import { initPage } from "../shell.js";
import { getQuiz, submitQuiz } from "../api.js";
import { getJSON, setJSON, removeStore, saveResult } from "../store.js";
import { $, el, cmd, enc, param, setText, renderState, withState, choiceButton, textBar, setBusy, isLocked, confirmDialog, toast, errorBox } from "../ui.js";

if (await initPage({ shell: false })) {
  const lessonId = param("lesson");
  const KEY = `quiz:${lessonId}`;
  const region = $("#quiz");
  const progress = $("#quiz-progress");
  let quiz = null;
  let state = { i: 0, answers: {} };
  let submitting = false;
  let view = {};

  const save = () => setJSON(KEY, state, true);
  const backUrl = lessonId ? `summary.html?lesson=${enc(lessonId)}` : "subjects.html";

  $("#quiz-exit").addEventListener("click", async () => {
    if (submitting) return;
    const leave = await confirmDialog({ title: "quiz.exitTitle", message: "quiz.exitMessage", confirm: "quiz.exitConfirm", danger: true });
    if (!leave) return;
    removeStore(KEY, true);
    window.location.href = backUrl;
  });

  function restore(questions) {
    const saved = getJSON(KEY, null, true);
    if (!saved || typeof saved.answers !== "object") return false;
    for (const q of questions) {
      const choiceId = saved.answers[q.id];
      if (q.choices.some((c) => c.id === choiceId)) state.answers[q.id] = choiceId;
    }
    // "next" is locked until answered, so never resume past the first unanswered question
    const firstOpen = questions.findIndex((q) => !state.answers[q.id]);
    state.i = Math.max(0, Math.min(Number(saved.i) || 0, firstOpen === -1 ? questions.length - 1 : firstOpen));
    return Object.keys(state.answers).length > 0;
  }

  function draw(focus) {
    const { questions } = quiz;
    const q = questions[state.i];
    const n = questions.length;
    const last = state.i === n - 1;
    progress.replaceChildren(el("span", { i18n: "quiz.progress", vars: { i: state.i + 1, n } }), " ", textBar(state.i + 1, n, n));

    const heading = el("h1", { class: "quiz__q", id: "quiz-q", tabindex: "-1" },
      el("span", { class: "sr-only", i18n: "quiz.progressSr", vars: { i: state.i + 1, n } }), q.text);
    const buttons = q.choices.map((c, k) => choiceButton(c, k, state.answers[q.id] === c.id, () => choose(c.id)));
    const status = el("p", { class: "quiz__status", id: "quiz-status", role: "status" });
    const message = el("div", { class: "quiz__msg" });
    const prev = cmd("button", "quiz.prev", { class: "btn btn--secondary", "aria-disabled": state.i === 0 ? "true" : null, onClick: () => !isLocked(prev) && go(-1) }, null);
    const next = cmd("button", last ? "quiz.submit" : "quiz.next", {
      class: "btn btn--primary",
      "aria-disabled": state.answers[q.id] ? null : "true",
      onClick: () => onNext(),
    }, null);
    view = { q, buttons, next, status, message, last };

    region.replaceChildren(
      el("p", { class: "eyebrow", i18n: "quiz.pickHint" }),
      heading,
      el("div", { class: "choices", role: "group", "aria-labelledby": "quiz-q" }, buttons),
      el("p", { class: "quiz__hint", i18n: "quiz.shortcutHint" }),
      status,
      message,
      el("div", { class: "quiz__nav" }, prev, next),
    );
    if (focus) heading.focus();
  }

  function choose(choiceId) {
    if (submitting) return;
    state.answers[view.q.id] = choiceId;
    save();
    view.buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.choice === choiceId)));
    view.next.removeAttribute("aria-disabled");
    view.status.textContent = "";
  }

  function go(delta) {
    state.i += delta;
    save();
    draw(true);
  }

  function onNext() {
    if (submitting) return;
    if (!state.answers[view.q.id]) return setText(view.status, "quiz.chooseFirst");
    return view.last ? submit() : go(1);
  }

  async function submit() {
    submitting = true;
    setBusy(view.next, true);
    view.message.replaceChildren();
    try {
      const answers = quiz.questions.map((q) => ({ questionId: q.id, choiceId: state.answers[q.id] }));
      const result = await submitQuiz({ lessonId, answers });
      saveResult(lessonId, quiz, result);
      removeStore(KEY, true);
      window.location.href = `score.html?lesson=${enc(lessonId)}`;
    } catch (error) {
      submitting = false;
      setBusy(view.next, false);
      if (error.status !== 401) view.message.replaceChildren(errorBox(error), el("p", { class: "field__hint", i18n: "quiz.retryHint" }));
    }
  }

  document.addEventListener("keydown", (event) => {
    if (!quiz || submitting || event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.querySelector("dialog[open]") || event.target.closest?.("input, textarea, select")) return;
    // Enter = next/submit on a selected choice or the page body; unselected choices, prev, exit and links keep native Enter.
    if (event.key === "Enter" && !event.repeat) {
      const onChoice = event.target.closest?.("[data-choice]");
      if (onChoice?.getAttribute("aria-pressed") === "true" || !event.target.closest?.("button, a")) {
        event.preventDefault();
        onNext();
      }
      return;
    }
    if (event.key.length !== 1) return;
    const index = "1234".includes(event.key) ? Number(event.key) - 1 : "abcd".indexOf(event.key.toLowerCase());
    const button = view.buttons?.[index];
    if (index < 0 || !button) return;
    event.preventDefault();
    choose(button.dataset.choice);
    button.focus();
  });

  if (!lessonId) {
    renderState(region, "empty", { emptyKey: "quiz.missing" });
  } else {
    withState(region, {
      load: () => getQuiz(lessonId),
      skeleton: "quiz",
      isEmpty: (data) => !data.questions?.length,
      emptyKey: "quiz.empty",
      emptyAction: () => cmd("a", "quiz.backToLesson", { class: "btn btn--secondary", href: backUrl }, null),
      render(data) {
        quiz = data;
        if (restore(data.questions)) toast("quiz.restored");
        draw(false);
      },
    });
  }
}
