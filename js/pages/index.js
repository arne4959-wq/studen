import { initPage } from "../shell.js";
import { getToken } from "../store.js";
import { loadFile } from "../api.js";
import { getLang, setLang } from "../i18n.js";
import { $, el, errorBox, themeSwitch, toast } from "../ui.js";

if (await initPage({ auth: false, shell: false })) {
  if (getToken()) {
    window.location.replace("subjects.html");
  } else {
    $("#welcome-theme").append(themeSwitch());
    const language = $("#welcome-language");
    language.value = getLang();
    language.addEventListener("change", async () => {
      try {
        await setLang(language.value);
      } catch (error) {
        language.value = getLang();
        console.error("Unable to change the language.", error);
        toast("errors.network_error");
      }
    });
    try {
      const [summaries, lessons, subjects] = await Promise.all([
        loadFile("data/summaries.json"),
        loadFile("data/lessons.json"),
        loadFile("data/subjects.json"),
      ]);
      const sample = summaries.v01;
      const lessonCount = Object.values(lessons).reduce((sum, items) => sum + items.length, 0);
      $("#welcome-counts").append(
        el("span", { i18n: "welcome.courses", vars: { n: subjects.length } }),
        " · ",
        el("span", { i18n: "welcome.lessons", vars: { n: lessonCount } }),
      );
      $("#welcome-preview-heading").textContent = sample.title;
      $("#welcome-preview-intro").textContent = sample.intro;
      $("#welcome-preview-points").replaceChildren(...sample.keyPoints.slice(0, 4).map((point) => el("li", { text: point })));
      $("#welcome-figure").append(
        el("img", { class: "shot__img", src: sample.image.src, alt: sample.image.alt, width: 960, height: 540 }),
        el("figcaption", { class: "shot__caption", text: sample.image.caption }),
      );
    } catch (error) {
      $("#welcome-preview-points").replaceWith(errorBox(error));
    }
  }
}
