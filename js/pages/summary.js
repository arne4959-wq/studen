import { initPage } from "../shell.js";
import { getSummary } from "../api.js";
import { $, el, cmd, enc, param, setText, renderState, withState } from "../ui.js";

const quizLink = (id) => cmd("a", "summary.runQuiz", { class: "btn btn--primary", href: `quiz.html?lesson=${enc(id)}` });
// bookRef may be 3, "3A" or "Unit 3"; show only the unit part so the label never reads "Unit Unit 3".
const bookUnit = (ref) => String(ref ?? "").trim().replace(/^unit\s*/i, "");
const codeBar = (key) =>
  el("figcaption", { class: "code__bar" }, el("span", { class: "code__dots", "aria-hidden": "true", text: "●●●" }), el("span", { i18n: key }));
// Optional lesson extras: stories to picture, tasks to try (the answer stays folded until asked for), an open prompt.
const extra = (key, ...children) => el("section", { class: "extra" }, el("h2", { class: "extra__title", i18n: key }), ...children);

if (await initPage({ nav: "subjects" })) {
  const region = $("#summary");
  const lessonId = param("lesson");

  if (!lessonId) {
    renderState(region, "empty", { emptyKey: "summary.missing" });
  } else {
    withState(region, {
      load: () => getSummary(lessonId),
      skeleton: "text",
      isEmpty: (s) => !s.intro && !s.keyPoints?.length && !s.table?.length && !s.codeSample,
      emptyKey: "summary.empty",
      emptyAction: () => quizLink(lessonId),
      render(s) {
        setText($("title"), "title.lesson", { title: s.title });
        region.append(...[ // parts a lesson may lack are false/undefined: drop them, append() would print them as text
          el("header", { class: "page-head" },
            s.order ? el("p", { class: "eyebrow", i18n: "subjects.lessonNo", vars: { n: s.order } }) : el("p", { class: "eyebrow", translate: "no", text: s.id }),
            el("h1", { text: s.title }),
            el("p", { class: "summary__meta", i18n: "summary.readTime", vars: { n: s.readMinutes } }),
            bookUnit(s.bookRef) && el("p", { class: "summary__book", i18n: "summary.bookRef", vars: { unit: bookUnit(s.bookRef) } })),
          s.image?.src &&
            el("figure", { class: "shot" },
              el("img", { class: "shot__img", src: s.image.src, alt: s.image.alt ?? "", width: 420, height: 236 }),
              s.image.caption && el("figcaption", { class: "shot__caption", text: s.image.caption })),
          s.intro && el("p", { class: "summary__intro", text: s.intro }),
          s.keyPoints?.length > 0 &&
            el("figure", { class: "code" }, codeBar("summary.keyPoints"),
              el("ol", { class: "code__lines" }, s.keyPoints.map((point) => el("li", { class: "code__line", text: point })))),
          s.codeSample &&
            el("figure", { class: "code" }, codeBar("summary.example"),
              el("pre", { class: "code__pre", translate: "no" }, el("code", { text: s.codeSample }))),
          s.table?.length > 0 &&
            el("div", { class: "table-wrap" },
              el("table", { class: "table" },
                el("caption", { i18n: "summary.tableCaption" }),
                el("thead", {}, el("tr", {}, ...[s.tableHeaders?.[0], s.tableHeaders?.[1]].map((text, i) => // optional per-lesson headers; default labels suit "form → changed form" tables
                  el("th", { scope: "col", ...(text ? { text } : { i18n: i ? "summary.to" : "summary.from" }) })))),
                el("tbody", {}, s.table.map((row) => el("tr", {}, el("td", { text: row.from }), el("td", { text: row.to })))))),
          s.photos?.length > 0 &&
            extra("summary.photos", el("div", { class: "photos" }, s.photos.map((photo) =>
              el("figure", { class: photo.width > photo.height * 2.5 ? "shot shot--wide" : "shot" }, // a wide strip keeps the full row so it stays readable
                el("img", { class: "shot__img", src: photo.src, alt: photo.alt ?? "", width: photo.width, height: photo.height, loading: "lazy" }),
                el("figcaption", { class: "shot__caption" },
                  photo.caption && el("p", { text: photo.caption }),
                  photo.credit && el("p", { class: "shot__credit" }, // licence credit; the link is followed only when it is plain https
                    /^https:\/\//.test(photo.source ?? "") ? el("a", { href: photo.source, target: "_blank", rel: "noopener noreferrer", text: photo.credit }) : photo.credit)))))),
          s.examples?.length > 0 &&
            extra("summary.examples", s.examples.map((example) =>
              el("article", { class: "example" },
                el("h3", { text: example.title }),
                example.story && el("p", { text: example.story }),
                example.lines?.length > 0 && el("ul", { class: "example__lines" }, example.lines.map((line) => el("li", { text: line })))))),
          s.tryIt?.length > 0 &&
            extra("summary.tryIt", el("p", { class: "extra__hint", i18n: "summary.tryHint" }),
              el("ol", { class: "tries" }, s.tryIt.map((item) =>
                el("li", { class: "try" },
                  el("p", { text: item.task }),
                  el("details", { class: "try__answer" }, el("summary", { i18n: "summary.showAnswer" }), el("p", { text: item.answer })))))),
          s.idea && extra("summary.idea", el("p", { class: "idea", text: s.idea })),
          el("p", { class: "eyebrow", i18n: "summary.ready" }),
          el("div", { class: "actions" }, quizLink(s.id)),
        ].filter(Boolean));
      },
    });
  }
}
