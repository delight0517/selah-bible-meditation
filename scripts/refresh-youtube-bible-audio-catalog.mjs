import { writeFile } from 'node:fs/promises';

const API = 'https://www.googleapis.com/youtube/v3';
const CATALOG_PATH = process.env.CATALOG_OUTPUT || 'youtube-bible-audio-catalog.json';
const LANGUAGES = {
  en: { label: 'English', queryLanguage: 'en', phrase: 'Matthew audio Bible', editions: [['KJV', 'King James Version'], ['NIV', 'New International Version'], ['ESV', 'English Standard Version'], ['NKJV', 'New King James Version'], ['NLT', 'New Living Translation']] },
  ko: { label: '한국어', queryLanguage: 'ko', phrase: '마태복음 오디오 성경', editions: [['KRV', '개역한글'], ['NKRV', '개역개정'], ['KSB', '새번역'], ['KCB', '공동번역'], ['KLB', '우리말성경']] },
  ja: { label: '日本語', queryLanguage: 'ja', phrase: 'マタイ 音声聖書', editions: [['JPN1965', '口語訳'], ['新改訳', '新改訳聖書'], ['新共同訳', '新共同訳聖書'], ['聖書協会共同訳', '聖書協会共同訳'], ['リビングバイブル', 'リビングバイブル']] },
  'zh-CN': { label: '简体中文', queryLanguage: 'zh-CN', phrase: '马太福音 有声圣经', editions: [['CUV-S', '和合本 简体'], ['CNV-S', '新译本 简体'], ['当代译本', '当代译本'], ['中文标准译本', '中文标准译本'], ['环球圣经译本', '环球圣经译本']] },
  'zh-TW': { label: '繁體中文', queryLanguage: 'zh-TW', phrase: '馬太福音 有聲聖經', editions: [['CUV-T', '和合本 繁體'], ['CNV-T', '新譯本'], ['現代中文譯本', '現代中文譯本'], ['環球聖經譯本', '環球聖經譯本'], ['呂振中譯本', '呂振中譯本']] },
  fil: { label: 'Filipino', queryLanguage: 'tl', phrase: 'Mateo audio Biblia', editions: [['AB1905', 'Ang Biblia 1905'], ['MBB', 'Magandang Balita Biblia'], ['ASD', 'Ang Salita ng Dios'], ['AB2001', 'Ang Biblia 2001'], ['ADB', 'Ang Dating Biblia']] },
  es: { label: 'Español', queryLanguage: 'es', phrase: 'Biblia en audio Mateo', editions: [['RVR1960', 'Reina-Valera 1960'], ['NVI', 'Nueva Versión Internacional'], ['NTV', 'Nueva Traducción Viviente'], ['LBLA', 'La Biblia de las Américas'], ['TLA', 'Traducción en Lenguaje Actual']] },
  'pt-BR': { label: 'Português do Brasil', queryLanguage: 'pt', phrase: 'Bíblia em áudio Mateus', editions: [['ARC', 'Almeida Revista e Corrigida'], ['NVI', 'Nova Versão Internacional'], ['NAA', 'Nova Almeida Atualizada'], ['ARA', 'Almeida Revista e Atualizada'], ['NTLH', 'Nova Tradução na Linguagem de Hoje']] },
  ru: { label: 'Русский', queryLanguage: 'ru', phrase: 'Евангелие от Матфея аудио Библия', editions: [['SYN', 'Синодальный перевод'], ['СРП', 'Современный русский перевод'], ['РБО', 'Радостная весть'], ['НРП', 'Новый русский перевод'], ['Кулаков', 'Перевод Кулакова']] },
  uk: { label: 'Українська', queryLanguage: 'uk', phrase: 'Євангеліє від Матвія аудіо Біблія', editions: [['Огієнка', 'Переклад Огієнка'], ['УТТ', 'Український Турконяк'], ['Хоменка', 'Переклад Хоменка'], ['UBS2019', 'Український біблійний переклад 2019'], ['УКУ', 'Переклад УКУ']] },
};
const BOOK_NAMES = /(?:matthew|matt\.?|matth(?:aeus|äus|ieu)?|mateo|mateus|マタイ(?:による福音書)?|马太福音|馬太福音|마태복음|евангелие\s+от\s+матфея|матфея|матвія)/i;

function secondsFromTimestamp(value) {
  const parts = value.split(':').map(Number);
  if (parts.some(part => !Number.isInteger(part) || part < 0) || parts.length < 2 || parts.length > 3) return null;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function matthewChapterCues(description, videoId) {
  const cues = new Map();
  for (const line of description.split(/\r?\n/)) {
    const match = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const chapterText = BOOK_NAMES.test(match[2])
      ? match[2].match(/(?:^|\D)([1-9]|1\d|2[0-8])\s*(?:장|章|глава|гл\.?)?\s*$/i)
      : match[2].match(/\bchapter\s+([1-9]|1\d|2[0-8])\b/i);
    const chapter = Number(chapterText?.[1]);
    const seconds = secondsFromTimestamp(match[1]);
    if (chapter && seconds !== null && !cues.has(chapter)) cues.set(chapter, { bookId: 'MAT', chapter, verse: 1, seconds, videoId });
  }
  return [...cues.values()].sort((a, b) => a.seconds - b.seconds);
}

async function api(path, params, key) {
  const url = new URL(`${API}/${path}`);
  for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`YouTube API ${path} returned HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return response.json();
}

async function discover(key) {
  const searches = [];
  for (const [locale, language] of Object.entries(LANGUAGES)) {
    for (const [edition, name] of language.editions) {
      const data = await api('search', { part: 'snippet', type: 'video', videoEmbeddable: 'true', videoDuration: 'long', maxResults: '3', relevanceLanguage: language.queryLanguage, q: `${language.phrase} "${name}" full audio` }, key);
      for (const item of data.items || []) {
        const videoId = item.id?.videoId;
        if (videoId && /^[\w-]{11}$/.test(videoId)) searches.push({ locale, edition, name, videoId });
      }
    }
  }
  const details = new Map();
  for (let index = 0; index < searches.length; index += 50) {
    const ids = [...new Set(searches.slice(index, index + 50).map(item => item.videoId))];
    if (!ids.length) continue;
    const data = await api('videos', { part: 'snippet,contentDetails,status', id: ids.join(',') }, key);
    for (const item of data.items || []) details.set(item.id, item);
  }
  const languages = Object.fromEntries(Object.entries(LANGUAGES).map(([locale, language]) => [locale, {
    label: language.label,
    editions: language.editions.map(([id, name]) => ({ id, name, sources: [] })),
  }]));
  const seenVideos = new Set();
  for (const result of searches) {
    if (seenVideos.has(result.videoId)) continue;
    const video = details.get(result.videoId);
    if (!video || video.status?.embeddable !== true || video.status?.privacyStatus !== 'public') continue;
    const edition = languages[result.locale].editions.find(item => item.id === result.edition);
    if (!edition || edition.sources.some(source => source.videoId === result.videoId)) continue;
    const metadata = `${video.snippet?.title || ''} ${video.snippet?.description || ''}`.normalize('NFKC').toLocaleLowerCase();
    const marker = [result.name, result.edition].map(value => value.normalize('NFKC').toLocaleLowerCase().trim()).filter(Boolean);
    if (!marker.some(value => metadata.includes(value))) continue;
    const seconds = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(video.contentDetails?.duration || '');
    const duration = seconds ? Number(seconds[1] || 0) * 3600 + Number(seconds[2] || 0) * 60 + Number(seconds[3] || 0) : 0;
    if (duration < 1800) continue;
    const cues = matthewChapterCues(video.snippet?.description || '', result.videoId);
    const source = {
      videoId: result.videoId,
      title: video.snippet?.title || '',
      channelTitle: video.snippet?.channelTitle || '',
      edition: result.name,
      url: `https://www.youtube.com/watch?v=${result.videoId}`,
      chapterSync: cues.length >= 2,
      verseCues: cues,
    };
    edition.sources.push(source);
    seenVideos.add(result.videoId);
  }
  for (const language of Object.values(languages)) {
    for (const edition of language.editions) edition.sources.sort((a, b) => Number(b.chapterSync) - Number(a.chapterSync));
  }
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), freshnessDays: 30, languages };
}

function selfCheck() {
  const cues = matthewChapterCues('0:00 Matthew 1\n3:20 Matthew 2\n6:10 Matthew 3\n10:05 마태복음 4장', 'abcdefghijk');
  if (cues.length !== 4 || cues[1].chapter !== 2 || cues[1].seconds !== 200 || cues[3].chapter !== 4 || secondsFromTimestamp('1:02:03') !== 3723) throw new Error('chapter timestamp self-check failed');
}

if (process.argv.includes('--self-check')) {
  selfCheck();
  console.log('PASS: YouTube timestamps map to Matthew chapter-start cues');
} else {
  const key = process.env.YOUTUBE_DATA_API_KEY;
  if (!key) throw new Error('Set YOUTUBE_DATA_API_KEY in the scheduled workflow secret.');
  const catalog = await discover(key);
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog)}\n`);
  const totals = Object.entries(catalog.languages).map(([locale, item]) => `${locale}:${item.editions.filter(edition => edition.sources.length).length}/5 editions, ${item.editions.reduce((n, edition) => n + edition.sources.filter(source => source.chapterSync).length, 0)} chapter-synced`).join(' | ');
  console.log(`Catalog refreshed ${catalog.generatedAt}; ${totals}`);
}
