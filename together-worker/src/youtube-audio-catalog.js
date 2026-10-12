import { editionList, searchYouTube, verifyYouTubePlaylistCoverage } from './youtube-search.js';
import audioBookNames from './audio-book-names.json' with { type: 'json' };
import { MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN } from './youtube-quota.js';

const REQUEST_GAP_MS = 8000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TOTAL_CHAPTERS = 1189;
const chapterCounts = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const chaptersByBook = new Map(Object.keys(audioBookNames.locales.en.books).map((book, index) => [book, chapterCounts[index]]));

function validCues(cues, videoIds = null) {
  const candidates = (Array.isArray(cues) ? cues : []).filter(cue => {
    if (!cue || !/^[\w-]{11}$/.test(cue.videoId || '') ||
        !Number.isInteger(cue.chapter) || cue.chapter < 1 || cue.chapter > (chaptersByBook.get(cue.bookId) || 0) ||
        !Number.isInteger(cue.verse) || cue.verse < 1 ||
        !Number.isFinite(cue.seconds) || cue.seconds < 0) return false;
    if (videoIds && (!Number.isInteger(cue.playlistIndex) || cue.playlistIndex < 0 || videoIds[cue.playlistIndex] !== cue.videoId)) return false;
    return true;
  });
  // Reject the entire ambiguous group, never just its later members.
  const chaptersAtTime = new Map();
  for (const cue of candidates) {
    const key = `${cue.videoId}:${cue.seconds}`;
    if (!chaptersAtTime.has(key)) chaptersAtTime.set(key, new Set());
    chaptersAtTime.get(key).add(`${cue.bookId}:${cue.chapter}`);
  }
  const seen = new Set();
  return candidates.filter(cue => {
    const key = `${cue.videoId}:${cue.seconds}`;
    if (chaptersAtTime.get(key).size > 1) return false;
    const identity = `${key}:${cue.bookId}:${cue.chapter}:${cue.verse}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function validatedCoverage(coverage) {
  if (!coverage) return null;
  const videoIds = Array.isArray(coverage.videoIds) ? coverage.videoIds.slice(0, 1200) : [];
  const verseCues = validCues(coverage.verseCues, videoIds).slice(0, 5000);
  const coveredChapters = new Set(verseCues.filter(cue => cue.verse === 1).map(cue => `${cue.bookId}:${cue.chapter}`)).size;
  return {
    ...coverage, videoIds, verseCues, coveredChapters, totalChapters: TOTAL_CHAPTERS,
    chapterSync: coveredChapters > 0,
    explicitVerseCueCount: Math.max(0, Math.min(Number(coverage.explicitVerseCueCount) || 0, verseCues.length)),
    status: coveredChapters === TOTAL_CHAPTERS ? 'COMPLETE_CHAPTER_COVERAGE' :
      coverage.status === 'NO_PLAYLIST_CANDIDATE' || coverage.status === 'EDITION_MISMATCH' ? coverage.status : 'PARTIAL_COVERAGE'
  };
}

function compactEdition(edition, candidate, coverage, chapterVideo) {
  return {
    id: edition.id,
    name: edition.name,
    ...(candidate ? { playlistId: candidate.playlistId, title: candidate.title, channelTitle: candidate.channelTitle, url: candidate.url } : {}),
    ...(chapterVideo ? { chapterVideo: {
      videoId: chapterVideo.videoId,
      title: chapterVideo.title,
      channelTitle: chapterVideo.channelTitle,
      url: `https://www.youtube.com/watch?v=${chapterVideo.videoId}`,
      cueKind: chapterVideo.cueKind,
      verseCues: validCues(chapterVideo.verseCues).filter(cue => cue.videoId === chapterVideo.videoId && cue.bookId === 'MAT' && cue.chapter === 1).slice(0, 300)
    } } : {}),
    status: coverage?.status || 'NO_PLAYLIST_CANDIDATE',
    ...(coverage ? {
      itemCount: Number(coverage.itemCount) || 0,
      coveredChapters: Number(coverage.coveredChapters) || 0,
      totalChapters: TOTAL_CHAPTERS,
      chapterSync: !!coverage.chapterSync,
      explicitVerseCueCount: Number(coverage.explicitVerseCueCount) || 0,
      videoIds: (coverage.videoIds || []).map(id => /^[\w-]{11}$/.test(id) ? id : '').slice(0, 1200),
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
  scanLimit = MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN,
  scanRotation = 0,
  candidateOffsets = {},
  pageToken = '',
  fallbackPageTokens = {},
  previousEditions = [],
  waitMs = REQUEST_GAP_MS,
  now = () => new Date()
}) {
  const bookName = audioBookNames.locales[locale]?.books.MAT?.[0];
  if (!bookName || !editionList(locale).length) throw new Error(`unsupported_audio_locale:${locale}`);

  const searchResponse = await searchImpl(new Request('https://worker/youtube/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale, bookId: 'MAT', bookName, chapter: 1 })
  }), env, reserveQuota, { playlistOnly: false, pageToken, fallbackPageTokens });
  const search = await searchResponse.json().catch(() => null);
  if (!searchResponse.ok || !search || search.locale !== locale) throw new Error(search?.error || `audio_search_failed:${searchResponse.status}`);

  const expectedEditions = editionList(locale), groups = search.editions || [];
  if (groups.length !== expectedEditions.length || new Set(groups.map(group => group.id)).size !== expectedEditions.length) {
    throw new Error(`incomplete_audio_edition_groups:${locale}`);
  }

  let lastRequest = Date.now();
  const baseCandidateLimit = Math.floor(scanLimit / expectedEditions.length);
  const extraCandidateCount = scanLimit % expectedEditions.length;
  const rotationOffset = ((Math.trunc(scanRotation) || 0) % expectedEditions.length + expectedEditions.length) % expectedEditions.length;
  const previousById = new Map(previousEditions.map(edition => [edition.id, edition]));
  const editions = [], nextCandidateOffsets = {};
  for (const [editionIndex, edition] of expectedEditions.entries()) {
    const group = groups.find(item => item.id === edition.id);
    if (!group) throw new Error(`audio_edition_missing:${locale}/${edition.id}`);
    const getsExtraCandidate = (editionIndex - rotationOffset + expectedEditions.length) % expectedEditions.length < extraCandidateCount;
    const maxCandidates = baseCandidateLimit + Number(getsExtraCandidate);
    const candidates = (group.items || []).filter(item => item.mediaType === 'playlist' && /^[\w-]{10,128}$/.test(item.playlistId || ''));
    const chapterVideo = (group.items || [])
      .filter(item => item.mediaType === 'video' && item.fullChapterMatch === true && /^[\w-]{11}$/.test(item.videoId || ''))
      .sort((a, b) => ({ verse: 0, chapter: 1, none: 2 }[a.cueKind] ?? 3) - ({ verse: 0, chapter: 1, none: 2 }[b.cueKind] ?? 3))[0] || null;
    const candidateOffset = candidates.length ? ((Math.trunc(Number(candidateOffsets[edition.id])) || 0) % candidates.length + candidates.length) % candidates.length : 0;
    const scanCandidates = candidates.length
      ? Array.from({ length: Math.min(maxCandidates, candidates.length) }, (_, index) => candidates[(candidateOffset + index) % candidates.length])
      : [];
    const previous = previousById.get(edition.id);
    let selected = previous?.playlistId ? { playlistId: previous.playlistId, title: previous.title, channelTitle: previous.channelTitle, url: previous.url } : null;
    let bestCoverage = previous && previous.status !== 'NO_PLAYLIST_CANDIDATE' ? validatedCoverage(previous) : null;
    let scannedCount = 0;

    for (const candidate of scanCandidates) {
      scannedCount++;
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
      const currentCoverage = validatedCoverage(result);
      // Revalidation supersedes old evidence for this playlist, even when counts fall.
      if (!bestCoverage || selected?.playlistId === candidate.playlistId || coverageScore(currentCoverage) > coverageScore(bestCoverage)) {
        selected = candidate;
        bestCoverage = currentCoverage;
      }
      if (currentCoverage.status === 'COMPLETE_CHAPTER_COVERAGE') break;
    }

    nextCandidateOffsets[edition.id] = candidates.length ? (candidateOffset + scannedCount) % candidates.length : 0;
    editions.push(compactEdition(edition, selected, bestCoverage, chapterVideo));
  }

  return {
    schema: 1,
    locale,
    generatedAt: now().toISOString(),
    query: { bookId: 'MAT', chapter: 1 },
    editions,
    nextPageToken: typeof search.nextPageToken === 'string' ? search.nextPageToken.slice(0, 512) : '',
    fallbackPageTokenKey: typeof search.fallbackPageTokenKey === 'string' ? search.fallbackPageTokenKey.slice(0, 128) : '',
    fallbackNextPageToken: typeof search.fallbackNextPageToken === 'string' ? search.fallbackNextPageToken.slice(0, 512) : '',
    candidateOffsets: nextCandidateOffsets
  };
}
