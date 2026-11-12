import { login } from "../js/api.js";
import { setSession, removeStore } from "../js/store.js";
import { test, assert, run, frame, snapshotStorage } from "./harness.js";
import { PAGES, withMode } from "./pages.js";

const WIDTHS = [360, 390, 768, 1280];
const MODES = ["", "slow", "error", "empty"];

// Anything wider than the viewport, ignoring content inside its own horizontal scroller and sr-only text.
function overflow(doc) {
  const win = doc.defaultView;
  const width = doc.documentElement.clientWidth;
  const offenders = [];
  if (doc.documentElement.scrollWidth > width) offenders.push(`page scrollWidth ${doc.documentElement.scrollWidth} > ${width}`);
  for (const el of doc.body.querySelectorAll("*")) {
    if (el.closest(".sr-only, .table-wrap, dialog:not([open])")) continue;
    const box = el.getBoundingClientRect();
    if (box.width && box.right > width + 1 && win.getComputedStyle(el).position !== "fixed") {
      offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} right=${Math.round(box.right)}`);
    }
  }
  return offenders.slice(0, 5);
}

const restore = snapshotStorage();
for (const mode of MODES) {
  for (const width of WIDTHS) {
    test(`width ${width}${mode ? ` · ?mock=${mode}` : ""}`, async () => {
      const problems = [];
      for (const auth of [false, true]) {
        if (auth) setSession(await login({ email: "user@example.com", password: "password123" }));
        else removeStore("token");
        const group = PAGES.filter((p) => p.auth === auth);
        // slow: measure the skeleton while it is still loading
        const frames = await Promise.all(group.map((p) => frame(`../${withMode(p.url, mode)}`, { width, settle: mode !== "slow" })));
        frames.forEach((f, i) => {
          overflow(f.doc).forEach((o) => problems.push(`${group[i].url}: ${o}`));
          f.remove();
        });
      }
      assert(!problems.length, `\n${problems.join("\n")}`);
    });
  }
}

await run();
restore();
