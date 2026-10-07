import assert from 'node:assert/strict';
import worker, { TogetherRoom, refreshNextAudioCatalog, verifyScheduledPlaylistCoverage } from '../together-worker/src/index.js';
import { audioLanguageList, editionList } from '../together-worker/src/youtube-search.js';
import { MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN, MAX_SCHEDULED_COVERAGE_CANDIDATES, MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN, SCHEDULED_CATALOG_CRONS, SCHEDULED_CATALOG_LOCALES_PER_RUN, YOUTUBE_QUOTA_LIMITS } from '../together-worker/src/youtube-quota.js';
import { discoverAudioCatalogLocale } from '../together-worker/src/youtube-audio-catalog.js';

const editions = editionList('en');
const playlist = index => `PL${String(index).padStart(20, '0')}`;
let searchCount = 0, coverageCount = 0, coverageReservations = 0;
const candidateOffsets = Object.fromEntries(editions.map(edition => [edition.id, 0]));
const discovered = await discoverAudioCatalogLocale({
  locale: 'en', env: {}, pageToken: 'search-page-2', candidateOffsets, waitMs: 0, sleepImpl: async () => {}, now: () => new Date('2026-10-07T08:20:00Z'),
  reserveCoverageQuota: async () => { coverageReservations++; return null; },
  searchImpl: async (request, _env, _reserveQuota, options) => {
    searchCount++;
    assert.deepEqual(options, { playlistOnly: true, pageToken: 'search-page-2', fallbackPageTokens: {} }, 'scheduled discovery resumes page-token searches for playlists');
    const body = await request.json();
    assert.deepEqual({ locale: body.locale, bookId: body.bookId, chapter: body.chapter }, { locale: 'en', bookId: 'MAT', chapter: 1 });
    return Response.json({ locale: 'en', nextPageToken: 'search-page-3', fallbackPageTokenKey: 'NIV,ESV,NKJV,NLT', fallbackNextPageToken: 'fallback-page-2', editions: editions.map((edition, index) => ({
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
assert.equal(discovered.nextPageToken, 'search-page-3');
assert.equal(discovered.fallbackPageTokenKey, 'NIV,ESV,NKJV,NLT');
assert.equal(discovered.fallbackNextPageToken, 'fallback-page-2');
assert.deepEqual(discovered.candidateOffsets, candidateOffsets);

for (const locale of ['en', 'ko']) {
  const localeEditions = editionList(locale), rotations = locale === 'ko' ? [0, 1] : [0];
  for (const scanRotation of rotations) {
    const scanCounts = new Map(), finalCandidate = new Map();
    const candidateId = (editionIndex, candidateIndex) => playlist(100 + editionIndex * 10 + candidateIndex + 1);
    const catalog = await discoverAudioCatalogLocale({
      locale, env: {}, waitMs: 0, sleepImpl: async () => {}, scanRotation,
      searchImpl: async () => Response.json({ locale, editions: localeEditions.map((edition, editionIndex) => ({
        ...edition,
        items: Array.from({ length: 8 }, (_, candidateIndex) => ({ mediaType: 'playlist', playlistId: candidateId(editionIndex, candidateIndex), title: `${edition.name} candidate ${candidateIndex + 1}` }))
      })) }),
      coverageImpl: async request => {
        const { editionId, playlistId } = await request.json(), count = (scanCounts.get(editionId) || 0) + 1;
        scanCounts.set(editionId, count);
        finalCandidate.set(editionId, playlistId);
        return Response.json({ status: 'PARTIAL_COVERAGE', itemCount: 1, coveredChapters: count, totalChapters: 1189, chapterSync: false, videoIds: [], verseCues: [] });
      }
    });
    assert.equal([...scanCounts.values()].reduce((sum, count) => sum + count, 0), MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN, `${locale} uses the full per-run scan budget`);
    assert.ok(MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN <= MAX_SCHEDULED_COVERAGE_CANDIDATES);
    const base = Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN / localeEditions.length), remainder = MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN % localeEditions.length;
    const rotationOffset = scanRotation % localeEditions.length;
    for (const [editionIndex, edition] of localeEditions.entries()) {
      const getsExtra = (editionIndex - rotationOffset + localeEditions.length) % localeEditions.length < remainder;
      const expected = base + Number(getsExtra);
      assert.equal(scanCounts.get(edition.id), expected, `${locale}/${edition.id} receives its fair share of this run`);
      assert.equal(catalog.editions[editionIndex].playlistId, finalCandidate.get(edition.id), `${locale}/${edition.id} keeps its best candidate within the cap`);
    }
    assert.equal([...scanCounts.values()].filter(count => count === base + 1).length, remainder, `${locale} distributes leftover scans without exceeding the run cap`);
  }
}

{
  const seen = [], edition = editionList('en')[0], prior = { id: edition.id, name: edition.name, playlistId: playlist(900), title: 'Previously best playlist', channelTitle: 'Previous', url: `https://www.youtube.com/playlist?list=${playlist(900)}`, status: 'PARTIAL_COVERAGE', itemCount: 30, coveredChapters: 25, totalChapters: 1189, chapterSync: true, explicitVerseCueCount: 1, videoIds: [], verseCues: [] };
  const offsets = Object.fromEntries(editionList('en').map(item => [item.id, 0]));
  offsets[edition.id] = 3;
  const catalog = await discoverAudioCatalogLocale({
    locale: 'en', env: {}, waitMs: 0, sleepImpl: async () => {}, candidateOffsets: offsets, previousEditions: [prior],
    searchImpl: async () => Response.json({ locale: 'en', editions: editionList('en').map(item => ({ ...item, items: Array.from({ length: 8 }, (_, index) => ({ mediaType: 'playlist', playlistId: playlist(1000 + index), title: `${item.name} candidate ${index + 1}` })) })) }),
    coverageImpl: async request => { const body = await request.json(); if (body.editionId === edition.id) seen.push(body.playlistId); return Response.json({ status: 'PARTIAL_COVERAGE', itemCount: 12, coveredChapters: 12, totalChapters: 1189, chapterSync: false, explicitVerseCueCount: 0, videoIds: [], verseCues: [] }); }
  });
  assert.deepEqual(seen, [playlist(1003), playlist(1004)], 'per-edition offsets scan the next unvisited candidates');
  assert.equal(catalog.candidateOffsets[edition.id], 5);
  assert.equal(catalog.editions[0].playlistId, prior.playlistId, 'a weaker scan cannot replace the best verified edition');
  assert.equal(catalog.editions[0].coveredChapters, prior.coveredChapters);
}


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
const seenScanRotations = [];
const seenScanLimits = [];
const seenPageTokens = [], seenFallbackPageTokens = [], seenCandidateOffsets = [];
const refresh = (scheduledTime, localeResult, sequence = 0, scanLimit = MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN) => refreshNextAudioCatalog(env, {
  scheduledTime,
  sequence,
  scanLimit,
  discover: async ({ locale, reserveQuota, reserveCoverageQuota, coverageImpl, scanRotation, pageToken, fallbackPageTokens, candidateOffsets: offsets, scanLimit: requestedScanLimit }) => {
    refreshCount++;
    seenScanRotations.push(scanRotation);
    seenScanLimits.push(requestedScanLimit);
    seenPageTokens.push(pageToken);
    seenFallbackPageTokens.push(fallbackPageTokens);
    seenCandidateOffsets.push(offsets);
    assert.equal(locale, localeResult);
    assert.equal(await reserveQuota(), null,'scheduled searches use their reserved daily bucket');
    const scheduledReservations = [];
    const isolatedCoverage = await coverageImpl(new Request('https://worker/youtube/playlist-coverage', { method: 'POST', body: JSON.stringify({ ...coverageBody, playlistId: 'bad' }) }), env, async exhausted => { scheduledReservations.push(!!exhausted); return null; });
    assert.equal(isolatedCoverage.status, 400, 'catalog refresh sends each candidate scan to the Durable Object request boundary');
    assert.deepEqual(scheduledReservations, [false], 'scheduled playlist scans reserve quota before dispatch');
    return { ...discovered, locale, fallbackPageTokenKey: editionList(locale).slice(1).map(edition => edition.id).join(','), editions: editionList(locale).map((edition, index) => ({ ...edition, status: 'PARTIAL_COVERAGE', coveredChapters: index + 1 })) };
  }
});
const first = await refresh(firstTime, audioLanguageList()[0].code, 0, 3);
assert.equal(first.refreshed, true);
assert.equal(first.editionCount, editions.length);
const outOfOrderSequence = await room.fetch(new Request('https://room/internal/youtube-audio-catalog/claim', { method: 'POST', body: JSON.stringify({ day: '2026-10-07', runId: String(firstTime), sequence: 2 }) }));
assert.equal(outOfOrderSequence.status, 409, 'locale batches reject a skipped sequence without advancing the catalog');
assert.equal(storage.get('youtube-audio-catalog:state').pageTokensByLocale.en, 'search-page-3', 'the next search page is stored only after catalog commit');
assert.equal(storage.get('youtube-audio-catalog:state').fallbackPageTokensByLocale.en['NIV,ESV,NKJV,NLT'], 'fallback-page-2');
assert.equal(storage.get('youtube-audio-catalog:state').candidateOffsetsByLocale.en.KJV, 0);
const repeated = await refresh(firstTime, audioLanguageList()[0].code);
assert.equal(repeated.reason, 'already_claimed_this_run');
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

const scheduledLocales = audioLanguageList().map(language => language.code), rotatedLocales = [first.locale];
for (let cron = 0; cron < SCHEDULED_CATALOG_CRONS.length; cron++) {
  const scheduledTime = firstTime + cron * 8 * 60 * 60 * 1000;
  for (let sequence = cron === 0 ? 1 : 0; sequence < SCHEDULED_CATALOG_LOCALES_PER_RUN; sequence++) {
    const expectedLocale = scheduledLocales[rotatedLocales.length % scheduledLocales.length];
    const scanLimit = 2 + Number(sequence < MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN % SCHEDULED_CATALOG_LOCALES_PER_RUN);
    const result = await refresh(scheduledTime, expectedLocale, sequence, scanLimit);
    assert.equal(result.refreshed, true, `scheduled cron ${cron + 1}, batch ${sequence + 1} refreshes ${expectedLocale}`);
    rotatedLocales.push(result.locale);
  }
}
assert.deepEqual(rotatedLocales.slice(0, scheduledLocales.length), scheduledLocales, 'three daily crons refresh all ten locales at least once');
assert.deepEqual(seenScanLimits.slice(0, 1 + SCHEDULED_CATALOG_LOCALES_PER_RUN * SCHEDULED_CATALOG_CRONS.length - 1), [3,3,2,2,3,3,2,2,3,3,2,2], 'each cron shares its ten-scan budget across four locale refreshes');
assert.equal(seenPageTokens[10], 'search-page-3', 'each locale resumes its committed YouTube search page on its next rotation');
assert.deepEqual(seenFallbackPageTokens[10], { 'NIV,ESV,NKJV,NLT': 'fallback-page-2' }, 'edition-specific fallback pages resume independently');
assert.deepEqual(seenCandidateOffsets[10], discovered.candidateOffsets, 'per-edition candidate offsets survive later locale scans');
assert.equal((await refresh(firstTime + 2 * 8 * 60 * 60 * 1000, scheduledLocales[0], 0, 3)).reason, 'already_claimed_this_run');
assert.equal(refreshCount, SCHEDULED_CATALOG_LOCALES_PER_RUN * SCHEDULED_CATALOG_CRONS.length);
assert.deepEqual(seenScanRotations, Array.from({ length: refreshCount }, (_, index) => index), 'candidate scan remainder rotates fairly across locale runs');
assert.equal(MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN * SCHEDULED_CATALOG_CRONS.length, MAX_SCHEDULED_COVERAGE_CANDIDATES, 'three scheduled runs preserve the existing daily scan quota');
assert.ok(SCHEDULED_CATALOG_LOCALES_PER_RUN * 2 * SCHEDULED_CATALOG_CRONS.length <= YOUTUBE_QUOTA_LIMITS.search.scheduled, 'worst-case broad plus fallback searches stay within the scheduled search quota');
assert.equal(MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN, 48, 'batched locale publication and coverage reservations keep worst-case Worker subrequests below the 50-call limit');
assert.ok(MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN < 50);
const scheduledStorage = new Map(), scheduledRoom = new TogetherRoom({ storage: { get: async key => scheduledStorage.get(key), put: async (key, value) => scheduledStorage.set(key, value), delete: async key => scheduledStorage.delete(key), deleteAll: async () => scheduledStorage.clear() } });
let scheduledSearchRequests = 0;
globalThis.fetch = async request => {
  assert.match(String(request), /^https:\/\/www\.googleapis\.com\/youtube\/v3\/search\?/);
  scheduledSearchRequests++;
  return Response.json({ items: [] });
};
try {
  const scheduledLocalesResult = await worker.scheduled({ cron: SCHEDULED_CATALOG_CRONS[0], scheduledTime: firstTime }, { ...env, ROOMS: { idFromName: name => name, get: () => ({ fetch: request => scheduledRoom.fetch(request) }) } });
  assert.equal(scheduledLocalesResult.length, SCHEDULED_CATALOG_LOCALES_PER_RUN);
  assert.deepEqual(scheduledLocalesResult.map(result => result.locale), scheduledLocales.slice(0, SCHEDULED_CATALOG_LOCALES_PER_RUN));
  assert.equal(scheduledStorage.get('youtube-audio-catalog:state').nextIndex, SCHEDULED_CATALOG_LOCALES_PER_RUN, 'one production Cron invocation commits four locale catalogs');
  assert.ok(scheduledSearchRequests <= SCHEDULED_CATALOG_LOCALES_PER_RUN * 2, 'production Cron keeps broad and fallback searches within its reserved calls');
} finally {
  globalThis.fetch = originalFetch;
}
const savedState = storage.get('youtube-audio-catalog:state');
storage.set('youtube-audio-catalog:state', { ...savedState, nextIndex: 0, lastClaimedRun: '', pageTokensByLocale: { en: 'expired-page-token' }, fallbackPageTokensByLocale: { en: { 'NIV,ESV,NKJV,NLT': 'expired-fallback-token' } }, candidateOffsetsByLocale: { en: { KJV: 4 } }, cursorUpdatedAtByLocale: { en: firstTime - 31 * 24 * 60 * 60 * 1000 } });
const expiredClaimResponse = await room.fetch(new Request('https://room/internal/youtube-audio-catalog/claim', { method: 'POST', body: JSON.stringify({ day: '2026-11-08', runId: String(firstTime + scheduledLocales.length * 8 * 60 * 60 * 1000 + 1), sequence: 0 }) }));
const expiredClaim = await expiredClaimResponse.json();
assert.equal(expiredClaim.pageToken, '', 'search cursors expire before YouTube metadata retention exceeds 30 days');
assert.deepEqual(expiredClaim.fallbackPageTokens, {}, 'fallback cursors expire together with the broad-search cursor');
assert.deepEqual(expiredClaim.candidateOffsets, {}, 'expired scan cursors are reset together with their YouTube page token');
console.log('Three-run-per-day YouTube audio catalog contract passed.');
