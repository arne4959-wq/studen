import { initPage } from "../shell.js";
import { getDashboard } from "../api.js";
import { $, el, cmd, withState, statCard, heatmap, logList } from "../ui.js";

if (await initPage({ nav: "stats" })) {
  const region = $("#stats");
  withState(region, {
    load: getDashboard,
    skeleton: "stats",
    isEmpty: (d) => !d.quizzesTaken && !d.lessonsDone && !d.activity?.length && !d.recent?.length,
    emptyKey: "stats.empty",
    emptyAction: () => cmd("a", "common.toSubjects", { class: "btn btn--primary", href: "subjects.html" }),
    render(d) {
      region.append(
        el("ul", { class: "stat-cards", role: "list" },
          statCard("stats.lessons", `${d.lessonsDone}/${d.lessonsTotal}`),
          statCard("stats.avgScore", `${d.avgScore}%`),
          statCard("stats.quizzes", String(d.quizzesTaken))),
        el("section", { class: "section card", "aria-labelledby": "activity-h" },
          el("h2", { id: "activity-h", i18n: "stats.activity" }),
          heatmap(d.activity ?? [])),
        el("section", { class: "section", "aria-labelledby": "recent-h" },
          el("h2", { id: "recent-h" }, el("span", { class: "eyebrow", "aria-hidden": "true", text: "$ " }), el("span", { i18n: "stats.recent" })),
          d.recent?.length ? logList(d.recent) : el("p", { class: "field__hint", i18n: "stats.noRecent" })),
      );
    },
  });
}
