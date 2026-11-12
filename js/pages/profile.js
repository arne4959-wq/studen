import { initPage } from "../shell.js";
import { getMe, getDashboard, logout } from "../api.js";
import { clearSession } from "../store.js";
import { getLang } from "../i18n.js";
import { $, el, setText, withState, statCard, themeSwitch, confirmDialog } from "../ui.js";

if (await initPage({ nav: "profile" })) {
  const region = $("#profile");
  setText($("#lang-value"), `lang.${getLang()}`);
  $("#theme-slot").append(themeSwitch("theme-label"));

  withState(region, {
    load: () => Promise.all([getMe(), getDashboard()]),
    skeleton: "profile",
    isEmpty: ([me]) => !me,
    render([me, d]) {
      const name = me.username || me.email || "?";
      region.append(
        el("div", { class: "profile__head" },
          el("span", { class: "avatar", "aria-hidden": "true", translate: "no", text: [...name.trim()][0]?.toUpperCase() ?? "?" }),
          el("div", { class: "profile__who" },
            el("p", { class: "profile__name", text: me.username }),
            el("p", { class: "profile__email", translate: "no", text: me.email }))),
        el("ul", { class: "stat-cards", role: "list" },
          statCard("stats.lessons", `${d.lessonsDone}/${d.lessonsTotal}`),
          statCard("stats.avgScore", `${d.avgScore}%`),
          statCard("stats.quizzes", String(d.quizzesTaken))),
      );
    },
  });

  $("#logout").addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "profile.logoutTitle", message: "profile.logoutMessage", confirm: "profile.logoutConfirm", danger: true });
    if (!ok) return;
    try {
      await logout();
    } catch {
      /* the local session is cleared regardless */
    }
    clearSession();
    window.location.replace("login.html");
  });
}
