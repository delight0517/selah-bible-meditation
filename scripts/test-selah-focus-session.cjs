const assert = require("node:assert/strict");
const session = require("../assets/selah-focus-session.js");

const start = 1_800_000_000_000;
const first = session.start(null, start, "11111111-1111-4111-8111-111111111111");
assert.equal(session.isActive(first, start + session.IDLE_TIMEOUT_MS - 1), true);
assert.equal(session.isExpired(first, start + session.IDLE_TIMEOUT_MS), true);
assert.equal(session.isExpired({ ...first, lastSeenAt: start + 31_000 }, start), true);
assert.equal(session.expire(first, start + session.IDLE_TIMEOUT_MS).endedReason, "idle-timeout");
assert.equal(session.expire(first, start + session.IDLE_TIMEOUT_MS).status, "paused");
assert.equal(session.isActive(session.expire(first, start + session.IDLE_TIMEOUT_MS), start + session.IDLE_TIMEOUT_MS), false);

const touched = session.touch(first, start + 4 * 60_000);
assert.equal(session.isActive(touched, start + 13 * 60_000), true);
assert.equal(session.isExpired(touched, start + 14 * 60_000), true);
const paused = { ...first, status: "paused", resumeGraceUntil: start + 15 * 60_000 };
assert.equal(session.isExpired(paused, start + 10 * 60_000), true);
assert.equal(session.isActive(paused, start + 10 * 60_000), false);
const restarted = session.start(first, start + session.IDLE_TIMEOUT_MS, "22222222-2222-4222-8222-222222222222");
assert.equal(restarted.id, "22222222-2222-4222-8222-222222222222");
assert.equal(restarted.startedAt, start + session.IDLE_TIMEOUT_MS);

console.log("Selah focus-reading idle timeout: ok");
