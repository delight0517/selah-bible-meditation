const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "computer-reading-handoff.js"), "utf8");

function openFrom(query, request) {
  const classes = new Set();
  const noopElement = {
    hidden: false,
    value: "windows",
    textContent: "",
    disabled: false,
    addEventListener() {},
    setAttribute() {}
  };
  const document = {
    body: { classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name)
    } },
    visibilityState: "visible",
    getElementById: () => ({ ...noopElement }),
    addEventListener() {}
  };
  const db = { language: "en", computerReadingRequest: request || null };
  const sandbox = {
    URLSearchParams,
    location: { search: query },
    navigator: { platform: "Win32", maxTouchPoints: 0 },
    document,
    db,
    preferredLocale: () => "en",
    mergeSharedProgress() {},
    request: async () => ({}),
    localStorage: { getItem: () => null, setItem() {} },
    token: "",
    accountId: "",
    syncQueue: Promise.resolve(),
    sync: async () => {},
    persist() {},
    scheduleSync() {},
    currentPassage: () => ({ ref: "John 1:1" }),
    setReaderFocus(active) {
      if (active) classes.add("mobile-reading-focus");
      else classes.delete("mobile-reading-focus");
    },
    crypto: { randomUUID: () => "generated-session" },
    setInterval: () => 1,
    clearInterval() {},
    console
  };
  vm.runInNewContext(source, sandbox, { filename: "computer-reading-handoff.js" });
  return db.computerReadingSession?.id;
}

const now = Date.now();
const sharedRequest = {
  id: "request-1",
  sessionId: "shared-session",
  targetPlatform: "windows",
  createdAt: now - 1000
};

assert.equal(
  openFrom("?windowsShell=1&homeAction=read&requestId=request-1&sessionId=url-session", sharedRequest),
  "shared-session",
  "a matching current request supplies its shared session ID"
);

for (const [name, invalidRequest] of [
  ["missing request", null],
  ["wrong target", { ...sharedRequest, targetPlatform: "macOS" }],
  ["expired request", { ...sharedRequest, createdAt: now - 120001 }],
  ["future request", { ...sharedRequest, createdAt: now + 1 }],
  ["missing timestamp", { id: "request-1", sessionId: "shared-session", targetPlatform: "windows" }]
]) {
  assert.notEqual(
    openFrom("?windowsShell=1&homeAction=read&requestId=request-1&sessionId=url-session", invalidRequest),
    "url-session",
    `${name} must not fall back to the URL session ID`
  );
}

assert.equal(
  openFrom("?windowsShell=1&homeAction=read&sessionId=legacy-session", null),
  "legacy-session",
  "legacy session-only links remain supported when no request ID is supplied"
);

console.log("PASS: Selah reading handoff target, age, timestamp, and legacy-link scenarios");
