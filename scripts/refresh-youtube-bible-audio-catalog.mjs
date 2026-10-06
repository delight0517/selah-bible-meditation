import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const API = 'https://www.googleapis.com/youtube/v3';
const CATALOG_OUTPUT_DIR = process.env.CATALOG_OUTPUT_DIR || '.youtube-bible-audio-catalog';
const LANGUAGES = {
  en: { label: 'English', queryLanguage: 'en', phrase: 'Bible audio full book playlist', catalog: 'ENGWEBP', editions: [['KJV', 'King James Version'], ['NIV', 'New International Version'], ['ESV', 'English Standard Version'], ['NKJV', 'New King James Version'], ['NLT', 'New Living Translation']] },
  ko: { label: '한국어', queryLanguage: 'ko', phrase: '성경 오디오 전체 재생목록', catalog: 'kor_old', editions: [['KRV', '개역한글'], ['NKRV', '개역개정'], ['KSB', '새번역'], ['KCB', '공동번역'], ['KLB', '우리말성경']] },
  ja: { label: '日本語', queryLanguage: 'ja', phrase: '聖書 全巻 オーディオ 再生リスト', catalog: 'jpn_loc', editions: [['JPN1965', '口語訳'], ['新改訳', '新改訳聖書'], ['新共同訳', '新共同訳聖書'], ['聖書協会共同訳', '聖書協会共同訳'], ['リビングバイブル', 'リビングバイブル']] },
  'zh-CN': { label: '简体中文', queryLanguage: 'zh-CN', phrase: '有声圣经 全书 播放列表', catalog: 'cmn_cu1', editions: [['CUV-S', '和合本 简体'], ['CNV-S', '新译本 简体'], ['当代译本', '当代译本'], ['中文标准译本', '中文标准译本'], ['环球圣经译本', '环球圣经译本']] },
  'zh-TW': { label: '繁體中文', queryLanguage: 'zh-TW', phrase: '有聲聖經 全書 播放清單', catalog: 'cmn_cuv', editions: [['CUV-T', '和合本 繁體'], ['CNV-T', '新譯本'], ['現代中文譯本', '現代中文譯本'], ['環球聖經譯本', '環球聖經譯本'], ['呂振中譯本', '呂振中譯本']] },
  fil: { label: 'Filipino', queryLanguage: 'tl', phrase: 'buong Bibliya audio playlist', catalog: 'ENGWEBP', editions: [['AB1905', 'Ang Biblia 1905'], ['MBB', 'Magandang Balita Biblia'], ['ASD', 'Ang Salita ng Dios'], ['AB2001', 'Ang Biblia 2001'], ['ADB', 'Ang Dating Biblia']] },
  es: { label: 'Español', queryLanguage: 'es', phrase: 'Biblia completa en audio lista de reproducción', catalog: 'ENGWEBP', editions: [['RVR1960', 'Reina-Valera 1960'], ['NVI', 'Nueva Versión Internacional'], ['NTV', 'Nueva Traducción Viviente'], ['LBLA', 'La Biblia de las Américas'], ['TLA', 'Traducción en Lenguaje Actual']] },
  'pt-BR': { label: 'Português do Brasil', queryLanguage: 'pt', phrase: 'Bíblia completa em áudio playlist', catalog: 'ENGWEBP', editions: [['ARC', 'Almeida Revista e Corrigida'], ['NVI', 'Nova Versão Internacional'], ['NAA', 'Nova Almeida Atualizada'], ['ARA', 'Almeida Revista e Atualizada'], ['NTLH', 'Nova Tradução na Linguagem de Hoje']] },
  ru: { label: 'Русский', queryLanguage: 'ru', phrase: 'Библия аудио весь плейлист', catalog: 'rus_syn', editions: [['SYN', 'Синодальный перевод'], ['СРП', 'Современный русский перевод'], ['РБО', 'Радостная весть'], ['НРП', 'Новый русский перевод'], ['Кулаков', 'Перевод Кулакова']] },
  uk: { label: 'Українська', queryLanguage: 'uk', phrase: 'Біблія аудіо повний плейлист', catalog: 'ukr_ufb', editions: [['Огієнка', 'Переклад Огієнка'], ['УТТ', 'Український Турконяк'], ['Хоменка', 'Переклад Хоменка'], ['UBS2019', 'Український біблійний переклад 2019'], ['УКУ', 'Переклад УКУ']] },
};

function readBookCatalogs(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context, { timeout: 1000 });
  return context.window.SelahBibleBookCatalogs;
}

const ENGLISH_NAMES = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
};

function parseChapterTitle(title, books) {
  const normalized = title.normalize('NFKC').toLocaleLowerCase();
  const aliases = books.flatMap(book => [...new Set([book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean).map(value => value.normalize('NFKC').toLocaleLowerCase()))].map(alias => ({ book, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  for (const { book, alias } of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|[\\s·:|—–-])${escaped}(?=$|[\\s.,:：#章장])\\s*(?:chapter|chap(?:ter)?\\.?|ch\\.?|глава|гл\\.?|capítulo|cap[ií]tulo|cap\\.?|capitolo)?\\s*[:#.-]?\\s*(?:第\\s*)?(\\d{1,3})\\s*(?:章|장)?(?=$|\\D)`, 'i').exec(normalized);
    const chapter = Number(match?.[1]);
    if (chapter && chapter <= book.numberOfChapters) return { bookId: book.id, chapter };
  }
  return null;
}

function secondsFromTimestamp(value) {
  const parts = value.split(':').map(Number);
  if (parts.some(part => !Number.isInteger(part) || part < 0) || parts.length < 2 || parts.length > 3) return null;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function parseVerseTimestamps(description, book, chapter, videoId) {
  const aliases = [book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean).map(value => value.normalize('NFKC').toLocaleLowerCase()).sort((a, b) => b.length - a.length);
  const cues = [];
  for (const line of description.split(/\r?\n/)) {
    const timestamp = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/.exec(line);
    if (!timestamp) continue;
    let label = timestamp[2].normalize('NFKC').toLocaleLowerCase().replace(/[「」『』]/g, '').trim();
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      label = label.replace(new RegExp(`^${escaped}\\s+`), '');
    }
    label = label.replace(/^(?:chapter|chap(?:ter)?\.?|ch\.?|глава|гл\.?|cap[ií]tulo|capítulo|cap\.?|capitolo)\s+/, '');
    const reference = /^(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\D|$)/.exec(label);
    const verseLabel = /^(?:verse|v\.?|절|節|стих|ст\.?|versículo|versiculo|verso)\s*(\d{1,3})(?:\D|$)/i.exec(label) || /^(?:第\s*)?(\d{1,3})\s*(?:절|節)(?:\D|$)/i.exec(label);
    const ordinal = /^(\d{1,3})\s*[.)-](?:\s|$)/.exec(label);
    const verse = reference ? Number(reference[1]) === chapter ? Number(reference[2]) : 0 : Number(verseLabel?.[1] || ordinal?.[1] || 0);
    const seconds = secondsFromTimestamp(timestamp[1]);
    if (!verse || seconds === null || cues.some(cue => cue.verse === verse)) continue;
    cues.push({ bookId: book.id, chapter, verse, seconds, videoId });
  }
  return cues;
}

async function api(path, params, key, fetcher = globalThis.fetch) {
  const url = new URL(`${API}/${path}`);
  for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value);
  const response = await fetcher(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`YouTube API ${path} returned HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return response.json();
}

async function mapLimit(items, limit, action) {
  const result = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await action(items[index], index);
    }
  }));
  return result;
}

async function playlistItems(playlistId, key, fetcher = globalThis.fetch) {
  const items = [];
  let pageToken = '';
  do {
    const data = await api('playlistItems', { part: 'snippet', playlistId, maxResults: '50', ...(pageToken ? { pageToken } : {}) }, key, fetcher);
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
    if (items.length >= 1500) break;
  } while (pageToken);
  return items;
}

async function discover(key, bookCatalogs, fetcher = globalThis.fetch) {
  const totalBookCount = bookCatalogs.ENGWEBP.length;
  const totalChapterCount = bookCatalogs.ENGWEBP.reduce((sum, book) => sum + Number(book.numberOfChapters || 0), 0);
  const candidates = [];
  for (const [locale, language] of Object.entries(LANGUAGES)) {
    for (const [edition, name] of language.editions) {
      const data = await api('search', { part: 'snippet', type: 'playlist', maxResults: '50', relevanceLanguage: language.queryLanguage, q: `${language.phrase} "${name}"` }, key, fetcher);
      for (const item of data.items || []) {
        const playlistId = item.id?.playlistId;
        if (playlistId && /^[\w-]+$/.test(playlistId)) candidates.push({ locale, edition, name, playlistId, searchTitle: item.snippet?.title || '', searchDescription: item.snippet?.description || '' });
      }
    }
  }
  const unique = [...new Map(candidates.map(item => [`${item.locale}:${item.edition}:${item.playlistId}`, item])).values()];
  const playlistDetails = new Map();
  for (let index = 0; index < unique.length; index += 50) {
    const ids = [...new Set(unique.slice(index, index + 50).map(item => item.playlistId))];
    const data = await api('playlists', { part: 'snippet,contentDetails,status', id: ids.join(',') }, key, fetcher);
    for (const item of data.items || []) playlistDetails.set(item.id, item);
  }
  const languages = Object.fromEntries(Object.entries(LANGUAGES).map(([locale, language]) => [locale, {
    label: language.label,
    editions: language.editions.map(([id, name]) => ({ id, name, sources: [] })),
  }]));
  const accepted = [];
  for (const candidate of unique) {
    const details = playlistDetails.get(candidate.playlistId);
    const editionText = `${candidate.searchTitle} ${candidate.searchDescription} ${details?.snippet?.title || ''} ${details?.snippet?.description || ''}`.normalize('NFKC').toLocaleLowerCase();
    if (details?.status?.privacyStatus !== 'public' || !editionText.includes(candidate.name.normalize('NFKC').toLocaleLowerCase())) continue;
    accepted.push(candidate);
  }
  const bestCandidatePerEdition = new Map();
  for (const candidate of accepted) {
    const editionKey = `${candidate.locale}:${candidate.edition}`;
    const previous = bestCandidatePerEdition.get(editionKey);
    const itemCount = Number(playlistDetails.get(candidate.playlistId)?.contentDetails?.itemCount) || 0;
    const previousCount = Number(playlistDetails.get(previous?.playlistId)?.contentDetails?.itemCount) || 0;
    if (!previous || Math.abs(itemCount - totalChapterCount) < Math.abs(previousCount - totalChapterCount)) bestCandidatePerEdition.set(editionKey, candidate);
  }
  const sources = await mapLimit([...bestCandidatePerEdition.values()], 8, async candidate => {
    const details = playlistDetails.get(candidate.playlistId);
    const localizedBooks = bookCatalogs[LANGUAGES[candidate.locale].catalog] || [];
    const localizedById = new Map(localizedBooks.map(book => [book.id, book]));
    const books = bookCatalogs.ENGWEBP.map(book => ({ ...book, ...(localizedById.get(book.id) || {}), numberOfChapters: Number(bookCatalogs.ENGWEBP.find(item => item.id === book.id)?.numberOfChapters) || 0 }));
    const items = await playlistItems(candidate.playlistId, key, fetcher);
    const videoIds = [...new Set(items.map(item => item.snippet?.resourceId?.videoId).filter(id => /^[\w-]{11}$/.test(id || '')))];
    const videoDetails = new Map();
    for (let index = 0; index < videoIds.length; index += 50) {
      const response = await api('videos', { part: 'snippet,status', id: videoIds.slice(index, index + 50).join(',') }, key, fetcher);
      for (const video of response.items || []) if (video.status?.privacyStatus === 'public' && video.status?.embeddable === true) videoDetails.set(video.id, video);
    }
    const cues = [];
    const bookById = new Map(books.map(book => [book.id, book]));
    const seenChapters = new Set();
    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      const parsed = parseChapterTitle(item.snippet?.title || '', books);
      const video = videoDetails.get(videoId);
      if (!video || !parsed) continue;
      const chapterKey = `${parsed.bookId}:${parsed.chapter}`;
      if (seenChapters.has(chapterKey)) continue;
      seenChapters.add(chapterKey);
      const playlistIndex = Number(item.snippet?.position);
      const cueIndex = Number.isInteger(playlistIndex) && playlistIndex >= 0 ? playlistIndex : null;
      cues.push({ ...parsed, verse: 1, seconds: 0, videoId, playlistIndex: cueIndex });
      cues.push(...parseVerseTimestamps(video.snippet?.description || '', bookById.get(parsed.bookId), parsed.chapter, videoId).map(cue => ({ ...cue, playlistIndex: cueIndex })));
    }
    if (!cues.length) return null;
    const coverage = new Set(cues.map(cue => cue.bookId)).size;
    return {
      candidate,
      source: {
        videoId: cues[0].videoId,
        playlistId: candidate.playlistId,
        title: details.snippet?.title || candidate.searchTitle,
        channelTitle: details.snippet?.channelTitle || '',
        edition: candidate.name,
        url: `https://www.youtube.com/playlist?list=${candidate.playlistId}`,
        chapterSync: cues.length >= 2,
        chapterCoverage: new Set(cues.map(cue => `${cue.bookId}:${cue.chapter}`)).size,
        bookCoverage: coverage,
        completeBible: coverage === totalBookCount && new Set(cues.map(cue => `${cue.bookId}:${cue.chapter}`)).size === totalChapterCount,
        verseCues: cues,
      },
    };
  });
  const bestByEdition = new Map();
  for (const result of sources.filter(Boolean)) {
    const key = `${result.candidate.locale}:${result.candidate.edition}`;
    const previous = bestByEdition.get(key);
    if (!previous || result.source.bookCoverage > previous.source.bookCoverage || (result.source.bookCoverage === previous.source.bookCoverage && result.source.chapterCoverage > previous.source.chapterCoverage)) bestByEdition.set(key, result);
  }
  for (const result of bestByEdition.values()) {
    const edition = languages[result.candidate.locale].editions.find(item => item.id === result.candidate.edition);
    if (edition && !edition.sources.some(source => source.playlistId === result.source.playlistId)) edition.sources.push(result.source);
  }
  for (const language of Object.values(languages)) {
    for (const edition of language.editions) edition.sources.sort((a, b) => b.bookCoverage - a.bookCoverage || b.chapterCoverage - a.chapterCoverage);
  }
  return { schemaVersion: 2, generatedAt: new Date().toISOString(), freshnessDays: 30, discovery: { searchCalls: Object.keys(LANGUAGES).reduce((sum, locale) => sum + LANGUAGES[locale].editions.length, 0), editionTarget: 5, totalBookCount, totalChapterCount, minimumVerifiedEditionsPerLanguage: 0 }, languages };
}

function selfCheck(bookCatalogs) {
  const english = bookCatalogs.ENGWEBP;
  const korean = bookCatalogs.kor_old;
  const japanese = bookCatalogs.jpn_loc;
  const chinese = bookCatalogs.cmn_cu1;
  const cases = [
    [english, '01. Genesis Chapter 1', 'GEN', 1],
    [english, 'Matthew 28', 'MAT', 28],
    [korean, '마태복음 4장', 'MAT', 4],
    [japanese, 'マタイの福音書 3章', 'MAT', 3],
    [chinese, '马太福音 第 2 章', 'MAT', 2],
  ];
  for (const [books, title, bookId, chapter] of cases) {
    const result = parseChapterTitle(title, books);
    if (result?.bookId !== bookId || result.chapter !== chapter) throw new Error(`chapter title self-check failed for ${title}`);
  }
  for (const [catalogId, books] of Object.entries(bookCatalogs)) {
    for (const book of books) {
      const result = parseChapterTitle(`${book.name} chapter 1`, books);
      if (result?.bookId !== book.id || result.chapter !== 1) throw new Error(`book catalog self-check failed for ${catalogId}/${book.id}`);
    }
  }
  const verseCues = parseVerseTimestamps('0:00 Matthew 2:1\n0:32 Matthew 2:2\n1:10 Matthew 2:3', english.find(book => book.id === 'MAT'), 2, 'abcdefghijk');
  if (verseCues.length !== 3 || verseCues[1].verse !== 2 || verseCues[1].seconds !== 32) throw new Error('verse timestamp self-check failed');
}

async function fixtureSelfCheck(bookCatalogs) {
  const fullPlaylistId = 'PLfullfixture';
  const partialPlaylistId = 'PLpartialfixture';
  const chapters = [];
  const fullVideoIds = [];
  let position = 0;
  let searchResultLimit = 0;
  for (const book of bookCatalogs.ENGWEBP) {
    for (let chapter = 1; chapter <= book.numberOfChapters; chapter++) {
      const videoId = String(position).padStart(11, '0');
      fullVideoIds.push(videoId);
      chapters.push({ snippet: { position, title: `${book.name} Chapter ${chapter}`, resourceId: { videoId } } });
      position++;
    }
  }
  const matthewPosition = chapters.findIndex(item => item.snippet.title === 'Matthew Chapter 2');
  let searchCalls = 0;
  const fetcher = async input => {
    const url = new URL(input);
    const params = url.searchParams;
    let body;
    if (url.pathname.endsWith('/search')) {
      searchCalls++;
      searchResultLimit = Math.max(searchResultLimit, Number(params.get('maxResults')) || 0);
      const matches = params.get('q')?.includes('"King James Version"');
      body = { items: matches ? [partialPlaylistId, fullPlaylistId].map((playlistId, index) => ({ id: { playlistId }, snippet: { title: `King James Version ${index ? 'full' : 'partial'} Bible audio`, description: 'King James Version' } })) : [] };
    } else if (url.pathname.endsWith('/playlists')) {
      body = { items: [partialPlaylistId, fullPlaylistId].map((id, index) => ({ id, snippet: { title: `King James Version ${index ? 'full' : 'partial'} Bible audio`, description: 'King James Version', channelTitle: 'Fixture channel' }, contentDetails: { itemCount: index ? 1189 : 1 }, status: { privacyStatus: 'public' } })) };
    } else if (url.pathname.endsWith('/playlistItems')) {
      const all = params.get('playlistId') === fullPlaylistId ? chapters : [{ snippet: { position: 0, title: 'John Chapter 3', resourceId: { videoId: 'PARTIAL0001' } } }];
      const offset = Number(params.get('pageToken') || 0);
      const items = all.slice(offset, offset + 50);
      const nextPage = offset + 50 < all.length ? String(offset + 50) : undefined;
      body = { items, ...(nextPage ? { nextPageToken: nextPage } : {}) };
    } else if (url.pathname.endsWith('/videos')) {
      body = { items: params.get('id').split(',').map(id => ({ id, status: { privacyStatus: 'public', embeddable: true }, snippet: { description: id === fullVideoIds[matthewPosition] ? '0:00 Matthew 2:1\n0:45 Matthew 2:2' : '' } })) };
    } else {
      throw new Error(`unexpected fixture API path ${url.pathname}`);
    }
    return { ok: true, json: async () => body };
  };
  const catalog = await discover('fixture-key', bookCatalogs, fetcher);
  const english = catalog.languages.en;
  const kjv = english.editions.find(edition => edition.id === 'KJV');
  const source = kjv.sources[0];
  const matthew = source?.verseCues.find(cue => cue.bookId === 'MAT' && cue.chapter === 2 && cue.verse === 2);
  if (searchCalls !== 50 || searchResultLimit !== 50 || kjv.sources.length !== 1 || !source?.completeBible || source.playlistId !== fullPlaylistId || source.chapterCoverage !== 1189 || source.bookCoverage !== 66 || matthew?.seconds !== 45 || matthew.playlistIndex !== matthewPosition) throw new Error('complete-Bible catalog fixture self-check failed');
  if (english.editions.find(edition => edition.id === 'NIV').sources.length || catalog.languages.ko.editions.some(edition => edition.sources.length)) throw new Error('edition isolation fixture self-check failed');
  console.log('PASS: mocked 50-search API selects the complete 66-book/1,189-chapter edition from up to 50 results per query, follows explicit verse timestamps, preserves the chapter playlist index, and rejects partial editions as complete');
}

const bookCatalogs = readBookCatalogs(await readFile('assets/bible-book-catalogs.js', 'utf8'));
if (process.argv.includes('--fixture-self-check')) {
  selfCheck(bookCatalogs);
  await fixtureSelfCheck(bookCatalogs);
} else if (process.argv.includes('--self-check')) {
  selfCheck(bookCatalogs);
  console.log('PASS: localized playlist titles map to book and chapter cues');
} else {
  const key = process.env.YOUTUBE_DATA_API_KEY;
  if (!key) throw new Error('Set YOUTUBE_DATA_API_KEY in the scheduled workflow secret.');
  const catalog = await discover(key, bookCatalogs);
  const verified = Object.values(catalog.languages).map(language => language.editions.filter(edition => edition.sources.some(source => source.completeBible)).length);
  catalog.discovery.minimumVerifiedEditionsPerLanguage = Math.min(...verified);
  await mkdir(CATALOG_OUTPUT_DIR, { recursive: true });
  for (const [locale, language] of Object.entries(catalog.languages)) {
    const localeCatalog = { ...catalog, languages: { [locale]: language } };
    await writeFile(`${CATALOG_OUTPUT_DIR}/${locale}.json`, `${JSON.stringify(localeCatalog)}\n`);
  }
  const totals = Object.entries(catalog.languages).map(([locale, item]) => ({
    locale,
    editions: item.editions.filter(edition => edition.sources.length).length,
    completeEditions: item.editions.filter(edition => edition.sources.some(source => source.completeBible)).length,
    books: item.editions.reduce((sum, edition) => sum + Math.max(0, ...edition.sources.map(source => source.bookCoverage)), 0),
    chapters: item.editions.reduce((sum, edition) => sum + edition.sources.reduce((count, source) => count + source.chapterCoverage, 0), 0),
  }));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## YouTube Bible audio catalog\n\nSearch API calls: ${catalog.discovery.searchCalls}/100. Complete Bible editions in every language: ${catalog.discovery.minimumVerifiedEditionsPerLanguage}/5 minimum.\n\n| Language | Complete editions | Other matches | Book coverage | Chapter cues |\n|---|---:|---:|---:|---:|\n${totals.map(item => `| ${item.locale} | ${item.completeEditions}/5 | ${item.editions - item.completeEditions} | ${item.books} | ${item.chapters} |`).join('\n')}\n`);
  console.log(`Catalog refreshed ${catalog.generatedAt}; ${totals.map(item => `${item.locale}:${item.completeEditions}/5 complete Bible editions, ${item.editions - item.completeEditions} partial matches, ${item.books} books across editions, ${item.chapters} chapter cues`).join(' | ')}`);
}
