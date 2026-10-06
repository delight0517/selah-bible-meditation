import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { editionList } from '../together-worker/src/youtube-search.js';
import { refreshAudioCatalog } from './refresh-youtube-audio-catalog.mjs';

const readerHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(readerHtml, /function loadYoutubeAudioCatalog\(locale\)/, 'the web reader loads a locale catalog without a new search click');
assert.match(readerHtml, /catalogBibleAudioSources\(translationId,audioLanguage\)/, 'discovered audio stays attached to the selected text translation');
assert.match(readerHtml, /loadYoutubeAudioCatalog\(selectedYoutubeAudioLanguage\(\)\)/, 'the currently selected audio language is loaded');
assert.match(readerHtml, /priority:"low"/, 'catalog loading stays below critical reader requests');
assert.match(readerHtml, /Date\.now\(\)-generated<=30\*86400000/, 'stale weekly snapshots stop serving automatic recommendations');

const writes = [], requests = [];
const fakeFetch = async (url, options) => {
  const route = new URL(url).pathname, body = JSON.parse(options.body);
  requests.push({ route, body });
  if (route.endsWith('/youtube/search')) return Response.json({ editions: editionList(body.locale).map((edition, index) => {
    const id = `PL${body.locale.replace(/\W/g, '').padEnd(4, 'x')}${String(index).padStart(12, '0')}`;
    return { ...edition, items: index === 0 ? [
      { mediaType: 'playlist', playlistId: id, title: `${edition.name} Matthew 1`, channelTitle: 'Test', url: `https://www.youtube.com/playlist?list=${id}` },
      { mediaType: 'playlist', playlistId: `${id}1`, title: `${edition.name} secondary`, channelTitle: 'Test', url: `https://www.youtube.com/playlist?list=${id}1` }
    ] : [] };
  }) });
  if (route.endsWith('/youtube/playlist-coverage')) {
    if (body.locale === 'en' && body.playlistId.endsWith('000000000000')) return Response.json({ error: 'edition_mismatch' }, { status: 422 });
    if (body.locale === 'es') return Response.json({ error: 'edition_mismatch' }, { status: 422 });
    if (body.locale === 'ja') return Response.json({ error: 'playlist_not_found' }, { status: 404 });
    return Response.json({ status: 'COMPLETE_CHAPTER_COVERAGE', itemCount: 1189, coveredChapters: 1189, totalChapters: 1189, chapterSync: true, explicitVerseCueCount: 7, videoIds: ['abcdefghijk'], verseCues: [{ bookId: 'MAT', chapter: 1, verse: 1, seconds: 4, videoId: 'abcdefghijk', playlistIndex: 0 }] });
  }
  throw new Error(`Unexpected endpoint: ${route}`);
};

const catalogs = await refreshAudioCatalog({ fetchImpl: fakeFetch, sleepImpl: async () => {}, waitMs: 0, now: () => new Date('2026-10-07T00:00:00Z'), writeLocale: async (locale, catalog) => writes.push({ locale, catalog }) });
assert.equal(catalogs.length, 10);
assert.equal(writes.length, 10);
assert.equal(requests.filter(item => item.route.endsWith('/youtube/search')).length, 10, 'one grouped search per audio language');
assert.equal(requests.filter(item => item.route.endsWith('/youtube/playlist-coverage')).length, 13, 'try later playlists after a mismatch or missing playlist');
assert.ok(catalogs.every(catalog => catalog.editions.length >= 5), 'each language preserves five or more edition slots');
const english = catalogs.find(catalog => catalog.locale === 'en');
assert.equal(english.editions[0].status, 'COMPLETE_CHAPTER_COVERAGE');
assert.ok(english.editions[0].playlistId.endsWith('0000000000001'), 'a verified later playlist replaces the mismatched first candidate');
const spanish = catalogs.find(catalog => catalog.locale === 'es');
assert.equal(spanish.editions[0].status, 'EDITION_MISMATCH');
assert.equal(spanish.editions[0].videoIds.length, 0, 'rejected playlists have no video queue for playback');
const korean = catalogs.find(catalog => catalog.locale === 'ko');
assert.equal(korean.editions.length, 6);
assert.deepEqual(korean.editions[0].videoIds, ['abcdefghijk']);
assert.deepEqual(korean.editions[0].verseCues[0], { bookId: 'MAT', chapter: 1, verse: 1, seconds: 4, videoId: 'abcdefghijk', playlistIndex: 0 });
assert.equal(catalogs.find(catalog => catalog.locale === 'ja').editions[0].status, 'PLAYLIST_NOT_FOUND');
assert.equal(catalogs[0].generatedAt, '2026-10-07T00:00:00.000Z');
console.log('Automated YouTube audio catalog contract passed.');
