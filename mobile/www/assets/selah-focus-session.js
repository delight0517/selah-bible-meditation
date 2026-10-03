(function (root) {
  const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
  const MAX_FUTURE_SKEW_MS = 30 * 1000;

  function normalize(session) {
    if (!session || !/^[0-9a-f-]{36}$/i.test(String(session.id || ""))) return null;
    if (!["running", "paused"].includes(session.status)) return null;
    return {
      id: String(session.id),
      status: session.status,
      mode: "focus-reading",
      startedAt: Math.max(0, Number(session.startedAt) || Number(session.updatedAt) || 0),
      activeMs: Math.max(0, Number(session.activeMs) || 0),
      lastSeenAt: Math.max(0, Number(session.lastSeenAt) || Number(session.updatedAt) || 0),
      updatedAt: Math.max(0, Number(session.updatedAt) || 0),
      resumeGraceUntil: Math.max(0, Number(session.resumeGraceUntil) || 0),
      endedReason: ["idle-timeout", "manual"].includes(session.endedReason) ? session.endedReason : "",
      ref: String(session.ref || "").slice(0, 120),
    };
  }

  function isExpired(session, now = Date.now()) {
    const current = normalize(session);
    if (!current || current.endedReason === "idle-timeout") return false;
    return current.lastSeenAt > now + MAX_FUTURE_SKEW_MS
      || now - current.lastSeenAt >= IDLE_TIMEOUT_MS;
  }

  function isActive(session, now = Date.now()) {
    const current = normalize(session);
    if (!current) return false;
    if (current.status === "paused") return !isExpired(current, now) && current.resumeGraceUntil > now;
    return current.status === "running" && !isExpired(current, now);
  }

  function end(session, now = Date.now(), reason = "manual") {
    const current = normalize(session);
    if (!current || current.status === "ended") return current;
    return {
      ...current,
      status: "paused",
      updatedAt: now,
      resumeGraceUntil: 0,
      endedReason: reason === "idle-timeout" ? "idle-timeout" : "manual",
    };
  }

  function expire(session, now = Date.now()) {
    return isExpired(session, now) ? end(session, now, "idle-timeout") : null;
  }

  function start(session, now = Date.now(), newId) {
    const current = normalize(session);
    const id = isActive(current, now) ? current.id : newId;
    return {
      id,
      status: "running",
      mode: "focus-reading",
      startedAt: isActive(current, now) ? current.startedAt : now,
      activeMs: isActive(current, now) ? current.activeMs : 0,
      lastSeenAt: now,
      updatedAt: now,
      resumeGraceUntil: 0,
      endedReason: "",
      ref: current?.ref || "",
    };
  }

  function touch(session, now = Date.now()) {
    const current = normalize(session);
    if (!current || current.status !== "running") return current;
    if (isExpired(current, now)) return end(current, now, "idle-timeout");
    return { ...current, lastSeenAt: now, updatedAt: now };
  }

  const api = { IDLE_TIMEOUT_MS, normalize, isExpired, isActive, start, touch, end, expire };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SelahFocusSession = api;
})(typeof window === "undefined" ? globalThis : window);
