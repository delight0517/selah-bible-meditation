(() => {
  "use strict";

  const fields = ["computerReadingRequest", "computerReadingResult", "computerReadingSession"];
  const messages = {
    ko: {
      target: "열 컴퓨터", open: "컴퓨터에서 읽기", login: "컴퓨터에서 읽으려면 BlueCloud에 연결하세요.",
      sending: "컴퓨터에 요청을 보내고 있어요…", waiting: "컴퓨터 응답을 기다리고 있어요…",
      opened: "Selah를 컴퓨터에서 열었어요.", expired: "요청 시간이 지나 열지 못했어요.",
      rejected: "컴퓨터에서 Selah를 열지 못했어요.", noResponse: "컴퓨터가 응답하지 않았어요. 연결을 확인하고 다시 요청해 주세요.",
      failed: "BlueCloud로 요청을 보내지 못했어요. 연결을 확인해 주세요."
    },
    en: {
      target: "Open on", open: "Read on computer", login: "Connect to BlueCloud to open Selah on a computer.",
      sending: "Sending the request…", waiting: "Waiting for the computer…", opened: "Selah opened on the computer.",
      expired: "The request expired before it could open.", rejected: "The computer could not open Selah.",
      noResponse: "The computer did not respond. Check its connection and try again.", failed: "Could not send the request to BlueCloud. Check your connection."
    },
    ja: {
      target: "開くコンピュータ", open: "コンピュータで読む", login: "コンピュータで開くにはBlueCloudに接続してください。",
      sending: "リクエストを送信中…", waiting: "コンピュータの応答を待っています…", opened: "コンピュータでSelahを開きました。",
      expired: "時間切れで開けませんでした。", rejected: "コンピュータでSelahを開けませんでした。",
      noResponse: "応答がありません。接続を確認してもう一度お試しください。", failed: "BlueCloudに送信できませんでした。接続を確認してください。"
    },
    "zh-CN": {
      target: "打开到", open: "在电脑上阅读", login: "连接 BlueCloud 后才能在电脑上打开 Selah。",
      sending: "正在发送请求…", waiting: "正在等待电脑响应…", opened: "已在电脑上打开 Selah。",
      expired: "请求已过期，无法打开。", rejected: "电脑无法打开 Selah。",
      noResponse: "电脑没有响应。请检查连接后重试。", failed: "无法向 BlueCloud 发送请求，请检查连接。"
    },
    "zh-TW": {
      target: "開啟到", open: "在電腦上閱讀", login: "連結 BlueCloud 後才能在電腦上開啟 Selah。",
      sending: "正在傳送要求…", waiting: "正在等候電腦回應…", opened: "已在電腦上開啟 Selah。",
      expired: "要求已逾時，無法開啟。", rejected: "電腦無法開啟 Selah。",
      noResponse: "電腦沒有回應。請檢查連線後重試。", failed: "無法向 BlueCloud 傳送要求，請檢查連線。"
    }
  };
  const text = (key) => {
    const locale = typeof preferredLocale === "function" ? preferredLocale() : (db.language || "en");
    return (messages[locale] || messages.en)[key] || messages.en[key];
  };
  const timestamp = (value, key) => {
    const number = Number(value?.[key]);
    return Number.isFinite(number) && number > 0 ? number : 0;
  };
  const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
  const readingIdle = window.SelahFocusSession;
  let focusIdleTimer = 0;
  const routeParams = new URLSearchParams(location.search);
  const handoffRequestId = routeParams.get("requestId") || routeParams.get("request");
  const isWindowsShell = routeParams.get("windowsShell") === "1";
  const platformName = navigator.platform || "";
  const isMac = /Mac|iPhone|iPad/.test(platformName);
  const currentPlatform = isWindowsShell || /Win/.test(platformName)
    ? "windows"
    : /^Mac/.test(platformName) && Number(navigator.maxTouchPoints || 0) <= 1 ? "macOS" : "";

  const presenceClientId = crypto.randomUUID();
  const nativeApp = window.Capacitor?.getPlatform?.() === "ios"
    ? window.Capacitor.Plugins?.App || window.Capacitor.registerPlugin?.("App") : null;
  let nativeIosActive = false;
  let presenceActive = false;
  let presenceHeartbeat = 0;
  let presenceSyncQueue = Promise.resolve();

  function isReaderForeground() {
    if (window.selahMacAppPresence) return !!window.selahMacAppPresence.active;
    if (nativeApp) return nativeIosActive;
    return document.visibilityState === "visible" && document.hasFocus();
  }
  function publishReadingPresence() {
    presenceActive = isReaderForeground();
    if (!token || !accountId) return;
    const now = Date.now(), sendingAccount = accountId, sendingToken = token;
    const entry = {
      id: presenceClientId, source: "reader-foreground",
      status: presenceActive ? "running" : "ended",
      platform: nativeApp ? "ios" : currentPlatform || "web",
      updatedAt: now, lastSeenAt: now, resumeGraceUntil: 0, activeMs: 0
    };
    db.readingPresence = { ...(db.readingPresence || {}), [presenceClientId]: entry };
    persist();
    // Presence must not pull/render another device's passage, notes or settings.
    presenceSyncQueue = presenceSyncQueue.then(async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (accountId !== sendingAccount || token !== sendingToken) return;
        const result = await originalRequest("/cloud-state/selah");
        if (accountId !== sendingAccount || token !== sendingToken) return;
        const remote = result.state || {}, merged = {};
        for (const [key, value] of Object.entries(remote.readingPresence || {})) {
          if (/^[0-9a-f-]{36}$/i.test(key) && value?.source === "reader-foreground"
              && Date.now() - Number(value.updatedAt) < 120000) merged[key] = value;
        }
        if (Number(merged[presenceClientId]?.updatedAt || 0) > entry.updatedAt) return;
        merged[presenceClientId] = entry;
        try {
          await originalRequest("/cloud-state/selah", {
            method: "PUT", body: JSON.stringify({ ...remote, readingPresence: merged })
          });
          return;
        } catch (error) {
          if (error.status !== 409 || attempt === 1) throw error;
        }
      }
    }).catch(error => console.error("[Selah presence]", error.message));
  }
  function refreshReadingPresence() {
    presenceActive = isReaderForeground();
    clearInterval(presenceHeartbeat);
    presenceHeartbeat = 0;
    publishReadingPresence();
    if (presenceActive || (!nativeApp && !window.selahMacAppPresence)) {
      presenceHeartbeat = setInterval(publishReadingPresence, 20000);
    }
  }
  document.addEventListener("visibilitychange", refreshReadingPresence);
  // Read focus after the event settles, including focus inside child frames.
  window.addEventListener("focus", () => setTimeout(refreshReadingPresence, 0));
  window.addEventListener("blur", () => setTimeout(refreshReadingPresence, 0));
  window.addEventListener("selah-mac-app-activity", refreshReadingPresence);
  if (nativeApp) {
    void (async () => {
      let revision = 0;
      await nativeApp.addListener("appStateChange", ({ isActive }) => {
        revision++;
        nativeIosActive = !!isActive;
        refreshReadingPresence();
      });
      const before = revision;
      const initial = await nativeApp.getState();
      if (before === revision) {
        nativeIosActive = !!initial.isActive;
        refreshReadingPresence();
      }
    })().catch(error => console.error("[Selah presence]", error));
  } else refreshReadingPresence();

  function linkedHandoffSessionId() {
    const request = db.computerReadingRequest;
    if (!handoffRequestId || !isRecord(request) || request.id !== handoffRequestId || request.targetPlatform !== currentPlatform) return "";
    const age = Date.now() - timestamp(request, "createdAt");
    if (age < 0 || age > 120000) return "";
    return typeof request.sessionId === "string" && request.sessionId ? request.sessionId : "";
  }

  function adoptLinkedHandoffSession() {
    if (!document.body.classList.contains("mobile-reading-focus")) return;
    const sessionId = linkedHandoffSessionId();
    if (!sessionId || db.computerReadingSession?.id === sessionId) return;
    const now = Date.now();
    db.computerReadingSession = {
      ...(isRecord(db.computerReadingSession) ? db.computerReadingSession : {}),
      id: sessionId,
      mode: "focus-reading",
      status: "running",
      ref: typeof currentPassage === "function" ? currentPassage().ref : "",
      updatedAt: now,
      lastSeenAt: now,
      resumeGraceUntil: 0
    };
    persist();
    scheduleSync();
    scheduleFocusIdleExpiry();
  }

  db.computerReadingRequest ??= null;
  db.computerReadingResult ??= null;
  db.computerReadingSession ??= null;

  function mergeComputerReadingState(remote) {
    if (!isRecord(remote)) return;
    const localRequest = db.computerReadingRequest;
    const remoteRequest = remote.computerReadingRequest;
    if (isRecord(remoteRequest)) {
      db.computerReadingRequest = handoffRequestId && remoteRequest.id === handoffRequestId
        ? remoteRequest
        : isRecord(localRequest) && timestamp(localRequest, "createdAt") > timestamp(remoteRequest, "createdAt")
        ? localRequest : remoteRequest;
    }

    const requestId = db.computerReadingRequest?.id;
    const localResult = db.computerReadingResult?.id === requestId ? db.computerReadingResult : null;
    const remoteResult = remote.computerReadingResult?.id === requestId ? remote.computerReadingResult : null;
    if (!localResult) db.computerReadingResult = remoteResult;
    else if (remoteResult && timestamp(remoteResult, "completedAt") >= timestamp(localResult, "completedAt")) db.computerReadingResult = remoteResult;
    else db.computerReadingResult = localResult;

    const localSession = db.computerReadingSession;
    const remoteSession = remote.computerReadingSession;
    if (isRecord(remoteSession) && (!isRecord(localSession) || timestamp(remoteSession, "updatedAt") > timestamp(localSession, "updatedAt"))) {
      db.computerReadingSession = remoteSession;
    }
    adoptLinkedHandoffSession();
  }

  const originalMergeSharedProgress = mergeSharedProgress;
  mergeSharedProgress = function (remote) {
    mergeComputerReadingState(remote);
    return originalMergeSharedProgress(remote);
  };

  const originalRequest = request;
  request = async function (path, options = {}) {
    if (path === "/cloud-state/selah" && String(options.method || "GET").toUpperCase() === "PUT" && options.body) {
      try {
        const body = typeof options.body === "string" ? JSON.parse(options.body) : { ...options.body };
        body.computerReadingRequest = db.computerReadingRequest || null;
        body.computerReadingResult = db.computerReadingResult || null;
        body.computerReadingSession = db.computerReadingSession || null;
        body.readingPresence = db.readingPresence || {};
        options = { ...options, body: JSON.stringify(body) };
      } catch (error) {
        console.error("[Selah computer reading] Could not add handoff fields to cloud payload", error);
      }
    }
    return originalRequest(path, options);
  };

  const button = document.getElementById("openComputerReading");
  const target = document.getElementById("computerReadingTarget");
  const status = document.getElementById("computerReadingStatus");
  const targetLabel = document.getElementById("computerReadingTargetLabel");
  if (!button || !target || !status) return;

  const savedTarget = localStorage.getItem("selah.computerReadingTarget");
  target.value = ["macOS", "windows"].includes(savedTarget) ? savedTarget : (isWindowsShell || !isMac ? "macOS" : "windows");
  target.setAttribute("aria-label", text("target"));
  if (targetLabel) targetLabel.textContent = text("target");
  target.addEventListener("change", () => localStorage.setItem("selah.computerReadingTarget", target.value));

  let computerReadingSendError = false;
  function renderStatus() {
    const signedIn = Boolean(token && accountId);
    const control = button.closest(".computer-reading-control");
    if (control) control.hidden = !signedIn;
    button.hidden = !signedIn;
    if (!signedIn) {
      status.hidden = true;
      status.textContent = "";
      return;
    }
    button.textContent = text("open");
    const current = db.computerReadingRequest;
    const result = db.computerReadingResult?.id === current?.id ? db.computerReadingResult : null;
    if (!current) {
      status.hidden = true;
      status.textContent = "";
      return;
    }
    status.hidden = false;
    if (computerReadingSendError) status.textContent = text("failed");
    else if (result?.status === "opened") status.textContent = text("opened");
    else if (result?.status === "expired" || Date.now() - timestamp(current, "createdAt") > 120000) status.textContent = text("expired");
    else if (result) status.textContent = text("rejected");
    else status.textContent = text("waiting");
  }

  async function pollResult() {
    const current = db.computerReadingRequest;
    if (!token || !accountId || !isRecord(current) || db.computerReadingResult?.id === current.id) return;
    try {
      const latest = (await originalRequest("/cloud-state/selah")).state;
      const remoteRevision = Number(latest?._rev);
      if (Number.isInteger(remoteRevision) && remoteRevision >= 0) db._rev = remoteRevision;
      const previousRequestId = db.computerReadingRequest?.id;
      mergeComputerReadingState(latest);
      if (db.computerReadingRequest?.id !== previousRequestId || db.computerReadingResult?.id === db.computerReadingRequest?.id) {
        persist();
        renderStatus();
      }
    } catch {
      // The next poll or the ordinary account sync will retry without interrupting reading.
    }
  }

  button.addEventListener("click", async () => {
    if (!token || !accountId) {
      status.hidden = false;
      status.textContent = text("login");
      document.getElementById("accountBtn")?.click();
      return;
    }
    const now = Date.now();
    const session = db.computerReadingSession;
    const activeSession = isRecord(session) && (readingIdle
      ? readingIdle.isActive(session, now)
      : (session.status === "running" && now - timestamp(session, "lastSeenAt") < 600000) ||
        (session.status === "paused" && timestamp(session, "resumeGraceUntil") > now));
    const nextRequest = {
      id: crypto.randomUUID(),
      sessionId: activeSession ? session.id : crypto.randomUUID(),
      action: "open-reading",
      targetPlatform: target.value === "windows" ? "windows" : "macOS",
      createdAt: now
    };
    db.computerReadingRequest = nextRequest;
    db.computerReadingResult = null;
    computerReadingSendError = false;
    persist();
    renderStatus();
    status.textContent = text("sending");
    button.disabled = true;
    try {
      syncQueue = syncQueue.then(() => sync());
      await syncQueue;
      computerReadingSendError = false;
      renderStatus();
    } catch {
      computerReadingSendError = true;
      renderStatus();
    } finally {
      button.disabled = false;
    }
  });

  let heartbeat = 0;
  let focusWasActive = document.body.classList.contains("mobile-reading-focus");
  function isTimedMeditationSession(session) {
    return session?.source === "timed-meditation" || String(session?.id || "").startsWith("meditation-");
  }
  function expireIdleFocusSession(now = Date.now()) {
    const old = db.computerReadingSession;
    if (!readingIdle || !isRecord(old) || isTimedMeditationSession(old) || old.endedReason === "idle-timeout") return false;
    const expired = readingIdle.expire(old, now);
    if (!expired) return false;
    db.computerReadingSession = { ...old, ...expired, status: "paused", updatedAt: now, resumeGraceUntil: 0, endedReason: "idle-timeout" };
    persist();
    scheduleSync();
    clearTimeout(focusIdleTimer);
    focusIdleTimer = 0;
    clearInterval(heartbeat);
    heartbeat = 0;
    return true;
  }
  function scheduleFocusIdleExpiry() {
    clearTimeout(focusIdleTimer);
    focusIdleTimer = 0;
    const session = db.computerReadingSession;
    if (!readingIdle || !isRecord(session) || !readingIdle.normalize(session) || isTimedMeditationSession(session) || session.endedReason === "idle-timeout" || !["running", "paused"].includes(session.status)) return;
    const lastSeenAt = timestamp(session, "lastSeenAt");
    if (!lastSeenAt) return;
    focusIdleTimer = setTimeout(() => {
      if (!expireIdleFocusSession()) scheduleFocusIdleExpiry();
    }, Math.max(0, lastSeenAt + readingIdle.IDLE_TIMEOUT_MS - Date.now()));
  }
  function saveSession(sessionStatus, now = Date.now(), userActivity = false) {
    if (currentPlatform && db.meditationSession?.status === "running"
        && Number(db.meditationSession.endsAt) > now && meditationView.classList.contains("active")) {
      publishMeditationRest(db.meditationSession);return true;
    }
    if (sessionStatus === "running" && expireIdleFocusSession(now) && !userActivity) return false;
    const old = db.computerReadingSession || {};
    if (isTimedMeditationSession(old)) return false;
    const expiredByIdle = old.endedReason === "idle-timeout";
    const withinGrace = !expiredByIdle && old.status === "paused" && timestamp(old, "resumeGraceUntil") > now;
    const stillRunning = !expiredByIdle && old.status === "running" && now - timestamp(old, "lastSeenAt") < (readingIdle?.IDLE_TIMEOUT_MS || 600000);
    const deepLinkSession = handoffRequestId
      ? linkedHandoffSessionId()
      : routeParams.get("sessionId");
    db.computerReadingSession = {
      id: withinGrace ? old.id : (!expiredByIdle && (deepLinkSession || (stillRunning && old.id)) || crypto.randomUUID()),
      mode: "focus-reading",
      status: sessionStatus,
      ref: typeof currentPassage === "function" ? currentPassage().ref : "",
      updatedAt: now,
      lastSeenAt: sessionStatus === "running" && userActivity ? now : (timestamp(old, "lastSeenAt") || now),
      resumeGraceUntil: sessionStatus === "running" ? 0 : (withinGrace ? timestamp(old, "resumeGraceUntil") : now + 420000),
      endedReason: ""
    };
    persist();
    scheduleSync();
    scheduleFocusIdleExpiry();
    return true;
  }
  function startReadingHeartbeat() {
    clearInterval(heartbeat);
    heartbeat = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus() && !saveSession("running")) {
        clearInterval(heartbeat);
        heartbeat = 0;
      }
    }, 20000);
  }
  function recordFocusReadingActivity() {
    if (!document.body.classList.contains("mobile-reading-focus") || document.visibilityState !== "visible" || !document.hasFocus()) return;
    if (saveSession("running", Date.now(), true)) startReadingHeartbeat();
  }
  const originalSetReaderFocus = setReaderFocus;
  setReaderFocus = function (active) {
    originalSetReaderFocus(active);
    focusWasActive = !!active;
    if (active) {
      if (saveSession("running", Date.now(), true)) startReadingHeartbeat();
    } else {
      clearInterval(heartbeat);
      heartbeat = 0;
      if (db.computerReadingSession?.status === "running") saveSession("paused");
    }
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && focusWasActive) setReaderFocus(false);
  });
  for (const eventName of ["pointerdown", "keydown", "touchstart", "wheel", "scroll"]) {
    document.addEventListener(eventName, recordFocusReadingActivity, { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.body.classList.contains("mobile-reading-focus")) return;
    if (document.visibilityState === "hidden") {
      clearInterval(heartbeat);
      heartbeat = 0;
      saveSession("paused");
    } else {
      if (expireIdleFocusSession()) return;
      if (saveSession("running")) startReadingHeartbeat();
    }
  });

  // Timed meditation and focus reading use the same desktop rest contract.
  let meditationHeartbeat = 0;
  function publishMeditationRest(session) {
    if (!currentPlatform || !session?.id) return;
    const now = Date.now(), duration = Math.max(0, Number(session.durationMs) || 0);
    const remaining = session.status === "running"
      ? Math.max(0, Number(session.endsAt) - now)
      : Math.max(0, Number(session.remainingMs) || 0);
    const foreground = document.visibilityState === "visible" && document.hasFocus()
      && meditationView.classList.contains("active");
    const timedStatus = session.status === "running" && remaining <= 0 ? "completed" : session.status;
    // The meditation timer may continue, but a background page is not reading.
    const status = ["running", "paused"].includes(timedStatus) && !foreground ? "ended" : timedStatus;
    const old = db.computerReadingSession;
    const id = "meditation-" + session.id;
    // A different focus-reading session must not be ended by old meditation data.
    if (!["running", "paused"].includes(status) && old?.id !== id) return;
    db.computerReadingSession = {
      id, status, source: "timed-meditation", platform: currentPlatform,
      ref: session.ref || "", updatedAt: now, lastSeenAt: now,
      activeMs: Math.min(duration, Math.max(0, duration - remaining)),
      resumeGraceUntil: status === "paused" ? now + 420000 : 0
    };
    persist();scheduleSync();
    clearInterval(meditationHeartbeat);meditationHeartbeat = 0;
    if (status === "running" && foreground) meditationHeartbeat = setInterval(() => {
      if (db.meditationSession?.id === session.id) publishMeditationRest(db.meditationSession);
      else { clearInterval(meditationHeartbeat);meditationHeartbeat = 0; }
    }, 30000);
  }
  function refreshMeditationForeground() {
    const session = db.meditationSession;
    if (session?.id && meditationView.classList.contains("active")) publishMeditationRest(session);
  }
  document.addEventListener("visibilitychange", refreshMeditationForeground);
  window.addEventListener("blur", refreshMeditationForeground);
  window.addEventListener("focus", refreshMeditationForeground);
  const originalSaveMeditationSession = saveMeditationSession;
  saveMeditationSession = function (status) {
    originalSaveMeditationSession(status);
    publishMeditationRest(db.meditationSession);
  };
  const originalActivateSyncedMeditation = activateSyncedMeditation;
  activateSyncedMeditation = function (session) {
    originalActivateSyncedMeditation(session);
    publishMeditationRest(session);
  };
  window.addEventListener("selah-data-updated", () => {
    const session = db.meditationSession;
    if (currentPlatform && session?.status === "running" && Number(session.endsAt) > Date.now()
        && (!meditationHeartbeat || db.computerReadingSession?.id !== "meditation-" + session.id)) {
      activateSyncedMeditation(session);
    }
  });

  const originalSync = sync;
  sync = async function (...args) {
    try { return await originalSync(...args); }
    finally { renderStatus(); }
  };
  document.getElementById("signOut")?.addEventListener("click", () => queueMicrotask(renderStatus));

  scheduleFocusIdleExpiry();
  renderStatus();
  setInterval(() => void pollResult(), 5000);
  if (routeParams.get("openReading") === "1" || routeParams.get("homeAction") === "read") setReaderFocus(true);
})();
