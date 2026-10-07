import { editionList, searchYouTube, verifyYouTubePlaylistCoverage } from './youtube-search.js';
import audioBookNames from './audio-book-names.json' with { type: 'json' };

const MAX_CANDIDATES = 5;
const REQUEST_GAP_MS = 8000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function compactEdition(edition, candidate, coverage) {
  return {
    id: edition.id,
    name: edition.name,
    ...(candidate ? { playlistId: candidate.playlistId, title: candidate.title, channelTitle: candidate.channelTitle, url: candidate.url } : {}),
    status: coverage?.status || 'NO_PLAYLIST_CANDIDATE',
    ...(coverage ? {
      itemCount: Number(coverage.itemCount) || 0,
      coveredChapters: Number(coverage.coveredChapters) || 0,
      totalChapters: Number(coverage.totalChapters) || 1189,
      chapterSync: !!coverage.chapterSync,
      explicitVerseCueCount: Number(coverage.explicitVerseCueCount) || 0,
      videoIds: (coverage.videoIds || []).filter(id => /^[\w-]{11}$/.test(id)).slice(0, 1200),
      verseCues: (coverage.verseCues || [])
        .filter(cue => /^[\w-]{11}$/.test(cue.videoId || '') && Number.isInteger(cue.playlistIndex))
        .map(({ bookId, chapter, verse, seconds, videoId, playlistIndex }) => ({ bookId, chapter, verse, seconds, videoId, playlistIndex }))
        .slice(0, 5000)
    } : {})
  };
}

function coverageScore(coverage) {
  if (coverage?.status === 'COMPLETE_CHAPTER_COVERAGE') return Number.MAX_SAFE_INTEGER;
  return (Number(coverage?.coveredChapters) || 0) * 100 + (coverage?.chapterSync ? 10 : 0) + (Number(coverage?.explicitVerseCueCount) || 0);
}

export async function discoverAudioCatalogLocale({
  locale,
  env,
  reserveQuota,
  reserveCoverageQuota,
  searchImpl = searchYouTube,
  coverageImpl = verifyYouTubePlaylistCoverage,
  sleepImpl = sleep,
  waitMs = REQUEST_GAP_MS,
  now = () => new Date()
}) {
  const bookName = audioBookNames.locales[locale]?.books.MAT?.[0];
  if (!bookName || !editionList(locale).length) throw new Error(`unsupported_audio_locale:${locale}`);

  const searchResponse = await searchImpl(new Request('https://worker/youtube/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale, bookId: 'MAT', bookName, chapter: 1 })
  }), env, reserveQuota);
  const search = await searchResponse.json().catch(() => null);
  if (!searchResponse.ok || !search || search.locale !== locale) throw new Error(search?.error || `audio_search_failed:${searchResponse.status}`);

  const expectedEditions = editionList(locale), groups = search.editions || [];
  if (groups.length !== expectedEditions.length || new Set(groups.map(group => group.id)).size !== expectedEditions.length) {
    throw new Error(`incomplete_audio_edition_groups:${locale}`);
  }

  let lastRequest = Date.now();
  const editions = [];
  for (const edition of expectedEditions) {
    const group = groups.find(item => item.id === edition.id);
    if (!group) throw new Error(`audio_edition_missing:${locale}/${edition.id}`);
    const candidates = (group.items || []).filter(item => item.mediaType === 'playlist' && /^[\w-]{10,128}$/.test(item.playlistId || '')).slice(0, MAX_CANDIDATES);
    let selected = null, bestCoverage = null;

    for (const candidate of candidates) {
      const remaining = waitMs - (Date.now() - lastRequest);
      if (lastRequest && remaining > 0) await sleepImpl(remaining);
      lastRequest = Date.now();
      const response = await coverageImpl(new Request('https://worker/youtube/playlist-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, editionId: edition.id, playlistId: candidate.playlistId, bookId: 'MAT', chapter: 1 })
      }), env, reserveCoverageQuota);
      const result = await response.json().catch(() => null);
      if (response.status === 404) continue;
      if (response.status === 422) {
        if (!bestCoverage) { selected = candidate; bestCoverage = { status: 'EDITION_MISMATCH' }; }
        continue;
      }
      if (response.status === 403 || response.status === 429) throw new Error(result?.error || 'youtube_quota_unavailable');
      if (!response.ok || !result) throw new Error(result?.error || `playlist_coverage_failed:${response.status}`);
      if (!bestCoverage || coverageScore(result) > coverageScore(bestCoverage)) {
        selected = candidate;
        bestCoverage = result;
      }
      if (result.status === 'COMPLETE_CHAPTER_COVERAGE') break;
    }

    editions.push(compactEdition(edition, selected, bestCoverage));
  }

  return { schema: 1, locale, generatedAt: now().toISOString(), query: { bookId: 'MAT', chapter: 1 }, editions };
}
