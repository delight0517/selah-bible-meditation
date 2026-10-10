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
    setAttribute() {},
    closest() { return null; }
  };
  const document = {
    body: { classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name)
    } },
    visibilityState: "visible",
    hasFocus: () => true,
    getElementById: () => ({ ...noopElement }),
    addEventListener() {}
  };
  const db = { language: "en", computerReadingRequest: request || null };
  const sandbox = {
    URLSearchParams,
    location: { search: query },
    navigator: { platform: "Win32", maxTouchPoints: 0 },
    window: { SelahFocusSession: require("../assets/selah-focus-session.js"), addEventListener() {} },
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
    saveMeditationSession() {},
    activateSyncedMeditation() {},
    crypto: { randomUUID: () => "generated-session" },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
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

(async () => {
  const peer = "00000000-0000-4000-8000-000000000002";
  const client = "00000000-0000-4000-8000-000000000001";
  const remote = { _rev: 17, readingState: { chapter: 2 }, reflections: [{ id: "keep", text: "unchanged" }],
    readingPresence: { [peer]: { id: peer, source: "reader-foreground", status: "running", updatedAt: Date.now() } } };
  let sent;
  const context = vm.createContext({ Date, Promise, Object, Number, JSON, console,
    token: "fixture", accountId: "fixture-account", db: { readingState: { chapter: 4 } },
    presenceClientId: client, nativeApp: null, currentPlatform: "macOS", presenceActive: true,
    persist() {}, sync() { throw Error("Presence must not run full sync"); },
    originalRequest: async (_path, options) => {
      if (options?.method === "PUT") { sent = JSON.parse(options.body); return { rev: 18 }; }
      return { state: remote };
    }
  });
  const start = source.indexOf("  function publishReadingPresence() {");
  const end = source.indexOf("  function refreshReadingPresence() {", start);
  vm.runInContext("let presenceSyncQueue = Promise.resolve();" + source.slice(start, end) + "publishReadingPresence();", context);
  await vm.runInContext("presenceSyncQueue", context);
  assert.deepEqual(sent.readingState, remote.readingState);
  assert.deepEqual(sent.reflections, remote.reflections);
  assert.equal(sent._rev, 17);
  assert.equal(sent.readingPresence[peer].status, "running");
  assert.equal(sent.readingPresence[client].status, "running");
  assert.equal(context.db.readingState.chapter, 4);
  console.log("PASS presence-only heartbeat preserves local passage, remote notes and peer reader");
})().catch(error => { console.error(error); process.exitCode = 1; });
