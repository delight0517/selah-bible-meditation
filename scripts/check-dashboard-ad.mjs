import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AD_CONFIG, createDailyAdGate, mountDashboardAd } from '../assets/dashboard-ad.mjs';

assert.deepEqual(AD_CONFIG, { enabled: false, publisherId: '', slotId: '' });
assert.equal(mountDashboardAd(null), null); // Disabled path does not even inspect DOM.
const source = await readFile(new URL('../assets/dashboard-ad.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /https?:|adsbygoogle|fetch\(|XMLHttpRequest|createElement\(['"]script/);
for (const file of ['index.html', 'en/index.html', 'ja/index.html', 'zh-cn/index.html', 'zh-tw/index.html', 'fil/index.html']) {
  assert.doesNotMatch(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'), /dashboard-ad\.mjs|adsbygoogle|googlesyndication/);
}
let raw = null;
const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
let queue = Promise.resolve();
const locks = { request: (_, callback) => {
  const next = queue.then(callback);
  queue = next.catch(() => {});
  return next;
} };
let date = new Date(2026, 9, 1, 23, 59);
let view = { view: 'home', consentGranted: true, visible: true };
const make = (overrides = {}) => createDailyAdGate({ storage, locks, context: () => view, now: () => date, ...overrides });
let requests = 0;
const filled = async eligible => { requests++; return eligible(); };
for (const forbidden of [
  { view: 'reading' }, { view: 'meditation' }, { view: 'unknown' },
  { consentGranted: false }, { visible: false }, { reading: true }, { meditating: true },
]) {
  const gate = make({ context: () => ({ ...view, ...forbidden }) });
  assert.equal(await gate.show(filled), false);
}
assert.equal(requests, 0);
assert.equal(await make({ locks: null }).show(filled), false);
assert.equal(await make({ storage: { getItem() { throw Error('denied'); } } }).show(filled), false);
assert.equal(await make({ storage: { getItem: () => null, setItem() { throw Error('quota'); } } }).show(filled), false);
raw = '{bad';
assert.equal(await make().show(filled), false);
raw = JSON.stringify({ day: '2026-10-01', count: -1 });
assert.equal(await make().show(filled), false);
raw = null;
assert.equal(await make().show(async () => false), false); // No-fill.
assert.equal(await make().show(async () => { throw Error('blocked'); }), false);
assert.equal(JSON.parse(raw).count, 0);
const closed = make();
closed.close();
assert.equal(await closed.show(filled), false);
const navigating = make();
assert.equal(await navigating.show(async () => { view.reading = true; return true; }), false);
delete view.reading;
assert.equal(JSON.parse(raw).count, 0);
const lateClose = make();
assert.equal(await lateClose.show(async () => { lateClose.close(); return true; }), false);
assert.equal(JSON.parse(raw).count, 0);
// Three tabs share a Web Lock and persistent state; the third renderer is never called.
assert.deepEqual(await Promise.all([make().show(filled), make().show(filled), make().show(filled)]), [true, true, false]);
assert.equal(requests, 2);
assert.equal(JSON.parse(raw).count, 2);
const afterDisplay = make();
afterDisplay.close();
assert.equal(await afterDisplay.show(filled), false);
assert.equal(JSON.parse(raw).count, 2); // Closing never refunds an earlier display.
assert.equal(await make().show(filled), false); // Reload cannot reset the cap.
date = new Date(2026, 9, 2, 0, 1);
view.view = 'dashboard';
assert.equal(await make().show(filled), true);
assert.equal(JSON.parse(raw).day, '2026-10-02');
assert.equal(JSON.parse(raw).count, 1);
assert.equal(await make().show(async () => { date = new Date(2026, 9, 3, 0, 0); return true; }), true);
assert.equal(JSON.parse(raw).day, '2026-10-03');
assert.equal(JSON.parse(raw).count, 1);
const separateBrowser = make({ storage: { getItem: () => null, setItem() {} } });
assert.equal(await separateBrowser.show(filled), true);
console.log('dashboard ad draft checks passed (no network, IDs, or ad SDK)');
