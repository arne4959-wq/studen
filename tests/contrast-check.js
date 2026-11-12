import { test, assert, run, line } from "./harness.js";

// [foreground, background, minimum, where it is used]
const TEXT = 4.5;
const UI = 3;
const PAIRS = [
  ["--text", "--bg", TEXT, "body text"],
  ["--text", "--panel", TEXT, "cards, nav, inputs"],
  ["--text", "--hover", TEXT, "hovered rows"],
  ["--muted", "--bg", TEXT, "secondary text"],
  ["--muted", "--panel", TEXT, "secondary text on cards"],
  ["--muted", "--skeleton", TEXT, "disabled button label"],
  ["--green", "--bg", TEXT, "prompt, success text"],
  ["--green", "--panel", TEXT, "active nav (mobile), scores"],
  ["--green", "--green-bg", TEXT, "active nav (desktop), + diff, success alert"],
  ["--muted", "--green-bg", TEXT, "diff label on + line"],
  ["--text", "--green-bg", TEXT, "selected choice / language"],
  ["--on-green", "--green", TEXT, "primary button, PASS, choice key"],
  ["--red", "--bg", TEXT, "errors, received"],
  ["--red", "--panel", TEXT, "logout outline button"],
  ["--red", "--red-bg", TEXT, "ERROR box title, - diff"],
  ["--muted", "--red-bg", TEXT, "diff label on - line, error code"],
  ["--text", "--red-bg", TEXT, "error message body"],
  ["--on-red", "--red", TEXT, "danger button, FAIL"],
  ["--blue", "--bg", TEXT, "links"],
  ["--blue", "--panel", TEXT, "links on cards"],
  ["--purple", "--bg", TEXT, "code sample"],
  ["--purple", "--panel", TEXT, "// reason title"],
  ["--yellow", "--panel", TEXT, "running status, commit hash"],
  ["--yellow", "--bg", TEXT, "quiz lock message"],
  ["--bg", "--text", TEXT, "toast, pressed chip"],
  ["--heat-fg-1", "--heat-1", TEXT, "heatmap level 1 count"],
  ["--heat-fg-2", "--heat-2", TEXT, "heatmap level 2 count"],
  ["--heat-fg-3", "--heat-3", TEXT, "heatmap level 3 count"],
  ["--heat-fg-4", "--heat-4", TEXT, "heatmap level 4 count"],
  ["--field-line", "--bg", UI, "input / choice borders"],
  ["--field-line", "--panel", UI, "secondary button / choice borders"],
  ["--focus", "--bg", UI, "focus ring"],
  ["--focus", "--panel", UI, "focus ring on cards"],
  ["--red", "--bg", UI, "invalid input border"],
  ["--green", "--panel", UI, "selected card / choice border"],
  ["--text", "--bg", UI, "switch thumb, today outline"],
];

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const m = hex.trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) throw new Error(`not a #rrggbb color: "${hex}"`);
  const [r, g, b] = m.slice(1).map((h) => channel(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
const ratio = (a, b) => contrast(luminance(a), luminance(b));

test("self-check: luminance 0 vs 1 = 21:1, channel(255) = 1", () =>
  assert(Math.abs(contrast(0, 1) - 21) < 1e-9 && channel(255) === 1 && channel(0) === 0));

const root = document.documentElement;
const original = root.dataset.theme;
for (const theme of ["dark", "light"]) {
  test(`${theme}: ${PAIRS.length} pairs`, () => {
    root.dataset.theme = theme;
    const style = getComputedStyle(root);
    const failures = [];
    for (const [fg, bg, min, use] of PAIRS) {
      const value = ratio(style.getPropertyValue(fg), style.getPropertyValue(bg));
      const ok = value >= min;
      line(ok, `${theme}  ${fg} on ${bg}  ${value.toFixed(2)}:1 (min ${min})  — ${use}`);
      if (!ok) failures.push(`${fg}/${bg} ${value.toFixed(2)}`);
    }
    assert(!failures.length, `failing pairs: ${failures.join(", ")}`);
  });
}

await run();
root.dataset.theme = original;
