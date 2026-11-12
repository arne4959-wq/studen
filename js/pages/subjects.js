import { initPage } from "../shell.js";
import { getSubjects, getLessons } from "../api.js";
import { getStore, setStore } from "../store.js";
import { $, el, cmd, enc, param, setText, withState, subjectCard, lessonRow } from "../ui.js";

// "Continue" card: the first lesson not done yet, or a note when the subject is finished.
function continueCard(next, started) {
  if (!next) return el("p", { class: "card continue continue--done", i18n: "subjects.allDone" });
  return el("div", { class: "card continue" },
    el("p", { class: "eyebrow", i18n: started ? "subjects.continue" : "subjects.startHere" }),
    el("p", { class: "continue__title" }, el("span", { i18n: "subjects.lessonNo", vars: { n: next.order } }), " · ", next.title),
    cmd("a", "subjects.continueGo", { class: "btn btn--primary", href: `summary.html?lesson=${enc(next.id)}` }));
}

if (await initPage({ nav: "subjects" })) {
  const section = $("#lessons-section");
  const lessonsRegion = $("#lessons");

  function showLessons(subject) {
    setStore("subject", subject.id); // reopen on the same subject next time
    section.hidden = false;
    setText($("#lessons-h"), "subjects.lessonsOf", { name: subject.name });
    withState(lessonsRegion, {
      load: () => getLessons(subject.id),
      skeleton: "list",
      emptyKey: "subjects.noLessons",
      render(lessons) {
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        const levels = new Map();
        for (const lesson of sorted) levels.get(lesson.level ?? 1)?.push(lesson) ?? levels.set(lesson.level ?? 1, [lesson]);
        const next = sorted.find((lesson) => lesson.status !== "done");
        const current = next ?? sorted.at(-1); // open the level the student is on
        lessonsRegion.append(continueCard(next, sorted.some((lesson) => lesson.status === "done")), ...[...levels].map(([n, items]) =>
          el("details", { class: "level", open: items.includes(current) },
            el("summary", { class: "level__head", i18n: "subjects.level", vars: { n } }),
            el("ul", { class: "files", role: "list" }, items.map(lessonRow)))));
      },
    });
  }

  withState($("#subjects"), {
    load: getSubjects,
    skeleton: "cards",
    emptyKey: "subjects.empty",
    render(subjects, region) {
      const selected = subjects.find((s) => s.id === (param("subject") || getStore("subject"))) ?? subjects[0];
      const cards = subjects.map((subject) => subjectCard(subject, subject === selected, () => select(subject)));
      function select(subject) {
        cards.forEach((card, i) => card.setAttribute("aria-pressed", String(subjects[i] === subject)));
        const url = new URL(window.location.href);
        url.searchParams.set("subject", subject.id);
        window.history.replaceState(null, "", url);
        showLessons(subject);
      }
      region.append(el("ul", { class: "subject-grid", role: "list" }, cards.map((card) => el("li", {}, card))));
      showLessons(selected);
    },
  });
}
