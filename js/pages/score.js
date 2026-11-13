import { initPage } from "../shell.js";
import { loadResult, saveResult } from "../store.js";
import { getNextLesson, getQuizResult } from "../api.js";
import { $, el, cmd, enc, param, renderState, passFailTag, errorBox } from "../ui.js";

if (await initPage({ nav: "subjects" })) await renderScore();

async function renderScore() {
  const region = $("#score");
  const lessonId = param("lesson");
  let saved = lessonId ? loadResult(lessonId) : null;
  if (!saved && lessonId) {
    renderState(region, "loading", { skeleton: "text" });
    try {
      saved = await getQuizResult(lessonId);
      if (saved) saveResult(lessonId, saved.quiz, saved.result);
    } catch (error) {
      region.replaceChildren(errorBox(error, () => window.location.reload()));
      return;
    }
  }

  if (!saved) {
    renderState(region, "empty", { emptyKey: "score.empty", emptyAction: cmd("a", "common.toSubjects", { class: "btn btn--secondary", href: "subjects.html" }) });
  } else {
    // Everything below comes from the submitQuiz response; nothing is graded here.
    const { quiz, result } = saved;
    const label = (q, choiceId) => q?.choices.find((c) => c.id === choiceId)?.label;
    const answer = (text) => (text === undefined ? el("dd", { i18n: "review.noAnswer" }) : el("dd", { text }));
    const wrong = result.total - result.score; // after a mistake the first thing to do is look at the answers
    const reviewButton = cmd("a", "score.toReview", { class: `btn ${wrong ? "btn--primary" : "btn--secondary"}`, href: `review.html?lesson=${enc(lessonId)}` });
    const actions = el("div", { class: "actions" }, reviewButton,
      cmd("a", "common.toSubjects", { class: "btn btn--secondary", href: "subjects.html" }),
      cmd("a", "score.toStats", { class: "btn btn--secondary", href: "stats.html" }));

    region.append(
      el("div", { class: "term" },
        el("p", { class: "term__cmd" }, el("span", { class: "term-prompt", "aria-hidden": "true", text: "$" }), " ",
          el("span", { translate: "no", i18n: "score.command", vars: { lesson: lessonId } })),
        el("ol", { class: "tests", role: "list" }, result.results.map((r, index) => {
          const q = quiz.questions.find((item) => item.id === r.questionId);
          return el("li", { class: "test" },
            passFailTag(r.correct),
            el("span", { class: "test__name", i18n: "score.questionName", vars: { n: index + 1, text: q?.text ?? r.questionId } }),
            !r.correct && el("dl", { class: "test__detail" },
              el("div", { class: "test__expected" }, el("dt", { i18n: "score.expected" }), answer(label(q, r.correctChoiceId))),
              el("div", { class: "test__received" }, el("dt", { i18n: "score.received" }), answer(label(q, r.yourChoiceId)))));
        })),
        el("p", { class: "term__summary" },
          el("span", { i18n: "score.tests" }), " ",
          el("span", { class: "term__pass", i18n: "score.passed", vars: { n: result.score } }), ", ",
          el("span", { class: "term__fail", i18n: "score.failed", vars: { n: result.total - result.score } }), ", ",
          el("span", { i18n: "score.totalCount", vars: { n: result.total } }))),
      el("div", { class: "score-big" },
        el("p", { class: "eyebrow", i18n: "score.total" }),
        el("p", { class: "score-big__value", text: `${result.percent}%` }),
        el("p", { class: "score-big__label", i18n: "score.summary", vars: { score: result.score, total: result.total } })),
      actions,
    );
    // Not essential, so it is added when the lookup finishes.
    getNextLesson(lessonId).then((next) => {
      if (!next) return;
      const button = cmd("a", "score.next", { class: `btn ${wrong ? "btn--secondary" : "btn--primary"}`, href: `summary.html?lesson=${enc(next.id)}` });
      if (wrong) reviewButton.after(button);
      else actions.prepend(button);
    }).catch((error) => region.append(errorBox(error)));
  }
}
