import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const API = 'https://www.googleapis.com/youtube/v3';
const CATALOG_OUTPUT_DIR = process.env.CATALOG_OUTPUT_DIR || '.youtube-bible-audio-catalog';
const LANGUAGES = {
  en: { label: 'English', queryLanguage: 'en', phrase: 'Bible audio reading', catalog: 'ENGWEBP', editions: [['KJV', 'King James Version'], ['NIV', 'New International Version'], ['ESV', 'English Standard Version'], ['NKJV', 'New King James Version'], ['NLT', 'New Living Translation']] },
  ko: { label: '한국어', queryLanguage: 'ko', phrase: '성경 오디오 낭독', catalog: 'kor_old', editions: [['KRV', '개역한글'], ['NKRV', '개역개정'], ['KSB', '새번역'], ['KCB', '공동번역'], ['KLB', '우리말성경']] },
  ja: { label: '日本語', queryLanguage: 'ja', phrase: '聖書 音声朗読', catalog: 'jpn_loc', editions: [['JPN1965', '口語訳'], ['新改訳', '新改訳聖書'], ['新共同訳', '新共同訳聖書'], ['聖書協会共同訳', '聖書協会共同訳'], ['リビングバイブル', 'リビングバイブル']] },
  'zh-CN': { label: '简体中文', queryLanguage: 'zh-CN', phrase: '有声圣经', catalog: 'cmn_cu1', editions: [['CUV-S', '和合本 简体'], ['CNV-S', '新译本 简体'], ['当代译本', '当代译本'], ['中文标准译本', '中文标准译本'], ['环球圣经译本', '环球圣经译本']] },
  'zh-TW': { label: '繁體中文', queryLanguage: 'zh-TW', phrase: '有聲聖經', catalog: 'cmn_cuv', editions: [['CUV-T', '和合本 繁體'], ['CNV-T', '新譯本'], ['現代中文譯本', '現代中文譯本'], ['環球聖經譯本', '環球聖經譯本'], ['呂振中譯本', '呂振中譯本']] },
  fil: { label: 'Filipino', queryLanguage: 'tl', phrase: 'Bible audio reading', catalog: 'ENGWEBP', editions: [['AB1905', 'Ang Biblia 1905'], ['MBB', 'Magandang Balita Biblia'], ['ASD', 'Ang Salita ng Dios'], ['AB2001', 'Ang Biblia 2001'], ['ADB', 'Ang Dating Biblia']] },
  es: { label: 'Español', queryLanguage: 'es', phrase: 'Biblia audio narrada', catalog: 'ENGWEBP', editions: [['RVR1960', 'Reina-Valera 1960'], ['NVI', 'Nueva Versión Internacional'], ['NTV', 'Nueva Traducción Viviente'], ['LBLA', 'La Biblia de las Américas'], ['TLA', 'Traducción en Lenguaje Actual']] },
  'pt-BR': { label: 'Português do Brasil', queryLanguage: 'pt', phrase: 'Bíblia áudio narrada', catalog: 'ENGWEBP', editions: [['ARC', 'Almeida Revista e Corrigida'], ['NVI', 'Nova Versão Internacional'], ['NAA', 'Nova Almeida Atualizada'], ['ARA', 'Almeida Revista e Atualizada'], ['NTLH', 'Nova Tradução na Linguagem de Hoje']] },
  ru: { label: 'Русский', queryLanguage: 'ru', phrase: 'Библия аудио чтение', catalog: 'rus_syn', editions: [['SYN', 'Синодальный перевод'], ['СРП', 'Современный русский перевод'], ['РБО', 'Радостная весть'], ['НРП', 'Новый русский перевод'], ['Кулаков', 'Перевод Кулакова']] },
  uk: { label: 'Українська', queryLanguage: 'uk', phrase: 'Біблія аудіо читання', catalog: 'ukr_ufb', editions: [['Огієнка', 'Переклад Огієнка'], ['УТТ', 'Український Турконяк'], ['Хоменка', 'Переклад Хоменка'], ['UBS2019', 'Український біблійний переклад 2019'], ['УКУ', 'Переклад УКУ']] },
};

function readBookCatalogs(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context, { timeout: 1000 });
  return context.window.SelahBibleBookCatalogs;
}

function normalizedEditionText(value) {
  return String(value || '').normalize('NFKD').toLocaleLowerCase().replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');
}

function matchesEdition(text, editionId, name) {
  const normalizedText = normalizedEditionText(text);
  const normalizedName = normalizedEditionText(name);
  const id = String(editionId || '');
  const idPattern = /^[\p{L}\p{N}-]+$/u.test(id) ? new RegExp(`(^|[^\\p{L}\\p{N}])${id}($|[^\\p{L}\\p{N}])`, 'iu') : null;
  return (!!normalizedName && normalizedText.includes(normalizedName)) || !!idPattern?.test(String(text || ''));
}

function normalizedCueText(value) {
  return String(value || '').normalize('NFKD').toLocaleLowerCase().replace(/\p{M}/gu, '');
}

const ENGLISH_NAMES = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
};

const LOCALIZED_BOOK_NAMES = {
  es: 'Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis'.split('|'),
  'pt-BR': 'Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Crônicas|2 Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cantares|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oseias|Joel|Amós|Obadias|Jonas|Miqueias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|1 Coríntios|2 Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1 Tessalonicenses|2 Tessalonicenses|1 Timóteo|2 Timóteo|Tito|Filemom|Hebreus|Tiago|1 Pedro|2 Pedro|1 João|2 João|3 João|Judas|Apocalipse'.split('|'),
  fil: 'Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|Mga Hukom|Ruth|I Samuel|II Samuel|I Mga Hari|II Mga Hari|I Mga Cronica|II Mga Cronica|Ezra|Nehemias|Ester|Job|Mga Awit|Mga Kawikaan|Mangangaral|Awit ni Solomon|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Joel|Amos|Obadias|Jonas|Mikas|Nahum|Habakuk|Sofonias|Hagai|Zacarias|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Roma|I Mga Taga-Corinto|II Mga Taga-Corinto|Galacia|Efeso|Filipos|Colosas|I Mga Taga-Tesalonica|II Mga Taga-Tesalonica|I Timoteo|II Timoteo|Tito|Filemon|Mga Hebreo|Santiago|I Pedro|II Pedro|I Juan|II Juan|III Juan|Judas|Pahayag'.split('|'),
};

function parseChapterTitle(title, books) {
  const normalized = normalizedCueText(title);
  const aliases = books.flatMap(book => [...new Set([book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean).map(normalizedCueText))].map(alias => ({ book, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  for (const { book, alias } of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|[\\s·:|—–-])${escaped}(?=$|[\\s.,:：#章장])\\s*(?:chapter|chap(?:ter)?\\.?|ch\\.?|глава|гл\\.?|capítulo|cap[ií]tulo|cap\\.?|capitolo)?\\s*[:#.-]?\\s*(?:第\\s*)?(\\d{1,3})\\s*(?:章|장)?(?=$|\\D)`, 'i').exec(normalized);
    const chapter = Number(match?.[1]);
    if (chapter && chapter <= book.numberOfChapters) return { bookId: book.id, chapter };
  }
  return null;
}

function parseBookTitle(title, books) {
  const raw = normalizedCueText(title);
  const normalized = normalizedEditionText(raw);
  const aliases = books.flatMap(book => [...new Set([book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean))].map(value => ({ book, rawAlias: normalizedCueText(value), alias: normalizedEditionText(value) }))).sort((a, b) => b.alias.length - a.alias.length);
  for (const { book, rawAlias, alias } of aliases) {
    if (alias.length < 3) continue;
    const isLatin = /\p{Script=Latin}/u.test(rawAlias);
    if (isLatin ? new RegExp(`(?:^|[^\\p{L}\\p{N}])${rawAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(raw) : normalized.includes(alias)) return book;
  }
  return null;
}

function secondsFromTimestamp(value) {
  const parts = value.split(':').map(Number);
  if (parts.some(part => !Number.isInteger(part) || part < 0) || parts.length < 2 || parts.length > 3) return null;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function parseVerseTimestamps(description, book, chapter, videoId) {
  const aliases = [book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean).map(normalizedCueText).sort((a, b) => b.length - a.length);
  const cues = [];
  for (const line of description.split(/\r?\n/)) {
    const timestamp = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/.exec(line);
    if (!timestamp) continue;
    let label = normalizedCueText(timestamp[2]).replace(/[「」『』]/g, '').trim();
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

function parseTimedChapterCues(description, books, videoId, initialChapter = null) {
  const cues = [];
  let current = initialChapter;
  for (const line of description.split(/\r?\n/)) {
    const timestamp = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/.exec(line);
    if (!timestamp) continue;
    const seconds = secondsFromTimestamp(timestamp[1]);
    if (seconds === null) continue;
    const label = normalizedCueText(timestamp[2]).replace(/[「」『』]/g, '').trim();
    let verseMatch = null;
    for (const book of books) {
      const aliases = [book.name, book.commonName, book.title, ENGLISH_NAMES[book.id], book.id].filter(Boolean).map(normalizedCueText).sort((a, b) => b.length - a.length);
      for (const alias of aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rest = label.replace(new RegExp(`^${escaped}\\s+`), '');
        const ref = /^(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\D|$)/.exec(rest);
        if (ref) { verseMatch = { book, chapter: Number(ref[1]), verse: Number(ref[2]) }; break; }
      }
      if (verseMatch) break;
    }
    if (verseMatch && verseMatch.chapter <= verseMatch.book.numberOfChapters) {
      current = { bookId: verseMatch.book.id, chapter: verseMatch.chapter };
      cues.push({ ...current, verse: verseMatch.verse, seconds, videoId });
      continue;
    }
    const chapter = parseChapterTitle(label, books);
    if (chapter) {
      current = chapter;
      cues.push({ ...chapter, verse: 1, seconds, videoId });
      continue;
    }
    if (current) {
      const book = books.find(item => item.id === current.bookId);
      cues.push(...parseVerseTimestamps(`${timestamp[1]} ${label}`, book, current.chapter, videoId));
    }
  }
  return [...new Map(cues.map(cue => [`${cue.bookId}:${cue.chapter}:${cue.verse}`, cue])).values()];
}

async function api(path, params, key, fetcher = globalThis.fetch) {
  const url = new URL(`${API}/${path}`);
  for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value);
  const response = await fetcher(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`YouTube API ${path} returned HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return response.json();
}

function createApiRequest(key, fetcher = globalThis.fetch, maxUnits = 9500, maxSearchCalls = 50) {
  const usage = { units: 0, searchCalls: 0, maxUnits, maxSearchCalls };
  return {
    usage,
    async request(path, params) {
      if (path === 'search') {
        if (usage.searchCalls >= usage.maxSearchCalls) return null;
        usage.searchCalls++;
      } else {
        if (usage.units >= usage.maxUnits) return null;
        usage.units++;
      }
      return api(path, params, key, fetcher);
    },
  };
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

async function playlistItems(playlistId, request) {
  const items = [];
  let pageToken = '';
  do {
    const data = await request('playlistItems', { part: 'snippet', playlistId, maxResults: '50', ...(pageToken ? { pageToken } : {}) });
    if (!data) break;
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
    if (items.length >= 1500) break;
  } while (pageToken);
  return items;
}

async function discover(key, bookCatalogs, fetcher = globalThis.fetch) {
  const { request, usage } = createApiRequest(key, fetcher);
  const totalBookCount = bookCatalogs.ENGWEBP.length;
  const totalChapterCount = bookCatalogs.ENGWEBP.reduce((sum, book) => sum + Number(book.numberOfChapters || 0), 0);
  const candidates = [], videoCandidates = [];
  for (const [locale, language] of Object.entries(LANGUAGES)) {
    for (const [edition, name] of language.editions) {
      const data = await request('search', { part: 'snippet', type: 'playlist,video', maxResults: '50', relevanceLanguage: language.queryLanguage, q: `${language.phrase} "${name}"` });
      if (!data) continue;
      for (const item of data.items || []) {
        const playlistId = item.id?.playlistId;
        if (playlistId && /^[\w-]+$/.test(playlistId)) candidates.push({ locale, edition, name, playlistId, searchTitle: item.snippet?.title || '', searchDescription: item.snippet?.description || '' });
        const videoId = item.id?.videoId, channelId = item.snippet?.channelId;
        if (videoId && /^[\w-]{11}$/.test(videoId) && channelId) videoCandidates.push({ locale, edition, name, videoId, channelId, searchTitle: item.snippet?.title || '', searchDescription: item.snippet?.description || '' });
      }
    }
  }
  const unique = [...new Map(candidates.map(item => [`${item.locale}:${item.edition}:${item.playlistId}`, item])).values()];
  const playlistDetails = new Map();
  for (let index = 0; index < unique.length; index += 50) {
    const ids = [...new Set(unique.slice(index, index + 50).map(item => item.playlistId))];
    const data = await request('playlists', { part: 'snippet,contentDetails,status', id: ids.join(',') });
    if (!data) break;
    for (const item of data.items || []) playlistDetails.set(item.id, item);
  }
  const languages = Object.fromEntries(Object.entries(LANGUAGES).map(([locale, language]) => [locale, {
    label: language.label,
    editions: language.editions.map(([id, name]) => ({ id, name, sources: [] })),
  }]));
  const accepted = [];
  for (const candidate of unique) {
    const details = playlistDetails.get(candidate.playlistId);
    const editionText = `${candidate.searchTitle} ${candidate.searchDescription} ${details?.snippet?.title || ''} ${details?.snippet?.description || ''}`;
    if (details?.status?.privacyStatus !== 'public' || !matchesEdition(editionText, candidate.edition, candidate.name)) continue;
    candidate.channelId = details.snippet?.channelId || '';
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
  const localizedBooksFor = locale => {
    const localizedBooks = bookCatalogs[LANGUAGES[locale].catalog] || [];
    const localizedById = new Map(localizedBooks.map(book => [book.id, book]));
    return bookCatalogs.ENGWEBP.map((book, index) => {
      const names = LOCALIZED_BOOK_NAMES[locale];
      const localized = localizedById.get(book.id) || {};
      const name = names?.[index] || localized.name || book.name;
      return { ...book, ...localized, name, commonName: name, title: name, numberOfChapters: Number(book.numberOfChapters) || 0 };
    });
  };
  const sortedCues = (cues, books) => {
    const bookOrder = new Map(books.map((book, index) => [book.id, index]));
    const videoIds = [...new Set(cues.sort((a, b) => (bookOrder.get(a.bookId) ?? 999) - (bookOrder.get(b.bookId) ?? 999) || a.chapter - b.chapter || a.seconds - b.seconds).map(cue => cue.videoId))];
    for (const cue of cues) cue.playlistIndex = videoIds.indexOf(cue.videoId);
    return { cues, videoIds };
  };
  const sourceFor = (candidate, cues, title, channelTitle, playlistId = '') => {
    const books = localizedBooksFor(candidate.locale);
    const { cues: orderedCues, videoIds } = sortedCues(cues, books);
    const chapterCoverage = new Set(orderedCues.map(cue => `${cue.bookId}:${cue.chapter}`)).size;
    const bookCoverage = new Set(orderedCues.map(cue => cue.bookId)).size;
    return {
      videoId: videoIds[0], videoIds, ...(playlistId ? { playlistId } : {}), title, channelTitle,
      edition: candidate.name,
      url: playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : `https://www.youtube.com/watch?v=${videoIds[0]}`,
      chapterSync: chapterCoverage > 0, chapterCoverage, bookCoverage,
      completeBible: bookCoverage === totalBookCount && chapterCoverage === totalChapterCount,
      verseCues: orderedCues,
    };
  };
  const playlistResults = await mapLimit([...bestCandidatePerEdition.values()], 8, async candidate => {
    const details = playlistDetails.get(candidate.playlistId);
    const books = localizedBooksFor(candidate.locale);
    const items = await playlistItems(candidate.playlistId, request);
    const videoIds = [...new Set(items.map(item => item.snippet?.resourceId?.videoId).filter(id => /^[\w-]{11}$/.test(id || '')))];
    const videoDetails = new Map();
    for (let index = 0; index < videoIds.length; index += 50) {
      const response = await request('videos', { part: 'snippet,status', id: videoIds.slice(index, index + 50).join(',') });
      if (!response) break;
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
      cues.push({ ...parsed, verse: 1, seconds: 0, videoId });
      cues.push(...parseTimedChapterCues(video.snippet?.description || '', books, videoId, parsed));
    }
    if (!cues.length) return null;
    return {
      candidate,
      source: sourceFor(candidate, cues, details.snippet?.title || candidate.searchTitle, details.snippet?.channelTitle || '', candidate.playlistId),
    };
  });
  const videoChannelCandidates = new Map();
  for (const candidate of videoCandidates) {
    const editionText = `${candidate.searchTitle} ${candidate.searchDescription}`;
    if (!matchesEdition(editionText, candidate.edition, candidate.name)) continue;
    const books = localizedBooksFor(candidate.locale);
    const chapter = parseChapterTitle(candidate.searchTitle, books);
    const book = parseBookTitle(candidate.searchTitle, books);
    if (!chapter && !book) continue;
    const key = `${candidate.locale}:${candidate.edition}:${candidate.channelId}`;
    const row = videoChannelCandidates.get(key) || { locale: candidate.locale, edition: candidate.edition, name: candidate.name, channelId: candidate.channelId, hits: [] };
    row.hits.push({ ...candidate, chapter, book });
    videoChannelCandidates.set(key, row);
  }
  const bestChannelPerEdition = new Map();
  for (const candidate of videoChannelCandidates.values()) {
    const key = `${candidate.locale}:${candidate.edition}`;
    const previous = bestChannelPerEdition.get(key);
    const score = new Set(candidate.hits.map(item => item.chapter ? `${item.chapter.bookId}:${item.chapter.chapter}` : item.book?.id)).size;
    const previousScore = previous ? new Set(previous.hits.map(item => item.chapter ? `${item.chapter.bookId}:${item.chapter.chapter}` : item.book?.id)).size : -1;
    if (!previous || score > previousScore) bestChannelPerEdition.set(key, candidate);
  }
  const playlistCoverage = new Map(playlistResults.filter(Boolean).map(result => [`${result.candidate.locale}:${result.candidate.edition}`, result.source.chapterCoverage]));
  const channelRowsByKey = new Map([...bestChannelPerEdition.values()].map(candidate => [`${candidate.locale}:${candidate.edition}:${candidate.channelId}`, candidate]));
  for (const playlist of bestCandidatePerEdition.values()) {
    if (!playlist.channelId) continue;
    if ((playlistCoverage.get(`${playlist.locale}:${playlist.edition}`) || 0) >= totalChapterCount) continue;
    const key = `${playlist.locale}:${playlist.edition}:${playlist.channelId}`;
    const candidate = channelRowsByKey.get(key) || { locale: playlist.locale, edition: playlist.edition, name: playlist.name, channelId: playlist.channelId, hits: [] };
    candidate.playlistId = playlist.playlistId;
    channelRowsByKey.set(key, candidate);
  }
  const channelRows = [...channelRowsByKey.values()].sort((a, b) => (playlistCoverage.get(`${a.locale}:${a.edition}`) || 0) - (playlistCoverage.get(`${b.locale}:${b.edition}`) || 0) || b.hits.length - a.hits.length);
  const channelDetails = new Map();
  for (let index = 0; index < channelRows.length; index += 50) {
    const data = await request('channels', { part: 'snippet,contentDetails', id: channelRows.slice(index, index + 50).map(item => item.channelId).join(',') });
    for (const channel of data?.items || []) channelDetails.set(channel.id, channel);
  }
  const channelResults = [];
  for (const candidate of channelRows) {
    if ((playlistCoverage.get(`${candidate.locale}:${candidate.edition}`) || 0) >= totalChapterCount) continue;
    if (usage.units >= usage.maxUnits - 1) break;
    const channel = channelDetails.get(candidate.channelId);
    const uploadsId = channel?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) continue;
    const books = localizedBooksFor(candidate.locale), items = await playlistItems(uploadsId, request);
    const bookById = new Map(books.map(book => [book.id, book]));
    const videosToRead = new Map();
    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!/^[\w-]{11}$/.test(videoId || '')) continue;
      const title = item.snippet?.title || '';
      const chapter = parseChapterTitle(title, books), book = chapter ? books.find(value => value.id === chapter.bookId) : parseBookTitle(title, books);
      if (chapter || book) videosToRead.set(videoId, { chapter, book, title });
    }
    const cues = [];
    const ids = [...videosToRead.keys()];
    for (let index = 0; index < ids.length && usage.units < usage.maxUnits; index += 50) {
      const response = await request('videos', { part: 'snippet,status', id: ids.slice(index, index + 50).join(',') });
      if (!response) break;
      for (const video of response.items || []) {
        if (video.status?.privacyStatus !== 'public' || video.status?.embeddable !== true || !matchesEdition(`${video.snippet?.title || ''} ${video.snippet?.description || ''}`, candidate.edition, candidate.name)) continue;
        const match = videosToRead.get(video.id);
        if (match.chapter) {
          cues.push({ ...match.chapter, verse: 1, seconds: 0, videoId: video.id });
          cues.push(...parseTimedChapterCues(video.snippet?.description || '', books, video.id, match.chapter));
        } else {
          cues.push(...parseTimedChapterCues(video.snippet?.description || '', books, video.id));
        }
      }
    }
    if (cues.length) channelResults.push({ candidate, source: sourceFor(candidate, cues, channel.snippet?.title || candidate.name, channel.snippet?.title || '') });
  }
  const bestByEdition = new Map();
  for (const result of [...playlistResults, ...channelResults].filter(Boolean)) {
    const key = `${result.candidate.locale}:${result.candidate.edition}`;
    const previous = bestByEdition.get(key);
    if (previous?.candidate.channelId && previous.candidate.channelId === result.candidate.channelId) {
      const candidate = { ...result.candidate, playlistId: result.candidate.playlistId || previous.candidate.playlistId };
      result.source = sourceFor(candidate, [...previous.source.verseCues, ...result.source.verseCues], result.source.title, result.source.channelTitle, candidate.playlistId || '');
      bestByEdition.set(key, result);
      continue;
    }
    if (!previous || result.source.bookCoverage > previous.source.bookCoverage || (result.source.bookCoverage === previous.source.bookCoverage && result.source.chapterCoverage > previous.source.chapterCoverage)) bestByEdition.set(key, result);
  }
  for (const result of bestByEdition.values()) {
    const edition = languages[result.candidate.locale].editions.find(item => item.id === result.candidate.edition);
    if (edition) edition.sources.push(result.source);
  }
  for (const language of Object.values(languages)) {
    for (const edition of language.editions) edition.sources.sort((a, b) => b.bookCoverage - a.bookCoverage || b.chapterCoverage - a.chapterCoverage);
  }
  return { schemaVersion: 3, generatedAt: new Date().toISOString(), freshnessDays: 30, discovery: { searchCalls: usage.searchCalls, searchCallLimit: usage.maxSearchCalls, apiQuotaUnits: usage.units, apiQuotaLimit: usage.maxUnits, editionTarget: 5, totalBookCount, totalChapterCount, minimumVerifiedEditionsPerLanguage: 0 }, languages };
}

function selfCheck(bookCatalogs) {
  const english = bookCatalogs.ENGWEBP;
  const korean = bookCatalogs.kor_old;
  const japanese = bookCatalogs.jpn_loc;
  const chinese = bookCatalogs.cmn_cu1;
  const spanish = english.map((book, index) => ({ ...book, name: LOCALIZED_BOOK_NAMES.es[index], commonName: LOCALIZED_BOOK_NAMES.es[index], title: LOCALIZED_BOOK_NAMES.es[index] }));
  const portuguese = english.map((book, index) => ({ ...book, name: LOCALIZED_BOOK_NAMES['pt-BR'][index], commonName: LOCALIZED_BOOK_NAMES['pt-BR'][index], title: LOCALIZED_BOOK_NAMES['pt-BR'][index] }));
  const filipino = english.map((book, index) => ({ ...book, name: LOCALIZED_BOOK_NAMES.fil[index], commonName: LOCALIZED_BOOK_NAMES.fil[index], title: LOCALIZED_BOOK_NAMES.fil[index] }));
  const cases = [
    [english, '01. Genesis Chapter 1', 'GEN', 1],
    [english, 'Matthew 28', 'MAT', 28],
    [korean, '마태복음 4장', 'MAT', 4],
    [japanese, 'マタイの福音書 3章', 'MAT', 3],
    [chinese, '马太福音 第 2 章', 'MAT', 2],
    [spanish, 'Romanos 8', 'ROM', 8],
    [portuguese, 'João 3', 'JHN', 3],
    [filipino, 'I Mga Hari 2', '1KI', 2],
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
  const timedBookCues = parseTimedChapterCues('0:00 Genesis 1\n0:35 Genesis 1:2\n1:20 Genesis 2\n1:45 Genesis 2:2', english, 'abcdefghijk');
  if (timedBookCues.length !== 4 || timedBookCues[2].chapter !== 2 || timedBookCues[2].seconds !== 80 || timedBookCues[3].verse !== 2) throw new Error('timestamped book-video cue self-check failed');
  if (parseBookTitle('LA BIBLIA HABLADA MIQUEAS REINA VALERA 1960', spanish)?.id !== 'MIC' || parseBookTitle('New Living Translation from audio', english)) throw new Error('book title matching self-check failed');
  if (!matchesEdition('LA BIBLIA HABLADA REINA VALERA 1960', 'RVR1960', 'Reina-Valera 1960') || !matchesEdition('NIV Bible audio', 'NIV', 'New International Version') || matchesEdition('unrelatedNIVaudio', 'NIV', 'New International Version') || matchesEdition('English Standard Version', 'NIV', 'New International Version')) throw new Error('edition-name matching self-check failed');
}

async function fixtureSelfCheck(bookCatalogs) {
  const fullPlaylistId = 'PLfullfixture';
  const partialPlaylistId = 'PLpartialfixture';
  const chapters = [];
  const fullVideoIds = [];
  let position = 0;
  let searchResultLimit = 0;
  let mixedResourceTypes = false;
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
      mixedResourceTypes ||= params.get('type') === 'playlist,video';
      const matches = params.get('q')?.includes('"King James Version"');
      const livingTranslation = params.get('q')?.includes('"New Living Translation"');
      body = { items: [
        ...(matches ? [partialPlaylistId, fullPlaylistId].map((playlistId, index) => ({ id: { playlistId }, snippet: { title: `King James Version ${index ? 'full' : 'partial'} Bible audio`, description: 'King James Version' } })) : []),
        ...(livingTranslation ? [{ id: { videoId: 'VIDEO000001' }, snippet: { title: 'Genesis · New Living Translation audio', description: 'New Living Translation', channelId: 'UCfixtureaudio' } }] : []),
      ] };
    } else if (url.pathname.endsWith('/playlists')) {
      body = { items: [partialPlaylistId, fullPlaylistId].map((id, index) => ({ id, snippet: { title: `King James Version ${index ? 'full' : 'partial'} Bible audio`, description: 'King James Version', channelTitle: 'Fixture channel' }, contentDetails: { itemCount: index ? 1189 : 1 }, status: { privacyStatus: 'public' } })) };
    } else if (url.pathname.endsWith('/channels')) {
      body = { items: [{ id: 'UCfixtureaudio', snippet: { title: 'Fixture audio channel' }, contentDetails: { relatedPlaylists: { uploads: 'UUfixtureaudio' } } }] };
    } else if (url.pathname.endsWith('/playlistItems')) {
      const playlistId = params.get('playlistId');
      const all = playlistId === fullPlaylistId ? chapters : playlistId === 'UUfixtureaudio' ? [{ snippet: { position: 0, title: 'Genesis · New Living Translation', resourceId: { videoId: 'VIDEO000001' } } }] : [{ snippet: { position: 0, title: 'John Chapter 3', resourceId: { videoId: 'PARTIAL0001' } } }];
      const offset = Number(params.get('pageToken') || 0);
      const items = all.slice(offset, offset + 50);
      const nextPage = offset + 50 < all.length ? String(offset + 50) : undefined;
      body = { items, ...(nextPage ? { nextPageToken: nextPage } : {}) };
    } else if (url.pathname.endsWith('/videos')) {
      body = { items: params.get('id').split(',').map(id => ({ id, status: { privacyStatus: 'public', embeddable: true }, snippet: { title: id === 'VIDEO000001' ? 'Genesis · New Living Translation audio' : 'Fixture Bible reading', description: id === fullVideoIds[matthewPosition] ? '0:00 Matthew 2:1\n0:45 Matthew 2:2' : id === 'VIDEO000001' ? 'New Living Translation\n0:00 Genesis 1\n0:35 Genesis 1:2\n1:20 Genesis 2\n1:45 Genesis 2:2' : '' } })) };
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
  const nlt = english.editions.find(edition => edition.id === 'NLT').sources[0];
  const genesis2 = nlt?.verseCues.find(cue => cue.bookId === 'GEN' && cue.chapter === 2 && cue.verse === 1);
  if (searchCalls !== 50 || searchResultLimit !== 50 || !mixedResourceTypes || kjv.sources.length !== 1 || !source?.completeBible || source.playlistId !== fullPlaylistId || source.videoIds.length !== 1189 || source.chapterCoverage !== 1189 || source.bookCoverage !== 66 || matthew?.seconds !== 45 || matthew.playlistIndex !== matthewPosition || nlt?.chapterCoverage !== 2 || nlt.videoIds[0] !== 'VIDEO000001' || genesis2?.seconds !== 80 || genesis2.playlistIndex !== 0) throw new Error('complete-Bible catalog fixture self-check failed');
  if (english.editions.find(edition => edition.id === 'NIV').sources.length || catalog.languages.ko.editions.some(edition => edition.sources.length)) throw new Error('edition isolation fixture self-check failed');
  console.log('PASS: mixed-resource discovery keeps the complete 66-book/1,189-chapter playlist, indexes its video queue, reads chapter timestamps from a book-level channel upload, and rejects partial editions as complete');
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
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## YouTube Bible audio catalog\n\nYouTube API use: ${catalog.discovery.searchCalls}/${catalog.discovery.searchCallLimit} daily search calls; ${catalog.discovery.apiQuotaUnits}/${catalog.discovery.apiQuotaLimit} units for other endpoints. Complete Bible editions in every language: ${catalog.discovery.minimumVerifiedEditionsPerLanguage}/5 minimum.\n\n| Language | Complete editions | Other matches | Book coverage | Chapter cues |\n|---|---:|---:|---:|---:|\n${totals.map(item => `| ${item.locale} | ${item.completeEditions}/5 | ${item.editions - item.completeEditions} | ${item.books} | ${item.chapters} |`).join('\n')}\n`);
  console.log(`Catalog refreshed ${catalog.generatedAt}; ${totals.map(item => `${item.locale}:${item.completeEditions}/5 complete Bible editions, ${item.editions - item.completeEditions} partial matches, ${item.books} books across editions, ${item.chapters} chapter cues`).join(' | ')}`);
}
