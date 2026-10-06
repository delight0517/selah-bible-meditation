import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { editionList } from '../together-worker/src/youtube-search.js';
import audioBookNames from '../together-worker/src/audio-book-names.json' with { type: 'json' };

const DEFAULT_ENDPOINT = 'https://selah-together.imdisablebutgodisable.workers.dev';
const WAIT_MS = 8000;
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
      verseCues: (coverage.verseCues || []).filter(cue => /^[\w-]{11}$/.test(cue.videoId || '') && Number.isInteger(cue.playlistIndex)).map(({ bookId, chapter, verse, seconds, videoId, playlistIndex }) => ({ bookId, chapter, verse, seconds, videoId, playlistIndex })).slice(0, 5000)
    } : {})
  };
}

export async function refreshAudioCatalog({
  endpoint = DEFAULT_ENDPOINT,
  locales = Object.keys(audioBookNames.locales),
  fetchImpl = fetch,
  sleepImpl = sleep,
  waitMs = WAIT_MS,
  now = () => new Date(),
  writeLocale = async () => {}
} = {}) {
  let lastRequest = 0;
  const request = async (route, body, acceptedStatuses = []) => {
    const remaining = waitMs - (Date.now() - lastRequest);
    if (lastRequest && remaining > 0) await sleepImpl(remaining);
    lastRequest = Date.now();
    const response = await fetchImpl(`${endpoint}${route}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok && !acceptedStatuses.includes(response.status)) throw new Error(`${route} returned HTTP ${response.status}${data?.error ? ` (${data.error})` : ''}`);
    return { ...data, httpStatus: response.status };
  };

  const catalogs = [];
  for (const locale of locales) {
    const bookName = audioBookNames.locales[locale]?.books.MAT?.[0];
    if (!bookName) throw new Error(`No Matthew title configured for ${locale}`);
    const search = await request('/youtube/search', { locale, bookId: 'MAT', bookName, chapter: 1 });
    const groups = search.editions || [], configured = editionList(locale);
    if (groups.length !== configured.length || new Set(groups.map(group => group.id)).size !== configured.length) throw new Error(`Search returned an incomplete edition list for ${locale}`);
    const editions = [];
    for (const expected of configured) {
      const group = groups.find(item => item.id === expected.id);
      if (!group) throw new Error(`Search omitted ${locale}/${expected.id}`);
      const candidates = (group.items || []).filter(item => item.mediaType === 'playlist' && item.playlistId).slice(0, 5);
      if (!candidates.length) {
        editions.push(compactEdition(group, null, null));
        continue;
      }
      let selected = null, coverage = null;
      for (const candidate of candidates) {
        const result = await request('/youtube/playlist-coverage', { locale, editionId: group.id, playlistId: candidate.playlistId, bookId: 'MAT', chapter: 1 }, [404, 422]);
        const checked = result.httpStatus === 422 ? { status: 'EDITION_MISMATCH' }
          : result.httpStatus === 404 ? { status: 'PLAYLIST_NOT_FOUND' }
          : result.status === 'COMPLETE_CHAPTER_COVERAGE' || result.status === 'PARTIAL_COVERAGE' ? result
            : { status: result.status || 'UNVERIFIED' };
        if (!coverage || checked.status === 'COMPLETE_CHAPTER_COVERAGE' || (checked.status === 'PARTIAL_COVERAGE' && coverage.status !== 'PARTIAL_COVERAGE')) {
          selected = candidate;
          coverage = checked;
        }
        if (checked.status === 'COMPLETE_CHAPTER_COVERAGE') break;
      }
      editions.push(compactEdition(group, selected, coverage));
    }
    const catalog = { schema: 1, locale, generatedAt: now().toISOString(), query: { bookId: 'MAT', chapter: 1 }, editions };
    await writeLocale(locale, catalog);
    catalogs.push(catalog);
  }
  return catalogs;
}

async function main() {
  const outputDir = path.resolve(process.argv[2] || 'assets/youtube-audio-catalog');
  await mkdir(outputDir, { recursive: true });
  await refreshAudioCatalog({ writeLocale: async (locale, catalog) => {
    const target = path.join(outputDir, `${locale}.json`), temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(catalog)}\n`);
    await rename(temporary, target);
  } });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`YouTube audio catalog refresh failed: ${error.message}`); process.exitCode = 1; });
}
