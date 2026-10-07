import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const label of ['닫고 재생 중지', 'Close and stop playback', '閉じて再生を停止', '关闭并停止播放', '關閉並停止播放', 'Isara at ihinto ang playback', 'Cerrar y detener la reproducción', 'Fechar e parar a reprodução']) {
  assert.ok(html.includes(`dismiss:"${label}"`), `audio dismissal is localized: ${label}`);
}
assert.ok(html.includes('playingBibleAudio=source.id;setBibleAudioMinimized(true);renderBibleAudioSetup({autoplayRequested:true})}'), 'the reading-page audio control opens the visible lower-right mini player and explicitly requests YouTube playback');
assert.ok(html.includes('playingBibleAudio=sourceId;setBibleAudioMinimized(true);renderBibleAudioSetup()}'), 'playing a saved source starts in the compact player instead of expanding a large video in the reading setup');
assert.ok(html.includes('playingBibleAudio=record.id;setBibleAudioMinimized(true);renderBibleAudioSetup();'), 'saving a YouTube source also keeps its initial player compact');
assert.ok(html.includes('function renderBibleAudioSetup({autoplayRequested=false}={})'), 'autoplay stays opt-in and is disabled for page-load and ordinary rerenders');
assert.ok(html.includes('if(autoplayRequested)hostUrl.searchParams.set("autoplay","1")'), 'the hosted player receives autoplay only for an explicit reader play request');
assert.ok(html.includes('if(autoplayRequested)params.set("autoplay","1")'), 'direct YouTube embeds receive autoplay only for an explicit reader play request');
assert.ok(html.includes('if(startCue?.playlistIndex!=null)params.set("index",String(startCue.playlistIndex))'), 'direct playlist embeds retain the verified passage playlist index');
assert.ok(html.includes('playVideo:()=>send("play")'), 'the reading-page play control can resume the existing hosted mini player');
assert.ok(html.includes('function dismissBibleAudioPlayer(){playingBibleAudio="";resetBibleAudioYouTubePlayer();$("bibleAudioPlayerVideo").replaceChildren();$("bibleAudioPlayer").hidden=true;'), 'dismissing the mini player stops and removes its YouTube frame');
assert.ok(html.includes('if(dx<55||dx<Math.abs(dy)*1.35)return;event.preventDefault();suppressBibleAudioPlayerClickUntil=Date.now()+500;dismissBibleAudioPlayer()}'), 'a right swipe on the mini-player bar dismisses it without firing a control click');
assert.ok(html.includes('id="readerAudioFocusPlay"') && html.includes('body.mobile-reading-focus .reader-audio-focus-play:not([hidden]){display:inline-flex;'), 'mobile focus reading exposes a compact play button when a passage source exists');
assert.ok(html.includes('focusQuick.hidden=!primary;focusQuick.setAttribute("aria-label",focusAudioLabel);focusQuick.title=focusAudioLabel;'), 'focus play stays hidden without a passage source and receives localized accessible text');
assert.ok(html.includes('readerAudioFocusPlay").addEventListener("click",()=>$("readerAudioPrimary").click())'), 'focus play routes through the existing reader autoplay handler');
assert.ok(html.includes('source=selectBibleAudioPrimarySource(visibleBibleAudioSources(translationId),preferred,activeBibleBookId'), 'reader play chooses the same passage-compatible source as its displayed primary');
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
cueContext.youtubeAudioVideoId = value => new URL(value).searchParams.get('v') || '';
vm.runInNewContext(`${html.slice(cueStart, cueEnd)}\nglobalThis.matches = youtubeAudioHasPassageCue; globalThis.canStart = youtubeAudioCanStartAtPassage; globalThis.selectPrimary = selectBibleAudioPrimarySource;`, cueContext);
const passageCue = { bookId: 'JHN', chapter: 1, verse: 1, seconds: 0, videoId: '4kVZKeuS90E', playlistIndex: 42 };
const verifiedPlaylist = { generated: true, mediaType: 'playlist', verseCues: [passageCue], videoIds: Array.from({ length: 43 }, (_, index) => index === 42 ? passageCue.videoId : 'abcdefghijk') };
assert.equal(cueContext.matches(verifiedPlaylist, 'JHN', 1), true, 'a passage cue starts only when its playlist index maps to that exact video');
const staleRangeCues = [passageCue, { ...passageCue, chapter: 21 }];
assert.equal(cueContext.matches({ ...verifiedPlaylist, verseCues: staleRangeCues }, 'JHN', 21), false, 'legacy whole-book range data cannot send a later chapter to the same video 0-second start');
assert.equal(cueContext.canStart(verifiedPlaylist, 'JHN', 1), true, 'a matching generated playlist is playable for its verified passage');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, videoIds: ['abcdefghijk'] }, 'JHN', 1), false, 'a generated playlist with a mismatched video cannot start');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, verseCues: [{ ...passageCue, playlistIndex: undefined }] }, 'JHN', 1), false, 'a cue without a verified playlist index cannot start');
assert.equal(cueContext.canStart({ ...verifiedPlaylist, verseCues: [{ ...passageCue, chapter: 2 }] }, 'JHN', 1), false, 'a cue from another chapter cannot start');
assert.equal(cueContext.canStart({ generated: false, mediaType: 'playlist' }, 'JHN', 1), true, 'manually added sources retain their existing playback behavior');
const chapterVideoId = 'jpnvideo000';
const chapterVideo = { generated: true, mediaType: 'video', url: `https://www.youtube.com/watch?v=${chapterVideoId}`, videoIds: [chapterVideoId], bookId: 'MAT', chapter: 1, chapterMatch: true, verseCues: [] };
assert.equal(cueContext.canStart(chapterVideo, 'MAT', 1), true, 'an automatically cataloged exact-chapter video can play its matching chapter');
assert.equal(cueContext.canStart(chapterVideo, 'MAT', 2), false, 'an automatically cataloged single-chapter video cannot be mistaken for another chapter');
const videoVerseCue = { ...passageCue, videoId: chapterVideoId, playlistIndex: undefined };
assert.equal(cueContext.canStart(chapterVideo, 'JHN', 1), false, 'a chapter-matched video cannot cross books');
assert.equal(cueContext.canStart({ ...chapterVideo, bookId: 'JHN', chapterMatch: false, verseCues: [videoVerseCue] }, 'JHN', 1), true, 'an exact video ID and verse cue can start a chapter video even without a playlist index');
const unalignedKoreanPlaylist = { id: 'nkrv', generated: true, curated: true, mediaType: 'playlist', verseCues: [], videoIds: [] };
const alignedKoreanPlaylist = { ...verifiedPlaylist, id: 'ksb', title: '새번역', bookId: 'MAT', verseCues: [{ ...passageCue, bookId: 'MAT' }] };
assert.equal(cueContext.selectPrimary([unalignedKoreanPlaylist, alignedKoreanPlaylist], null, 'MAT', 1)?.id, 'ksb', 'reader playback skips an earlier generated edition with no matching verse cue');
assert.equal(cueContext.selectPrimary([unalignedKoreanPlaylist, alignedKoreanPlaylist], 'nkrv', 'MAT', 1)?.id, 'ksb', 'an unavailable preferred cue falls back to the same eligible source shown in the reader');
assert.ok(html.includes('selectedVideoId=startCue?.videoId||(videoIds.length?videoIds[0]:"");if(selectedVideoId)hostUrl.searchParams.set("video",selectedVideoId)'), 'generated playback opens the exact video verified by the selected passage cue');
assert.ok(html.includes('Number.isInteger(cue.playlistIndex)||media.kind==="video"&&cue.videoId===media.id'), 'single-video verse cues start at their own timestamp without requiring a playlist index');
assert.ok(html.includes('if(startCue?.seconds>0)hostUrl.searchParams.set("startSeconds",String(startCue.seconds))'), 'generated playback passes the cue timestamp to the hosted player');
assert.ok(html.includes('startBibleAudioYouTubePlayer(iframe,playing.id)}'), 'generated playback does not replace the verified video with the full playlist queue');
const catalogSourceStart = html.indexOf('function youtubeAudioPrimaryEditionId(');
const catalogSourceEnd = html.indexOf('\nfunction visibleBibleAudioSources', catalogSourceStart);
assert.ok(catalogSourceStart >= 0 && catalogSourceEnd > catalogSourceStart, 'catalog source adapter exists');
const catalogVideoId = 'jpnvideo000';
const catalogContext = {
  encodeURIComponent,
  db: {},
  youtubeAudioCatalogData: new Map([
    ['ja', { editions: [{ id: 'JPN1965', name: '口語訳', status: 'NO_PLAYLIST_CANDIDATE', chapterVideo: { videoId: catalogVideoId, title: 'マタイ 1章', cueKind: 'verse', verseCues: [{ bookId: 'MAT', chapter: 1, verse: 2, seconds: 20, videoId: catalogVideoId }] } }] }],
    ['ko', { editions: [
      { id: 'NKRV', name: '개역개정', status: 'PARTIAL_COVERAGE', playlistId: 'PL000000000000000001', coveredChapters: 0, videoIds: [], verseCues: [] },
      { id: 'KSB', name: '새번역', status: 'PARTIAL_COVERAGE', playlistId: 'PL000000000000000002', coveredChapters: 113, chapterSync: true, explicitVerseCueCount: 0, videoIds: [], verseCues: [] }
    ] }]
  ]),
  bibleAudioCopy: () => ({ cues: 'verse timestamps', chapter: 'chapter start', uncued: 'no timestamps' }),
  youtubeCoverageLabel: () => 'playlist coverage'
};
vm.runInNewContext(`${html.slice(catalogSourceStart, catalogSourceEnd)}\nglobalThis.mapCatalog = catalogBibleAudioSources; globalThis.primaryEdition = youtubeAudioPrimaryEditionId;`, catalogContext);
const catalogSources = catalogContext.mapCatalog('translation', 'ja');
assert.equal(catalogSources.length, 1, 'cataloged videos work without a playlist');
assert.equal(catalogSources[0].mediaType, 'video');
assert.equal(catalogSources[0].chapter, 1);
assert.equal(catalogSources[0].sourceLabel, 'verse timestamps');
assert.equal(catalogSources[0].verseCues[0].videoId, catalogVideoId, 'cataloged verse timing remains attached to its exact video');
const koreanCatalogSources = catalogContext.mapCatalog('translation', 'ko');
assert.equal(koreanCatalogSources.length, 1, 'the Korean audio catalog exposes one primary edition instead of a candidate list');
assert.equal(koreanCatalogSources[0].edition, '새번역', 'the highest-coverage Korean edition is the stable primary audio version');
assert.equal(catalogContext.primaryEdition('ko', [{ id: 'KSB' }, { id: 'NKRV' }]), 'KSB');
catalogContext.db.youtubeAudioEditionDefaults = { ko: 'KSB' };
catalogContext.youtubeAudioCatalogData.set('ko', { editions: [
  { id: 'NKRV', name: '개역개정', status: 'PARTIAL_COVERAGE', playlistId: 'PL000000000000000001', coveredChapters: 120, chapterSync: false },
  { id: 'KSB', name: '새번역', status: 'PARTIAL_COVERAGE', playlistId: 'PL000000000000000002', coveredChapters: 113, chapterSync: true }
] });
assert.equal(catalogContext.primaryEdition('ko', [{ id: 'KSB' }, { id: 'NKRV' }]), 'KSB', 'the first chosen audio edition stays fixed across chapters');
assert.equal(catalogContext.primaryEdition('ko', [{ id: 'NKRV' }]), null, 'a missing pinned edition never silently switches the language to another translation');
delete catalogContext.db.youtubeAudioEditionDefaults.ko;
assert.equal(catalogContext.primaryEdition('ko', [{ id: 'KSB' }, { id: 'NKRV' }]), 'NKRV', 'broader chapter coverage outranks chapter-sync metadata for the initial edition choice');
assert.ok(html.includes('searchYoutubeBibleAudio({playAfterSearch:true})'), 'the Scripture play button searches the chosen edition when no passage-matched source exists');
assert.ok(html.includes('renderBibleAudioSetup({autoplayRequested:true})'), 'a found chapter-matched video is sent to YouTube autoplay after the Scripture play gesture');
const followStart = html.indexOf('function latestBibleAudioCue(');
const followEnd = html.indexOf('\nfunction syncBibleAudioVerse', followStart);
assert.ok(followStart >= 0 && followEnd > followStart, 'audio follow cue selector exists');
const followContext = {};
vm.runInNewContext(`${html.slice(followStart, followEnd)}\nglobalThis.selectCue = latestBibleAudioCue;`, followContext);
const sameTimeCues = [
  { bookId: 'JHN', chapter: 21, verse: 1, seconds: 0, videoId: '4kVZKeuS90E', playlistIndex: 42 },
  { bookId: 'JHN', chapter: 1, verse: 1, seconds: 0, videoId: '4kVZKeuS90E', playlistIndex: 42 },
  { bookId: 'JHN', chapter: 1, verse: 2, seconds: 10, videoId: '4kVZKeuS90E', playlistIndex: 42 }
];
assert.equal(followContext.selectCue(sameTimeCues, '4kVZKeuS90E', 0).chapter, 1, 'when a stale later chapter shares time zero, Scripture following starts at the first chapter');
assert.equal(followContext.selectCue(sameTimeCues, '4kVZKeuS90E', 10).verse, 2, 'a later timestamp still advances to its exact verse');
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
