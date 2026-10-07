import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const YOUTUBE_AUDIO_CATALOG_API=');
const end = html.indexOf('\nfunction catalogBibleAudioSources', start);
assert.ok(start >= 0 && end > start, 'catalog loader source exists');
const timers = new Map(), requests = [];
let timerId = 0, renders = 0;
const fixedNow = Date.parse('2026-10-07T02:04:39Z');
class FixedDate extends Date { static now() { return fixedNow; } }
const context = {
  Date: FixedDate,
  URL,
  URLSearchParams,
  Response,
  encodeURIComponent,
  youtubeAudioEndpoint: 'https://catalog.test',
  location: { href: 'https://delight0517.github.io/selah-bible-meditation/' },
  selectedYoutubeAudioLanguage: () => 'en',
  renderBibleAudioSetup: () => { renders++; },
  fetch: async url => {
    requests.push(String(url));
    return requests.length < 3
      ? new Response(null, { status: 404 })
      : Response.json({ schema: 1, locale: 'en', generatedAt: '2026-10-07T02:00:00Z', editions: [] });
  },
  setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
  clearTimeout: id => timers.delete(id)
};
vm.runInNewContext(`${html.slice(start, end)}\nglobalThis.catalogTest = { loadYoutubeAudioCatalog, data: youtubeAudioCatalogData, retries: youtubeAudioCatalogRetries, retryDelay: youtubeAudioCatalogRetryDelay };`, context);

context.catalogTest.loadYoutubeAudioCatalog('en');
await new Promise(setImmediate);
assert.equal(context.catalogTest.data.get('en'), null, 'a pre-publication miss is cached only until its scheduled retry');
assert.equal(context.catalogTest.retries.size, 1);
const [id, retry] = timers.entries().next().value;
assert.equal(retry.delay, 6 * 60 * 60 * 1000, 'long waits are bounded while the next UTC publication check remains scheduled');
assert.equal(context.catalogTest.retryDelay(Date.parse('2026-10-07T08:25:00Z')), 5 * 60 * 1000, 'a failure just before the daily run retries ten minutes after its 08:20 UTC Cron');
timers.delete(id);
retry.callback();
await new Promise(setImmediate);
assert.equal(requests.length, 3, 'one retry performs a public API read and no extra YouTube search');
assert.equal(context.catalogTest.data.get('en')?.locale, 'en', 'the session accepts the newly published catalog');
assert.equal(context.catalogTest.retries.size, 0, 'successful publication cancels negative-cache retries');
assert.equal(renders, 2, 'the reader rerenders when either the miss or refreshed catalog resolves');
console.log('PASS: open reader retries a pre-publication catalog miss after the UTC refresh without another YouTube search.');
