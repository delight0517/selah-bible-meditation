const { strict: assert } = require('node:assert');
require('./google-login-recovery.js');
const { create } = globalThis.SelahGoogleSignIn;
const configured = { configured: true, clientId: 'public-test-client' };
(async () => {
  let calls = 0, renders = 0, release;
  const first = create({ getInfo: () => { calls++; return new Promise(resolve => release = resolve); }, load: async () => {}, render: () => renders++, status: () => {} });
  const pending = first.start();
  assert.equal(first.start(), pending);
  release(configured);
  assert.equal(await pending, true);
  assert.equal(await first.start(), true);
  assert.equal(calls, 1); assert.equal(renders, 1);

  let clock = 0, rateCalls = 0, states = [];
  const limited = create({ now: () => clock, getInfo: async () => { rateCalls++; if (rateCalls === 1) throw Object.assign(new Error('limited'), { status: 429, retryAfter: 2 }); return configured; }, load: async () => {}, render: () => {}, status: (...state) => states.push(state) });
  assert.equal(await limited.start(), false);
  assert.deepEqual(states.at(-1), ['limited', 2]);
  await limited.start(true); assert.equal(rateCalls, 1);
  clock = 2000;
  assert.equal(await limited.start(true), true); assert.equal(rateCalls, 2);

  let loadCalls = 0;
  const failedScript = create({ getInfo: async () => configured, load: async () => { if (++loadCalls === 1) throw new Error('script failed'); }, render: () => {}, status: () => {} });
  assert.equal(await failedScript.start(), false);
  assert.equal(await failedScript.start(true), true);

  let abortSignal, timeoutCalls = 0;
  const timed = create({ timeoutMs: 10, getInfo: signal => { abortSignal = signal; return ++timeoutCalls === 1 ? new Promise(() => {}) : Promise.resolve(configured); }, load: async () => {}, render: () => {}, status: () => {} });
  assert.equal(await timed.start(), false); assert.equal(abortSignal.aborted, true);
  assert.equal(await timed.start(true), true);
  let unconfiguredLoad = false;
  const disabled = create({ getInfo: async () => ({ configured: false }), load: async () => unconfiguredLoad = true, render: () => {}, status: () => {} });
  assert.equal(await disabled.start(), false); assert.equal(unconfiguredLoad, false);
  console.log('PASS: single initialization, rate-limit cooldown, script retry, timeout abort/retry, missing configuration');
})().catch(error => { console.error(error); process.exitCode = 1; });
