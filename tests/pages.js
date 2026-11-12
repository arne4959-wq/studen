// Pages exercised by the rendered checks. auth=false pages are loaded signed-out.
export const PAGES = [
  { url: "login.html", auth: false },
  { url: "register.html", auth: false },
  { url: "forgot.html", auth: false },
  { url: "404.html", auth: false },
  { url: "styleguide.html", auth: false },
  { url: "subjects.html", auth: true },
  { url: "summary.html?lesson=g10", auth: true },
  { url: "summary.html?lesson=r08", auth: true }, // a lesson with real photos and licence credits
  { url: "quiz.html?lesson=g10", auth: true },
  { url: "quiz.html?lesson=no_such_lesson", auth: true },
  { url: "score.html?lesson=g10", auth: true },
  { url: "score.html", auth: true },
  { url: "review.html?lesson=g10", auth: true },
  { url: "stats.html", auth: true },
  { url: "profile.html", auth: true },
  { url: "language.html", auth: true },
  { url: "change-password.html", auth: true },
];

export const withMode = (url, mode) => (mode ? `${url}${url.includes("?") ? "&" : "?"}mock=${mode}` : url);
