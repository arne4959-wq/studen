// DOM helpers and shared components. Data is only ever inserted with textContent / text nodes.
import { t, translateNode } from "./i18n.js";
import { getTheme, toggleTheme } from "./theme.js";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const $ = (selector, root = document) => root.querySelector(selector);
export const param = (name) => new URLSearchParams(window.location.search).get(name) ?? "";
export const enc = encodeURIComponent;

/**
 * el("a", { class, text, i18n, vars, i18nAttr: { "aria-label": key }, onClick, ...attrs }, ...children)
 * `text` and string children become text nodes, so API/user data can never become markup.
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false || key === "vars") continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "i18n") node.dataset.i18n = value;
    else if (key === "i18nAttr") node.dataset.i18nAttr = Object.entries(value).map((pair) => pair.join(":")).join(",");
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  if (props.vars) node.dataset.i18nVars = JSON.stringify(props.vars);
  translateNode(node);
  node.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

export function setText(node, key, vars) {
  node.dataset.i18n = key;
  if (vars) node.dataset.i18nVars = JSON.stringify(vars);
  else delete node.dataset.i18nVars;
  translateNode(node);
}

// Command-style control: "$ login" where "$" is decorative (aria-hidden).
export function cmd(tag, key, props = {}, prompt = "$") {
  return el(
    tag,
    { ...(tag === "button" ? { type: "button" } : {}), ...props },
    prompt && el("span", { class: "btn__prompt", "aria-hidden": "true", text: prompt }),
    el("span", { class: "btn__label", i18n: key }),
  );
}

export function setBusy(button, busy) {
  button.setAttribute("aria-busy", String(busy));
  if (busy) button.setAttribute("aria-disabled", "true");
  else button.removeAttribute("aria-disabled");
}

export const isLocked = (button) => button.getAttribute("aria-disabled") === "true";

export function errorKey(error) {
  const key = `errors.${error?.code}`;
  return t(key) === key ? "errors.unknown" : key;
}

/* ---------------- messages & forms ---------------- */

// slot: an element with aria-live="polite". Errors are inserted as role="alert".
export function setMessage(slot, key, type = "error", vars) {
  if (!key) return slot.replaceChildren();
  const isError = type === "error";
  return slot.replaceChildren(
    el(
      "div",
      { class: `alert alert--${type}`, role: isError ? "alert" : null },
      el(
        "p",
        { class: "alert__title" },
        el("span", { "aria-hidden": "true", text: isError ? "✗ " : "✓ " }),
        el("span", { i18n: isError ? "state.errorTitle" : key, vars: isError ? null : vars }),
      ),
      isError && el("p", { i18n: key, vars }),
    ),
  );
}

export function setFieldError(input, key) {
  input.setAttribute("aria-invalid", "true");
  const message = document.getElementById(`${input.id}-error`);
  if (message) {
    setText(message, key);
    message.hidden = false;
  }
}

export function clearFieldError(input) {
  input.removeAttribute("aria-invalid");
  const message = input.id && document.getElementById(`${input.id}-error`);
  if (message) {
    message.hidden = true;
    message.textContent = "";
    delete message.dataset.i18n;
  }
}

// checks: [[input, (value) => errorKey | null], ...]; focuses the first invalid field.
export function validate(checks) {
  checks.forEach(([input]) => clearFieldError(input));
  const failed = checks.map(([input, check]) => [input, check(input.value)]).filter(([, key]) => key);
  failed.forEach(([input, key]) => setFieldError(input, key));
  failed[0]?.[0].focus();
  return failed.length === 0;
}

export function watchFields(form) {
  form.addEventListener("input", (event) => event.target.matches("input") && clearFieldError(event.target));
}

export const rules = {
  email: (v) => (!v.trim() ? "validation.emailRequired" : EMAIL_RE.test(v.trim()) ? null : "validation.email"),
  password: (v) => (!v ? "validation.passwordRequired" : v.length < 8 ? "validation.passwordMin" : null),
  required: (key) => (v) => (v.trim() ? null : key),
};

/* ---------------- loading / error / empty ---------------- */

const SKELETONS = {
  list: ["row", "row", "row", "row", "row"],
  cards: ["card", "card", "card"],
  text: ["title", "line-short", "line", "line", "block", "block"],
  quiz: ["line-short", "title", "row", "row", "row", "row"],
  stats: ["cards", "block", "row", "row", "row"],
  profile: ["avatar", "line", "line-short", "cards"],
};

export function emptyBox(key = "state.emptyMessage", action = null) {
  return el(
    "div",
    { class: "state", role: "status" },
    el("p", { class: "state__title" }, el("span", { "aria-hidden": "true", text: "∅ " }), el("span", { i18n: "state.emptyTitle" })),
    el("p", { class: "state__msg", i18n: key }),
    action,
  );
}

export function errorBox(error, onRetry) {
  return el(
    "div",
    { class: "state state--error", role: "alert" },
    el("p", { class: "state__title" }, el("span", { "aria-hidden": "true", text: "✗ " }), el("span", { i18n: "state.errorTitle" })),
    onRetry && el("p", { class: "state__lead", i18n: "state.loadFailed" }),
    el("p", { class: "state__msg", i18n: errorKey(error) }),
    el("p", { class: "state__code", translate: "no", i18n: "state.errorCode", vars: { status: error?.status ?? 0, code: error?.code ?? "unknown" } }),
    onRetry && cmd("button", "common.retry", { class: "btn btn--secondary", onClick: onRetry }),
  );
}

export function renderState(region, state, { skeleton = "list", error, onRetry, emptyKey, emptyAction } = {}) {
  region.setAttribute("aria-busy", String(state === "loading"));
  if (state === "loading") {
    region.replaceChildren(
      el("p", { class: "sr-only", role: "status", i18n: "state.loading" }),
      el("div", { class: `skeletons skeletons--${skeleton}`, "aria-hidden": "true" },
        (SKELETONS[skeleton] ?? SKELETONS.list).map((kind) => el("span", { class: `skeleton skeleton--${kind}` }))),
    );
  } else if (state === "error") {
    region.replaceChildren(errorBox(error, onRetry));
  } else {
    region.replaceChildren(emptyBox(emptyKey, emptyAction));
  }
}

/**
 * Runs load() with skeleton → render | empty | error(+retry). Stale responses (a newer call
 * started on the same region) are dropped. 401 is ignored here: api.js already redirected.
 */
export function withState(region, { load, render, isEmpty = (data) => Array.isArray(data) && !data.length, skeleton, emptyKey, emptyAction }) {
  const run = async () => {
    const ticket = (region.stateTicket = (region.stateTicket ?? 0) + 1);
    renderState(region, "loading", { skeleton });
    let data;
    try {
      data = await load();
    } catch (error) {
      if (ticket !== region.stateTicket || error?.status === 401) return null;
      const retry = () => {
        region.setAttribute("tabindex", "-1");
        region.focus({ preventScroll: true });
        run();
      };
      renderState(region, "error", { error, onRetry: retry });
      return null;
    }
    if (ticket !== region.stateTicket) return null;
    if (isEmpty(data)) {
      renderState(region, "empty", { emptyKey, emptyAction: emptyAction?.() });
      return data;
    }
    region.setAttribute("aria-busy", "false");
    region.replaceChildren();
    render(data, region);
    return data;
  };
  return run();
}

/* ---------------- toast & dialog ---------------- */

export function ensureToastRegion() {
  return $(".toast-region") ?? document.body.appendChild(el("div", { class: "toast-region", role: "status", "aria-live": "polite" }));
}

export function toast(key, vars) {
  const item = el("p", { class: "toast", i18n: key, vars });
  ensureToastRegion().append(item);
  setTimeout(() => item.remove(), 4000);
}

/** Modal confirm (bottom sheet on mobile). Esc / backdrop / cancel → false. Focus is trapped and restored. */
export function confirmDialog({ title, message, confirm = "common.confirm", cancel = "common.cancel", danger = false }) {
  return new Promise((resolve) => {
    const opener = document.activeElement;
    const titleId = uid("dlg-title");
    const messageId = uid("dlg-msg");
    const cancelButton = el("button", { type: "button", class: "btn btn--secondary", i18n: cancel, onClick: () => dialog.close("cancel") });
    const okButton = el("button", { type: "button", class: `btn ${danger ? "btn--danger" : "btn--primary"}`, i18n: confirm, onClick: () => dialog.close("ok") });
    const dialog = el(
      "dialog",
      { class: "sheet", "aria-labelledby": titleId, "aria-describedby": messageId },
      el("div", { class: "sheet__body" },
        el("h2", { class: "sheet__title", id: titleId, i18n: title }),
        el("p", { id: messageId, i18n: message }),
        el("div", { class: "sheet__actions" }, cancelButton, okButton)),
    );
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const first = cancelButton;
      const last = okButton;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("click", (event) => event.target === dialog && dialog.close("cancel"));
    dialog.addEventListener("close", () => {
      dialog.remove();
      opener?.focus?.();
      resolve(dialog.returnValue === "ok");
    });
    document.body.append(dialog);
    dialog.showModal();
    (danger ? cancelButton : okButton).focus();
  });
}

let uidCounter = 0;
export const uid = (prefix = "id") => `${prefix}-${++uidCounter}`;

/* ---------------- shared components ---------------- */

export function themeSwitch(labelledBy) {
  return el(
    "button",
    {
      type: "button",
      class: "theme-switch",
      role: "switch",
      "aria-checked": String(getTheme() === "dark"),
      "aria-labelledby": labelledBy,
      i18nAttr: labelledBy ? null : { "aria-label": "theme.dark" },
      "data-theme-switch": "",
      onClick: toggleTheme,
    },
    el("span", { class: "theme-switch__track", "aria-hidden": "true" },
      el("span", { class: "theme-switch__icon", text: "☾" }),
      el("span", { class: "theme-switch__icon", text: "☀" }),
      el("span", { class: "theme-switch__thumb" })),
  );
}

export function textBar(done, total, width = 8) {
  const filled = total > 0 ? Math.min(width, Math.max(0, Math.round((done / total) * width))) : 0;
  return el("span", { class: "bar", "aria-hidden": "true" },
    el("span", { class: "bar__fill", text: "█".repeat(filled) }),
    el("span", { class: "bar__rest", text: "░".repeat(width - filled) }));
}

export const passFailTag = (correct) => el("span", { class: `tag tag--${correct ? "pass" : "fail"}`, i18n: correct ? "score.pass" : "score.fail" });

export function subjectCard(subject, pressed, onClick) {
  return el(
    "button",
    { type: "button", class: "subject-card", "aria-pressed": String(pressed), onClick },
    el("span", { class: "subject-card__name", text: subject.name }),
    el("span", { class: "subject-card__meta" },
      textBar(subject.doneCount, subject.lessonCount),
      el("span", { class: "subject-card__count", i18n: "subjects.progress", vars: { done: subject.doneCount, total: subject.lessonCount } })),
  );
}

const GLYPH = { done: "✓", running: "●", todo: "○" };

export function lessonRow(lesson) {
  const status = GLYPH[lesson.status] ? lesson.status : "todo";
  const hasScore = lesson.score !== undefined && lesson.score !== null;
  return el(
    "li",
    { class: "file" },
    el(
      "a",
      { class: `file__link file--${status}`, href: `summary.html?lesson=${enc(lesson.id)}` },
      el("span", { class: "file__glyph", "aria-hidden": "true", text: GLYPH[status] }),
      el("span", { class: "file__main" },
        el("span", { class: "file__name", i18n: "subjects.lessonNo", vars: { n: lesson.order } }),
        el("span", { class: "file__title", text: lesson.title })),
      el("span", { class: "file__meta" },
        el("span", { class: "file__status", i18n: `status.${status}` }),
        hasScore && el("span", { class: "file__score", i18n: "subjects.score", vars: { score: lesson.score, total: lesson.total } })),
    ),
  );
}

export function choiceButton(choice, index, pressed, onClick) {
  return el(
    "button",
    { type: "button", class: "choice", "aria-pressed": String(pressed), "data-choice": choice.id, onClick },
    el("span", { class: "choice__key", translate: "no", text: "ABCD"[index] ?? String(index + 1) }),
    el("span", { class: "choice__label", text: choice.label }),
    el("span", { class: "choice__mark", "aria-hidden": "true", text: "✓" }),
  );
}

export function diffBox(yours, correct, isCorrect) {
  const line = (kind, sign, text, labelKey) =>
    el("p", { class: `diff__line diff__line--${kind}` },
      el("span", { class: "diff__sign", "aria-hidden": "true", text: sign }),
      text === null ? el("span", { class: "diff__text", i18n: "review.noAnswer" }) : el("span", { class: "diff__text", text }),
      el("span", { class: "diff__label", i18n: labelKey }));
  return el("div", { class: "diff" },
    isCorrect ? line("add", "+", correct, "review.yoursCorrect") : [line("del", "-", yours, "review.yours"), line("add", "+", correct, "review.correct")]);
}

export const reasonBox = (explanation) =>
  el("div", { class: "reason" }, el("p", { class: "reason__title", i18n: "review.reason" }), el("p", { text: explanation }));

export const statCard = (labelKey, value) =>
  el("li", { class: "stat" }, el("span", { class: "stat__value", text: value }), el("span", { class: "stat__label", i18n: labelKey }));

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const level = (count) => (count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4);

/** 4 calendar weeks (Mon→Sun rows), last row contains today. Counts are printed so color is not the only cue. */
export function heatmap(activity, now = new Date()) {
  const counts = new Map(activity.map((item) => [item.date, item.count]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 21);
  let total = 0;
  let activeDays = 0;
  const cells = [];
  for (let i = 0; i < 28; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const date = isoDate(day);
    const future = day > today;
    const count = future ? 0 : counts.get(date) ?? 0;
    total += count;
    if (count) activeDays += 1;
    cells.push(el("span", {
      class: `heat__cell${future ? " heat__cell--future" : ""}${day.getTime() === today.getTime() ? " heat__cell--today" : ""}`,
      "data-level": level(count),
      i18nAttr: future ? null : { title: "stats.cellTitle" },
      vars: future ? null : { date, count },
      text: count ? String(count) : "",
    }));
  }
  return el("div", { class: "heat" },
    el("div", { class: "heat__head", "aria-hidden": "true" }, DAYS.map((day) => el("span", { i18n: `stats.days.${day}` }))),
    el("div", { class: "heat__grid", role: "img", i18nAttr: { "aria-label": "stats.heatSummary" }, vars: { total, days: activeDays } }, cells),
    el("div", { class: "heat__legend", "aria-hidden": "true" },
      el("span", { i18n: "stats.less" }),
      [0, 1, 2, 3, 4].map((n) => el("span", { class: "heat__cell heat__cell--key", "data-level": n })),
      el("span", { i18n: "stats.more" }),
      el("span", { class: "heat__cell heat__cell--key heat__cell--today", "data-level": 0 }),
      el("span", { i18n: "stats.today" })));
}

function shortHash(text) {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, "0").slice(0, 7);
}

export function logList(items) {
  return el("ol", { class: "log", role: "list" }, items.map((item, index) =>
    el("li", {}, el("a", { class: "log__link", href: `review.html?lesson=${enc(item.lessonId)}` },
      el("span", { class: "log__hash", translate: "no", "aria-hidden": "true", text: shortHash(`${item.lessonId}${item.date}${index}`) }),
      el("span", { class: "log__msg", text: item.lessonTitle }),
      el("span", { class: "log__score", i18n: "stats.logScore", vars: { score: item.score, total: item.total } }),
      el("time", { class: "log__date", datetime: item.date, text: item.date })))));
}
