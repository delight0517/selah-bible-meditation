import assert from 'node:assert/strict';
import worker, { TogetherRoom, refreshNextAudioCatalog, verifyScheduledPlaylistCoverage } from '../together-worker/src/index.js';
import { audioLanguageList, editionList } from '../together-worker/src/youtube-search.js';
import { discoverAudioCatalogLocale } from '../together-worker/src/youtube-audio-catalog.js';

const editions = editionList('en');
const playlist = index => `PL${String(index).padStart(20, '0')}`;
let searchCount = 0, coverageCount = 0, coverageReservations = 0;
const discovered = await discoverAudioCatalogLocale({
  locale: 'en', env: {}, waitMs: 0, sleepImpl: async () => {}, now: () => new Date('2026-10-07T08:20:00Z'),
  reserveCoverageQuota: async () => { coverageReservations++; return null; },
  searchImpl: async (request, _env, _reserveQuota, options) => {
    searchCount++;
    assert.deepEqual(options, { playlistOnly: true }, 'scheduled discovery requests YouTube playlists, not chapter videos');
    const body = await request.json();
    assert.deepEqual({ locale: body.locale, bookId: body.bookId, chapter: body.chapter }, { locale: 'en', bookId: 'MAT', chapter: 1 });
    return Response.json({ locale: 'en', editions: editions.map((edition, index) => ({
      ...edition,
      items: index === 0 ? [
        { mediaType: 'playlist', playlistId: playlist(1), title: `${edition.name} first`, channelTitle: 'Test' },
        { mediaType: 'playlist', playlistId: playlist(2), title: `${edition.name} complete`, channelTitle: 'Test' }
      ] : []
    })) });
  },
  coverageImpl: async (request, env, reserveQuota) => {
    assert.equal(typeof reserveQuota, 'function');
    assert.equal(await reserveQuota(), null);
    coverageCount++;
    const body = await request.json();
    assert.equal(body.editionId, editions[0].id);
    return body.playlistId === playlist(1)
      ? Response.json({ error: 'edition_mismatch' }, { status: 422 })
      : Response.json({ status: 'COMPLETE_CHAPTER_COVERAGE', itemCount: 1189, coveredChapters: 1189, totalChapters: 1189, chapterSync: true, explicitVerseCueCount: 1, videoIds: ['abcdefghijk'], verseCues: [{ bookId: 'MAT', chapter: 1, verse: 1, seconds: 5, videoId: 'abcdefghijk', playlistIndex: 0 }] });
  }
});
assert.equal(searchCount, 1);
assert.equal(coverageCount, 2);
assert.equal(coverageReservations, 2);
assert.equal(discovered.editions.length, 5);
assert.equal(discovered.editions[0].playlistId, playlist(2));
assert.equal(discovered.editions[0].coveredChapters, 1189);
assert.deepEqual(discovered.editions[0].videoIds, ['abcdefghijk']);

const storage = new Map();
const room = new TogetherRoom({ storage: {
  get: async key => storage.get(key),
  put: async (key, value) => storage.set(key, value),
  delete: async key => storage.delete(key),
  deleteAll: async () => storage.clear()
} });
const rooms = {
  idFromName: name => name,
  get: () => ({ fetch: request => room.fetch(request) })
};
const env = { ROOMS: rooms, YOUTUBE_DATA_API_KEY: 'test-only-key' };
const coverageBody = { locale: 'en', editionId: 'KJV', playlistId: playlist(9), bookId: 'MAT', chapter: 1 };
const scheduledCoverageReservations = [];
const coverageDispatch = await verifyScheduledPlaylistCoverage(
  new Request('https://worker/youtube/playlist-coverage', { method: 'POST', body: JSON.stringify(coverageBody) }),
  { YOUTUBE_DATA_API_KEY: 'test-only-key' },
  async exhausted => { scheduledCoverageReservations.push(!!exhausted); return null; },
  { fetch: async request => {
    assert.equal(new URL(request.url).pathname, '/internal/youtube-audio-coverage');
    assert.equal(request.headers.get('x-youtube-data-api-key'), 'test-only-key');
    assert.deepEqual(await request.json(), coverageBody);
    return Response.json({ status: 'PARTIAL_COVERAGE' });
  } }
);
assert.equal(coverageDispatch.status, 200);
assert.deepEqual(scheduledCoverageReservations, [false], 'scheduled coverage reserves quota before dispatching one isolated scan');
const upstreamQuotaReservations = [];
await verifyScheduledPlaylistCoverage(
  new Request('https://worker/youtube/playlist-coverage', { method: 'POST', body: JSON.stringify(coverageBody) }),
  { YOUTUBE_DATA_API_KEY: 'test-only-key' },
  async exhausted => { upstreamQuotaReservations.push(!!exhausted); return null; },
  { fetch: async () => Response.json({ error: 'youtube_quota_unavailable' }, { status: 429 }) }
);
assert.deepEqual(upstreamQuotaReservations, [false, true], 'provider quota errors block later scheduled coverage calls');
const originalFetch = globalThis.fetch;
globalThis.fetch = async request => {
  const url = new URL(String(request));
  assert.equal(url.searchParams.get('key'), 'test-only-key', 'the internal API key reaches YouTube only from the Durable Object scan');
  if (url.pathname.endsWith('/playlists')) return Response.json({ items: [{ id: coverageBody.playlistId, snippet: { title: 'King James Version Audio Bible', channelTitle: 'Test' }, contentDetails: { itemCount: 1 } }] });
  if (url.pathname.endsWith('/playlistItems')) return Response.json({ items: [{ snippet: { title: 'King James Version Matthew chapter 1', position: 0, resourceId: { videoId: 'abcdefghijk' } } }] });
  if (url.pathname.endsWith('/videos')) return Response.json({ items: [{ id: 'abcdefghijk', snippet: { description: '00:10 Matthew 1' } }] });
  throw Error(`unexpected YouTube endpoint:${url.pathname}`);
};
try {
  const isolatedScan = await room.fetch(new Request('https://room/internal/youtube-audio-coverage', {
    method: 'POST', headers: { 'x-youtube-data-api-key': 'test-only-key' }, body: JSON.stringify(coverageBody)
  }));
  assert.equal(isolatedScan.status, 200, 'playlist scan executes through its isolated Durable Object route');
  const isolatedData = await isolatedScan.json();
  assert.equal(isolatedData.status, 'PARTIAL_COVERAGE');
  assert.equal(isolatedData.coveredChapters, 1);
  assert.equal(isolatedData.verseCues[0].seconds, 10);
} finally {
  globalThis.fetch = originalFetch;
}
assert.equal((await room.fetch(new Request('https://room/internal/youtube-audio-coverage', { method: 'POST', body: JSON.stringify(coverageBody) }))).status, 503, 'isolated scan rejects missing internal API key');
const firstTime = Date.parse('2026-10-07T08:20:00Z');
let refreshCount = 0;
const refresh = (scheduledTime, localeResult) => refreshNextAudioCatalog(env, {
  scheduledTime,
  discover: async ({ locale, reserveQuota, reserveCoverageQuota, coverageImpl }) => {
    refreshCount++;
    assert.equal(locale, localeResult);
    assert.equal(await reserveQuota(), null,'scheduled searches use their reserved daily bucket');
    const scheduledReservations = [];
    const isolatedCoverage = await coverageImpl(new Request('https://worker/youtube/playlist-coverage', { method: 'POST', body: JSON.stringify({ ...coverageBody, playlistId: 'bad' }) }), env, async exhausted => { scheduledReservations.push(!!exhausted); return null; });
    assert.equal(isolatedCoverage.status, 400, 'catalog refresh sends each candidate scan to the Durable Object request boundary');
    assert.deepEqual(scheduledReservations, [false], 'scheduled playlist scans reserve quota before dispatch');
    return { ...discovered, locale, editions: editionList(locale).map((edition, index) => ({ ...edition, status: 'PARTIAL_COVERAGE', coveredChapters: index + 1 })) };
  }
});
const first = await refresh(firstTime, audioLanguageList()[0].code);
assert.equal(first.refreshed, true);
assert.equal(first.editionCount, editions.length);
const repeated = await refresh(firstTime, audioLanguageList()[0].code);
assert.equal(repeated.reason, 'already_claimed_today');
assert.equal(refreshCount, 1);

const catalogResponse = await worker.fetch(new Request('https://worker.test/youtube/audio-catalog?locale=en', { headers: { Origin: 'https://delight0517.github.io' } }), env);
assert.equal(catalogResponse.status, 200);
assert.equal(catalogResponse.headers.get('Access-Control-Allow-Origin'), 'https://delight0517.github.io');
const storedCatalog = await catalogResponse.json();
assert.equal(storedCatalog.locale, 'en');
assert.equal(storedCatalog.editions.length, 5);
assert.equal(storedCatalog.editions[4].coveredChapters, 5);

const invalidLocale = await worker.fetch(new Request('https://worker.test/youtube/audio-catalog?locale=bad'), env);
assert.equal(invalidLocale.status, 400);
const deniedOrigin = await worker.fetch(new Request('https://worker.test/youtube/audio-catalog?locale=en', { headers: { Origin: 'https://evil.example' } }), env);
assert.equal(deniedOrigin.status, 403);

const scheduledLocales = audioLanguageList().map(language => language.code), rotatedLocales = [scheduledLocales[0]];
for (let index = 1; index < scheduledLocales.length; index++) {
  const result = await refresh(firstTime + index * 86400000, scheduledLocales[index]);
  assert.equal(result.refreshed, true, `day ${index + 1} refreshes ${scheduledLocales[index]}`);
  rotatedLocales.push(result.locale);
}
assert.deepEqual(rotatedLocales, scheduledLocales, 'ten daily catalog runs cover every audio language once in order');
const wrapped = await refresh(firstTime + scheduledLocales.length * 86400000, scheduledLocales[0]);
assert.equal(wrapped.refreshed, true);
assert.equal(wrapped.locale, scheduledLocales[0], 'the next cycle returns to its first language');
assert.equal((await refresh(firstTime + scheduledLocales.length * 86400000, scheduledLocales[0])).reason, 'already_claimed_today');
assert.equal(refreshCount, scheduledLocales.length + 1);
console.log('Scheduled YouTube audio catalog contract passed.');
