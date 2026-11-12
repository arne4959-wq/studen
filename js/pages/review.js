import { initPage } from "../shell.js";
import { loadResult } from "../store.js";
import { $, el, cmd, enc, param, renderState, emptyBox, passFailTag, diffBox, reasonBox } from "../ui.js";

if (await initPage({ nav: "subjects" })) {
  const region = $("#review");
  const lessonId = param("lesson");
  const saved = lessonId ? loadResult(lessonId) : null;
  const retry = (primary = true) => cmd("a", "review.retry", { class: `btn ${primary ? "btn--primary" : "btn--secondary"}`, href: `quiz.html?lesson=${enc(lessonId)}` });

  if (!saved) {
    renderState(region, "empty", { emptyKey: "review.empty", emptyAction: lessonId ? retry() : null });
  } else {
    const { quiz, result } = saved;
    const items = result.results.map((r, index) => {
      const q = quiz.questions.find((item) => item.id === r.questionId) ?? { text: r.questionId, choices: [] };
      return { r, q, n: index + 1, open: !r.correct };
    });
    const wrong = items.filter((item) => !item.r.correct);
    const desktop = window.matchMedia("(min-width: 768px)");
    const list = el("div", { class: "review__list" });
    let filter = "all";
    let selected = wrong[0] ?? items[0];

    const label = (item, choiceId) => item.q.choices.find((c) => c.id === choiceId)?.label ?? null;
    const detail = (item) =>
      el("div", { class: "answer" }, diffBox(label(item, item.r.yourChoiceId), label(item, item.r.correctChoiceId), item.r.correct), reasonBox(item.r.explanation));
    const title = (item, tag) => el(tag, { class: "review__q", i18n: "review.question", vars: { n: item.n, text: item.q.text } });

    function accordion(visible) {
      return el("ol", { class: "acc", role: "list" }, visible.map((item) => {
        const panelId = `answer-${item.n}`;
        const panel = el("div", { class: "acc__panel", id: panelId, hidden: !item.open }, detail(item));
        const button = el("button", {
          type: "button", class: "acc__btn", "aria-expanded": String(item.open), "aria-controls": panelId,
          onClick: () => {
            item.open = !item.open;
            button.setAttribute("aria-expanded", String(item.open));
            panel.hidden = !item.open;
          },
        }, passFailTag(item.r.correct), title(item, "span"), el("span", { class: "acc__chev", "aria-hidden": "true", text: "▾" }));
        return el("li", { class: "acc__item" }, el("h2", { class: "acc__head" }, button), panel);
      }));
    }

    function masterDetail(visible) {
      if (!visible.includes(selected)) selected = visible[0];
      const pane = el("section", { class: "md__detail", id: "review-detail", "aria-live": "polite" });
      const show = () => pane.replaceChildren(title(selected, "h2"), detail(selected));
      const buttons = visible.map((item) => el("button", {
        type: "button", class: "md__item", "aria-controls": "review-detail", "aria-current": item === selected ? "true" : null,
        onClick: () => {
          selected = item;
          buttons.forEach((b, i) => (visible[i] === item ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
          show();
        },
      }, passFailTag(item.r.correct), el("span", { class: "md__text", i18n: "review.question", vars: { n: item.n, text: item.q.text } })));
      show();
      return el("div", { class: "md" }, el("ul", { class: "md__list", role: "list" }, buttons.map((b) => el("li", {}, b))), pane);
    }

    function draw() {
      const visible = filter === "wrong" ? wrong : items;
      list.replaceChildren(!visible.length ? emptyBox("review.noWrong") : desktop.matches ? masterDetail(visible) : accordion(visible));
    }

    const chips = [["all", "review.filterAll", items.length], ["wrong", "review.filterWrong", wrong.length]].map(([value, key, count]) =>
      el("button", {
        type: "button", class: "chip", "aria-pressed": String(filter === value), i18n: key, vars: { n: count },
        onClick: () => {
          filter = value;
          chips.forEach((chip, i) => chip.setAttribute("aria-pressed", String(i === (value === "all" ? 0 : 1))));
          draw();
        },
      }));

    region.append(
      el("p", { class: "review__score", i18n: "score.summary", vars: { score: result.score, total: result.total } }),
      el("div", { class: "chips", role: "group", i18nAttr: { "aria-label": "review.filter" } }, chips),
      list,
      el("div", { class: "actions section" },
        // after a mistake: read the lesson again first, then retake
        wrong.length > 0 && cmd("a", "review.toLesson", { class: "btn btn--primary", href: `summary.html?lesson=${enc(lessonId)}` }),
        retry(!wrong.length),
        cmd("a", "review.toScore", { class: "btn btn--secondary", href: `score.html?lesson=${enc(lessonId)}` })),
    );
    desktop.addEventListener("change", draw);
    draw();
  }
}
