import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const chapterCopyStart = html.indexOf('const bibleAudioChapterCopy=');
const chapterCopyEnd = html.indexOf(';', chapterCopyStart);
assert.ok(chapterCopyStart >= 0 && chapterCopyEnd > chapterCopyStart, 'chapter-follow copy exists');
const chapterCopyContext = {};
vm.runInNewContext(`${html.slice(chapterCopyStart, chapterCopyEnd)}; globalThis.copy = bibleAudioChapterCopy;`, chapterCopyContext);
for (const [locale, copy] of Object.entries(chapterCopyContext.copy)) {
  assert.doesNotMatch(copy.instructions, /NLT|28/, `${locale} chapter-follow instructions use the actual source instead of a fixed Bible edition or cue count`);
  assert.match(copy.count, /\{count\}/, `${locale} chapter-follow count uses the catalog's verified cue count`);
}
const cueStart = html.indexOf('function youtubeAudioHasPassageCue(');
const cueEnd = html.indexOf('\nfunction youtubeAudioItemMatchesPassage', cueStart);
assert.ok(cueStart >= 0 && cueEnd > cueStart, 'shared playlist cue validator exists');
const cueContext = {};
vm.runInNewContext(`${html.slice(cueStart, cueEnd)}\nglobalThis.matches = youtubeAudioHasPassageCue; globalThis.canStart = youtubeAudioCanStartAtPassage;`, cueContext);
const passageCue = { bookId: 'JHN', chapter: 1, verse: 1, seconds: 0, videoId: '4kVZKeuS90E', playlistIndex: 42 };
const verifiedPlaylist = { generated: true, mediaType: 'playlist', verseCues: [passageCue], videoIds: Array.from({ length: 43 }, (_, index) => index === 42 ? passageCue.videoId : 'abcdefghijk') };
assert.equal(cueContext.matches(verifiedPlaylist, 'JHN', 1), true, 'a passage cue starts only when its playlist index maps to that exact video');
assert.equal(cueContext.canStart(verifiedPlaylist, 'JHN', 1), true, 'a matching generated playlist is playable for its verified passage');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, videoIds: ['abcdefghijk'] }, 'JHN', 1), false, 'a generated playlist with a mismatched video cannot start');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, verseCues: [{ ...passageCue, playlistIndex: undefined }] }, 'JHN', 1), false, 'a cue without a verified playlist index cannot start');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, verseCues: [{ ...passageCue, chapter: 2 }] }, 'JHN', 1), false, 'a cue from another chapter cannot start');
assert.equal(cueContext.canStart({ generated: false, mediaType: 'playlist' }, 'JHN', 1), true, 'manually added sources retain their existing playback behavior');
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
console.log('PASS: chapter-follow copy uses actual catalog counts; playlist cues map to the selected passage; catalog retries use GET only.');
