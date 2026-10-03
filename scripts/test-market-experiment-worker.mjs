import assert from 'node:assert/strict';
import worker from '../analytics-worker/src/index.js';

const writes = [];
const reads = [];
const database = {
  prepare(sql) {
    return {
      async all() {
        reads.push(sql);
        const market = sql.includes('GROUP BY country, region_code, locale, experiment, variant ORDER BY country, region_code, locale, experiment, variant');
        const row = { country: 'KR', regionCode: '11', locale: 'ko', experiment: 'kr-home-copy-v1', variant: 'a', exposures: 1, ctaClicks: 1, readingStarts: 1, readers30s: 1, readers120s: 0, reflectionsSaved: 1, signups: 1, returnVisits: 1 };
        return { results: [market ? row : { ...row, client: 'web', deviceClass: 'phone', source: 'naver', medium: 'owned', campaign: 'kr-readers' }] };
      },
      bind(...values) {
        return {
          async run() { writes.push({ sql, values }); return { success: true }; },
          async first() { return { feature: 'meditation_started', total: 1 }; },
          async all() {
            return { results: [{ country: 'KR', regionCode: '11', locale: 'ko', client: 'web', deviceClass: 'phone', source: 'naver', medium: 'owned', campaign: 'kr-readers', experiment: 'kr-home-copy-v1', variant: 'a', exposures: 1, ctaClicks: 1, readingStarts: 1, readers30s: 1, readers120s: 0, reflectionsSaved: 1, returnVisits: 1 }] };
          }
        };
      }
    };
  }
};
const env = { ALLOWED_ORIGIN: 'https://delight0517.github.io', DB: database };
function request(url, init = {}, cf = { country: 'KR', regionCode: '11' }) {
  const value = new Request(url, init);
  Object.defineProperty(value, 'cf', { value: cf });
  return value;
}

const event = request('https://worker.test/analytics/experiment/event', {
  method: 'POST',
  headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify({ appId: 'selah', experiment: 'kr-home-copy-v1', variant: 'a', event: 'exposure', locale: 'ko', client: 'web', deviceClass: 'phone', source: 'Naver', medium: 'Owned', campaign: 'KR.Readers' })
}, { country: 'KR', regionCode: '44', city: 'ignored', latitude: 'ignored' });
const accepted = await worker.fetch(event, env);
assert.equal(accepted.status, 202);
assert.deepEqual(writes[0].values, ['KR', '44', 'ko', 'web', 'phone', 'naver', 'owned', 'kr.readers', 'kr-home-copy-v1', 'a', 'exposure']);
assert.doesNotMatch(writes[0].sql, /city|latitude|longitude/);
assert.match(writes[0].sql, /ON CONFLICT/);

const signup = request('https://worker.test/analytics/experiment/event', {
  method: 'POST',
  headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify({ appId: 'selah', experiment: 'kr-home-copy-v1', variant: 'a', event: 'signup_complete', locale: 'ko', client: 'web', deviceClass: 'phone', source: 'google', medium: 'organic' })
});
assert.equal((await worker.fetch(signup, env)).status, 202);
assert.equal(writes[1].values.at(-1), 'signup_complete');

const invalid = request('https://worker.test/analytics/experiment/event', {
  method: 'POST',
  headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify({ appId: 'selah', experiment: 'kr-home-copy-v1', variant: 'unknown', event: 'exposure', locale: 'ko', client: 'web', deviceClass: 'phone' })
});
assert.equal((await worker.fetch(invalid, env)).status, 400);
assert.equal(writes.length, 2);

const summary = await worker.fetch(request('https://worker.test/analytics/experiment/summary'), env);
assert.equal(summary.status, 200);
const summaryBody = await summary.json();
assert.equal(summaryBody.rows[0].readers120s, 0);
assert.equal(summaryBody.marketRows[0].client, undefined);
assert.equal(summaryBody.rows[0].campaign, 'kr-readers');
assert.equal(summaryBody.rows[0].signups, 1);
assert.ok(reads.some(sql => /AS signups/.test(sql)));
assert.equal((await worker.fetch(request('https://worker.test/analytics/experiment/summary'), env).then(r => r.json())).rows[0].returnVisits, 1);
const allTime = await worker.fetch(request('https://worker.test/analytics/experiment/summary?period=all'), env).then(r => r.json());
assert.equal(allTime.period, 'all');
assert.equal(reads.at(-1).includes('WHERE day >='), false);
assert.equal(reads.at(-1).includes('${where}'), false);

const invalidDevice = request('https://worker.test/analytics/experiment/event', {
  method: 'POST',
  headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify({ appId: 'selah', experiment: 'kr-home-copy-v1', variant: 'a', event: 'exposure', locale: 'ko', client: 'web', deviceClass: 'full-user-agent' })
});
assert.equal((await worker.fetch(invalidDevice, env)).status, 400);

const invitation = request('https://worker.test/analytics/experiment/event', {
  method: 'POST',
  headers: { origin: env.ALLOWED_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify({ appId: 'selah', experiment: 'kr-gentle-invitation-v1', variant: 'b', event: 'exposure', locale: 'ko', client: 'web', deviceClass: 'phone' })
});
assert.equal((await worker.fetch(invitation, env)).status, 202);
assert.equal(writes[2].values.at(-3), 'kr-gentle-invitation-v1');
assert.equal(writes[2].values.at(-2), 'b');

const market = await worker.fetch(request('https://worker.test/analytics/market'), env);
assert.deepEqual(await market.json(), { country: 'KR', regionCode: '11', topFeature: null, sampleCount: 1 });

const denied = request('https://worker.test/analytics/experiment/event', {
  method: 'POST', headers: { origin: 'https://wrong.example' }, body: '{}'
});
assert.equal((await worker.fetch(denied, env)).status, 403);
console.log('Market experiment worker: validation, anonymous regional aggregation, summaries, and CORS passed');
