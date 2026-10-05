import assert from 'node:assert/strict';
import worker from '../analytics-worker/src/index.js';

const writes = [];
const reads = [];
const database = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async run() { writes.push({ sql, values }); return { success: true }; },
          async all() { reads.push(sql); return { results: [] }; }
        };
      },
      async all() {
        reads.push(sql);
        return { results: [{ language: 'ko', editionKey: 'id:krv1961', editionId: 'KRV1961', editionName: 'Revised Korean Bible', interestType: 'read', total: 12 }] };
      }
    };
  }
};
const env = { ALLOWED_ORIGIN: 'https://delight0517.github.io', DB: database };
function request(url, init = {}, cf = { country: 'US' }) {
  const value = new Request(url, init);
  Object.defineProperty(value, 'cf', { value: cf });
  return value;
}
function post(body, origin = env.ALLOWED_ORIGIN) {
  return request('https://worker.test/analytics/edition-interest', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body)
  }, { country: 'US', regionCode: 'CA', city: 'ignored', ip: 'ignored' });
}

const accepted = await worker.fetch(post({ appId: 'selah', editionId: 'KRV1961', editionName: 'Revised Korean Bible', language: 'ko', interestType: 'read', locale: 'en' }), env);
assert.equal(accepted.status, 202);
assert.deepEqual(writes[0].values, ['US', 'en', 'ko', 'id:krv1961', 'KRV1961', 'Revised Korean Bible', 'read']);
assert.match(writes[0].sql, /ON CONFLICT/);
assert.doesNotMatch(writes[0].sql, /ip|email|account|passage|note|city/i);

const paid = await worker.fetch(post({ appId: 'selah', editionName: 'Revised Korean Bible', language: 'ko', interestType: 'paid', locale: 'en' }), env);
assert.equal(paid.status, 202);
assert.equal(writes[1].values.at(-1), 'paid');
assert.equal(writes[1].values[3], 'name:revised korean bible');

const oversized = await worker.fetch(request('https://worker.test/analytics/edition-interest', {
  method: 'POST', headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify({ padded: 'x'.repeat(3000) })
}), env);
assert.equal(oversized.status, 413);
const invalidType = await worker.fetch(post({ appId: 'selah', editionName: 'Revised Korean Bible', language: 'ko', interestType: 'purchase', locale: 'en' }), env);
assert.equal(invalidType.status, 400);
const unsafeName = await worker.fetch(post({ appId: 'selah', editionName: '<img src=x>', language: 'ko', interestType: 'read', locale: 'en' }), env);
assert.equal(unsafeName.status, 400);
const unapprovedOrigin = await worker.fetch(post({ appId: 'selah', editionName: 'Revised Korean Bible', language: 'ko', interestType: 'read', locale: 'en' }, 'https://wrong.example'), env);
assert.equal(unapprovedOrigin.status, 403);
assert.equal(writes.length, 2);

const summaryResponse = await worker.fetch(request('https://worker.test/analytics/edition-interest/summary?period=all'), env);
assert.equal(summaryResponse.status, 200);
const summary = await summaryResponse.json();
assert.equal(summary.minimumAggregate, 10);
assert.equal(summary.editions[0].interestType, 'read');
assert.equal(summary.editions[0].total, 12);
assert.equal(summary.editions[0].paidInterest, undefined);
assert.equal(summary.editions[0].country, undefined);
assert.match(reads.at(-1), /GROUP BY .*interest_type/);
assert.match(reads.at(-1), /HAVING SUM\(count\) >= 10/);
assert.doesNotMatch(reads.at(-1), /SELECT country/);
console.log('Edition interest worker: consent event validation, coarse aggregate storage, CORS, and 10-signal summary threshold passed');
