import assert from 'node:assert/strict';
import worker, { TogetherRoom, refreshNextAudioCatalog } from '../together-worker/src/index.js';
import { audioLanguageList, editionList } from '../together-worker/src/youtube-search.js';
import { discoverAudioCatalogLocale } from '../together-worker/src/youtube-audio-catalog.js';

const editions = editionList('en');
const playlist = index => `PL${String(index).padStart(20, '0')}`;
let searchCount = 0, coverageCount = 0;
const discovered = await discoverAudioCatalogLocale({
  locale: 'en', env: {}, waitMs: 0, sleepImpl: async () => {}, now: () => new Date('2026-10-07T08:20:00Z'),
  searchImpl: async request => {
    searchCount++;
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
  coverageImpl: async request => {
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
const env = { ROOMS: rooms };
const firstTime = Date.parse('2026-10-07T08:20:00Z');
let refreshCount = 0;
const refresh = (scheduledTime, localeResult) => refreshNextAudioCatalog(env, {
  scheduledTime,
  discover: async ({ locale }) => {
    refreshCount++;
    assert.equal(locale, localeResult);
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

const next = await refresh(Date.parse('2026-10-08T08:20:00Z'), audioLanguageList()[1].code);
assert.equal(next.refreshed, true);
assert.equal(refreshCount, 2);
console.log('Scheduled YouTube audio catalog contract passed.');
