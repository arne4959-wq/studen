// Tiny test runner shared by tests/*.html (developer tooling; not user-facing, so not translated).
const cases = [];

export function test(name, fn) {
  cases.push({ name, fn });
}

export function assert(condition, message = "assertion failed") {
  if (!condition) throw new Error(message);
}

export async function rejects(promise, check) {
  let error;
  try {
    await promise;
  } catch (caught) {
    error = caught;
  }
  if (!error) throw new Error("expected the promise to reject");
  check(error);
}

const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

export function line(passed, text) {
  const item = node("li", "test");
  item.append(node("span", `tag tag--${passed ? "pass" : "fail"}`, passed ? "PASS" : "FAIL"), node("span", "", text));
  document.getElementById("results").append(item);
}

export async function run() {
  const summary = document.getElementById("summary");
  let passed = 0;
  const failures = [];
  for (const { name, fn } of cases) {
    summary.textContent = `running: ${name}`;
    try {
      await fn();
      passed += 1;
      line(true, name);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      line(false, `${name} — ${error.message}`);
    }
  }
  summary.textContent = `${passed} passed, ${failures.length} failed, ${cases.length} total`;
  document.documentElement.dataset.result = failures.length ? "fail" : "pass";
  window.testResult = { passed, failed: failures.length, failures };
  return window.testResult;
}

/** Loads a site page in an iframe of the given width and resolves once it has rendered. */
export function frame(url, { width = 390, height = 760, settle = true } = {}) {
  return new Promise((resolve) => {
    const iframe = node("iframe");
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.src = url;
    document.getElementById("frames").append(iframe);
    const started = Date.now();
    let lastHref = "";
    let stableSince = 0;
    const poll = setInterval(() => {
      const doc = iframe.contentDocument;
      const href = iframe.contentWindow?.location.href ?? "";
      const ready = doc?.readyState === "complete" && doc.documentElement.dataset.langReady &&
        (!settle || !doc.querySelector('[aria-busy="true"]:not(.btn)'));
      if (href !== lastHref || !ready) {
        lastHref = href;
        stableSince = Date.now();
      }
      if ((ready && Date.now() - stableSince > 250) || Date.now() - started > 9000) {
        clearInterval(poll);
        resolve({ iframe, doc, win: iframe.contentWindow, timedOut: !ready, remove: () => iframe.remove() });
      }
    }, 50);
  });
}

// Run storage-mutating tests without destroying the developer's own state.
export function snapshotStorage() {
  const local = { ...window.localStorage };
  const session = { ...window.sessionStorage };
  return () => {
    window.localStorage.clear();
    Object.entries(local).forEach(([k, v]) => window.localStorage.setItem(k, v));
    window.sessionStorage.clear();
    Object.entries(session).forEach(([k, v]) => window.sessionStorage.setItem(k, v));
  };
}
