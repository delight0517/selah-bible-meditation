import assert from 'node:assert/strict';
import worker from '../analytics-worker/src/index.js';
const writes = [], reads = [];
const DB = { prepare(sql) { return { bind(...values) { return { async run() { writes.push({sql, values}); }, async all() { reads.push({sql, values}); return {results: []}; } }; }, async run() { writes.push({sql, values: []}); }, async all() { reads.push({sql, values: []}); return {results: []}; } }; } };
const env = {DB, ALLOWED_ORIGIN: 'https://delight0517.github.io'};
const visitorId = '11111111-1111-4111-8111-111111111111', eventId = '22222222-2222-4222-8222-222222222222';
const event = {consent: true, visitorId, eventId, feature: 'reflection_saved', locale: 'ko', client: 'web', deviceClass: 'phone', source: 'Naver', medium: 'owned', campaign: 'kr-readers', prayer: 'must never persist', username: 'must never persist'};
function request(path, body, authorization) { const req = new Request('https://test/analytics/usage/' + path, {method: body ? 'POST' : 'GET', headers: {origin: env.ALLOWED_ORIGIN, ...(authorization ? {authorization} : {})}, ...(body ? {body: JSON.stringify(body)} : {})}); Object.defineProperty(req, 'cf', {value: {country: 'KR'}}); return req; }
assert.equal((await worker.fetch(request('event', {...event, consent: false}), env)).status, 400);
assert.equal(writes.length, 0);
assert.equal((await worker.fetch(request('event', event), env)).status, 202);
assert.match(writes[1].sql, /INSERT OR IGNORE/);
assert.match(writes[1].sql, /< 500/);
assert.deepEqual(writes[1].values, [eventId, visitorId, 'KR', 'ko', 'web', 'phone', 'reflection_saved', 'naver', 'owned', 'kr-readers', visitorId]);
assert.doesNotMatch(JSON.stringify(writes), /must never persist/);
assert.equal((await worker.fetch(request('event', {...event, feature: 'private_note'}), env)).status, 400);
assert.equal((await worker.fetch(request('users'), env)).status, 401);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response('{}', {status: 403});
  assert.equal((await worker.fetch(request('users', null, 'Bearer fake'), env)).status, 403);
  assert.equal(reads.length, 0);
  globalThis.fetch = async (url, options) => { assert.equal(url, 'https://brainwire-f2gf.onrender.com/api/feedback/developer-proof'); assert.equal(options.redirect, 'error'); return Response.json({ok: true, proof: 'server-verified'}); };
  const summary = await worker.fetch(request('users', null, 'Bearer developer'), env);
  assert.equal(summary.status, 200); assert.equal(summary.headers.get('cache-control'), 'no-store');
  assert.match(reads[0].sql, /LIMIT 100/);
  assert.equal((await worker.fetch(request('users?visitorId=' + visitorId, null, 'Bearer developer'), env)).status, 200);
  assert.deepEqual(reads[1].values, [visitorId]); assert.match(reads[1].sql, /LIMIT 200/);
} finally { globalThis.fetch = originalFetch; }
assert.equal((await worker.fetch(request('delete', {visitorId}), env)).status, 200);
assert.deepEqual(writes.at(-1).values, [visitorId]);
assert.equal((await worker.fetch(request('delete', {visitorId: "' OR 1=1"}), env)).status, 400);
console.log('Usage worker: consent, field minimization, idempotency, private access, limits, deletion passed');
