import audioBookNames from './audio-book-names.json' with {type:'json'};

const EDITIONS = {
  en: [['KJV','King James Version'],['NIV','New International Version'],['ESV','English Standard Version'],['NKJV','New King James Version'],['NLT','New Living Translation']],
  ko: [['KRV','개역한글'],['NKRV','개역개정'],['KSB','새번역'],['KCB','공동번역'],['KLB','우리말성경'],['EASY','쉬운성경']],
  ja: [['JPN1965','口語訳'],['新改訳','新改訳聖書'],['新共同訳','新共同訳'],['聖書協会共同訳','聖書協会共同訳'],['リビングバイブル','リビングバイブル']],
  'zh-CN': [['CUV-S','和合本 简体'],['CNV-S','新译本 简体'],['当代译本','当代译本'],['中文标准译本','中文标准译本'],['环球圣经译本','环球圣经译本']],
  'zh-TW': [['CUV-T','和合本 繁體'],['CNV-T','新譯本'],['現代中文譯本','現代中文譯本'],['環球聖經譯本','環球聖經譯本'],['呂振中譯本','呂振中譯本']],
  fil: [['AB1905','Ang Biblia 1905'],['MBB','Magandang Balita Biblia'],['ASD','Ang Salita ng Dios'],['AB2001','Ang Biblia 2001'],['ADB','Ang Dating Biblia']],
  es: [['RVR1960','Reina-Valera 1960'],['NVI','Nueva Versión Internacional'],['NTV','Nueva Traducción Viviente'],['LBLA','La Biblia de las Américas'],['TLA','Traducción en Lenguaje Actual']],
  'pt-BR': [['ARC','Almeida Revista e Corrigida'],['NVI','Nova Versão Internacional'],['NAA','Nova Almeida Atualizada'],['ARA','Almeida Revista e Atualizada'],['NTLH','Nova Tradução na Linguagem de Hoje']],
  ru: [['SYN','Синодальный перевод'],['СРП','Современный русский перевод'],['РБО','Радостная весть'],['НРП','Новый русский перевод'],['Кулаков','Перевод Кулакова']],
  uk: [['Огієнка','Переклад Огієнка'],['УТТ','Український Турконяк'],['Хоменка','Переклад Хоменка'],['UBS2019','Український біблійний переклад 2019'],['УКУ','Переклад УКУ']],
};
const CHAPTERS = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const BOOKS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
const LANG_TAG = {ko:'ko',en:'en',ja:'ja','zh-CN':'zh-Hans','zh-TW':'zh-Hant',fil:'tl',es:'es','pt-BR':'pt',ru:'ru',uk:'uk'};
const PHRASES = {ko:'성경 오디오 낭독',en:'Bible audio reading',ja:'聖書 音声朗読','zh-CN':'有声圣经','zh-TW':'有聲聖經',fil:'pakikinig ng Bibliya',es:'Biblia en audio','pt-BR':'Bíblia em áudio',ru:'аудиобиблия',uk:'аудіобіблія'};
const CHAPTER_WORDS = {en:'chapter|chap(?:ter)?|ch',ko:'chapter|장|ch',ja:'chapter|第','zh-CN':'chapter|第','zh-TW':'chapter|第',fil:'chapter|kabanata|kab',es:'chapter|capitulo|cap','pt-BR':'chapter|capitulo|cap',ru:'chapter|глава|гл',uk:'chapter|глава|гл|розділ|розд'};
const VERSE_WORDS = {en:'verse|v',ko:'verse|절',ja:'verse|節','zh-CN':'verse|节','zh-TW':'verse|節',fil:'verse|talata',es:'verse|versiculo|v', 'pt-BR':'verse|versiculo|v',ru:'verse|стих|ст',uk:'verse|вірш|ст'};
const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const foldLatinMarks = value => String(value||'').normalize('NFKD').replace(/([\p{Script=Latin}])\p{M}+/gu,'$1').normalize('NFC');
const normalized = value => foldLatinMarks(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const captionText = value => foldLatinMarks(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export function editionList(locale) {
  return (EDITIONS[locale] || []).map(([id,name]) => ({id,name}));
}

export function audioLanguageList() {
  return Object.entries(audioBookNames.locales).map(([code,language])=>({code,name:language.label}));
}

function editionScore(text, title, id, name) {
  const source=normalized(text),normalizedName=normalized(name),normalizedId=normalized(id);
  const exactName=normalizedName.length>2&&source.includes(normalizedName);
  const exactId=normalizedId.length>2&&(normalizedId.length<=4?new RegExp(`(?:^|[^\\p{L}\\p{N}])${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^\\p{L}\\p{N}])`,'iu').test(text):source.includes(normalizedId));
  return (exactName?(title?100:30)+normalizedName.length:0)+(exactId?(title?50:15)+normalizedId.length:0);
}

function hasChapterMarker(value, locale, chapter) {
  const words=CHAPTER_WORDS[locale]||CHAPTER_WORDS.en;
  const text=captionText(value);
  return new RegExp(`(?:^|\\s)(?:${words})\\s*${chapter}(?=\\s|章|节|節|$)`,'u').test(text)||new RegExp(`(?:^|\\s)(?:第\\s*)?${chapter}\\s*(?:章|장|节|節)(?=\\s|$)`,'u').test(text);
}

function matchesChapterAfterBook(title, bookNames, locale, chapter) {
  const text=captionText(title),plain=new RegExp(`(?:^|\\s)${chapter}(?=\\s|[:.]|章|장|$)`,'u');
  return bookNames.some(name=>{
    const book=captionText(name);if(!book)return false;
    let start=text.indexOf(book);
    while(start>=0){
      const after=text.slice(start+book.length,start+book.length+64),before=text.slice(Math.max(0,start-64),start);
      if(hasChapterMarker(after,locale,chapter)||hasChapterMarker(before,locale,chapter)||plain.test(after))return true;
      start=text.indexOf(book,start+book.length);
    }
    return false;
  });
}

function parseCues(description, bookNames, locale, bookId, chapter, videoId, exactChapter) {
  const cues=[];
  let chapterSeconds=null;
  for (const line of String(description || '').split(/\r?\n/)) {
    const match=/^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/.exec(line);
    if(!match) continue;
    const label=captionText(match[2].replace(/[「」『』]/g,''));
    const parts=match[1].split(':').map(Number),seconds=parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts[0]*60+parts[1];
    if(hasChapterMarker(label,locale,chapter)||(exactChapter&&new RegExp(`(?:^|\\s)${chapter}(?=\\s|[:.]|章|장|$)`,'u').test(label)))chapterSeconds??=seconds;
    let reference=null;
    for(const name of bookNames){const alias=captionText(name);if(alias&&label.startsWith(alias+' ')){const words=CHAPTER_WORDS[locale]||CHAPTER_WORDS.en,verses=VERSE_WORDS[locale]||VERSE_WORDS.en;reference=new RegExp(`^${escapeRegExp(alias)}\\s+(?:(?:${words})\\s*)?(?:第\\s*)?${chapter}(?:\\s*(?:章|장|节|節))?\\s*(?:(?:(?:第|${verses})\\s*)?(\\d{1,3})(?:\\s*(?:절|节|節))?)?(?:\\s|$)`,'u').exec(label);if(reference?.[1])break;}}
    if(!reference&&exactChapter)reference=new RegExp(`^${chapter}\\s+(\\d{1,3})(?:\\s|$)`,'u').exec(label);
    const verseLabel=/^(?:verse|v|절|節|стих|вірш|versiculo|verso|talata)\s*(\d{1,3})(?:\s|$)/u.exec(label);
    const verse=Number(reference?.[1]||(exactChapter?verseLabel?.[1]:0)||0);
    if(verse<1 || verse>176 || cues.some(cue=>cue.verse===verse)) continue;
    cues.push({bookId,chapter,verse,seconds,videoId});
  }
  return {cues,chapterSeconds};
}

export async function searchYouTube(request, env, reserveQuota) {
  const text=await request.text();
  if(text.length>2048) return Response.json({error:'payload_too_large'},{status:413});
  const input=await Promise.resolve().then(()=>JSON.parse(text)).catch(()=>null);
  if(!input || !Object.hasOwn(EDITIONS,input.locale)) return Response.json({error:'invalid_locale'},{status:400});
  const editions=EDITIONS[input.locale];
  const bookIndex=BOOKS.indexOf(input.bookId),chapter=Number(input.chapter),bookName=clean(input.bookName,80);
  if(bookIndex<0 || !Number.isInteger(chapter) || chapter<1 || chapter>CHAPTERS[bookIndex] || !bookName) return Response.json({error:'invalid_passage'},{status:400});
  if(!env.YOUTUBE_DATA_API_KEY) return Response.json({error:'service_unavailable'},{status:503});
  const bookNames=[...new Set([...(audioBookNames.locales[input.locale]?.books[input.bookId]||[]),bookName].map(name=>clean(name,80)).filter(Boolean))];
  const phrase=PHRASES[input.locale];
  const queryFor=selected=>[selected.flatMap(([id,name])=>[`"${name}"`,id]).join('|'),bookNames[0],chapter,phrase].join(' ');
  const requestSearch=async query=>{
    const quota=await reserveQuota?.();if(quota)return{quota};
    const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'50',relevanceLanguage:LANG_TAG[input.locale],q:query,fields:'items(id/videoId,snippet(title,description,channelTitle))'});
    const response=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`,{headers:{'x-goog-api-key':env.YOUTUBE_DATA_API_KEY},signal:AbortSignal.timeout(10000)}).catch(()=>null);
    if(response?.status===429){const quota=await reserveQuota?.(true);return{quota:quota||Response.json({error:'daily_search_limit'},{status:429})};}
    if(response?.status===403){const data=await response.json().catch(()=>null),quotaExceeded=data?.error?.errors?.some(error=>error?.reason==='quotaExceeded');if(quotaExceeded){const quota=await reserveQuota?.(true);return{quota:quota||Response.json({error:'daily_search_limit'},{status:429})};}}
    if(!response?.ok)return{error:true};
    const data=await response.json().catch(()=>null);return{items:data?.items||[]};
  };
  const classify=(raw,selected)=>raw.filter(item=>/^[\w-]{11}$/.test(item?.id?.videoId||'')).map(item=>{
    const videoId=item.id.videoId,title=clean(item.snippet?.title,180),description=String(item.snippet?.description||"").slice(0,5000);
    const chapterMatch=matchesChapterAfterBook(title,bookNames,input.locale,chapter);
    const parsed=parseCues(description,bookNames,input.locale,input.bookId,chapter,videoId,chapterMatch),cueKind=parsed.cues.length?'verse':parsed.chapterSeconds!==null?'chapter':'none',verseCues=parsed.cues;
    if(cueKind==='chapter') verseCues.push({bookId:input.bookId,chapter,verse:1,seconds:parsed.chapterSeconds,videoId});
    const channelTitle=clean(item.snippet?.channelTitle,100),matches=selected.map(([id,name],index)=>({id,name,index,score:editionScore(title,true,id,name)*2+editionScore(description,false,id,name)+editionScore(channelTitle,false,id,name)})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
    return {videoId,title,channelTitle,url:`https://www.youtube.com/watch?v=${videoId}`,verseCues,chapterMatch,cueKind,editionId:matches[0]?.id||null};
  });
  const first=await requestSearch(queryFor(editions));
  if(first.quota)return first.quota;
  if(first.error)return Response.json({error:'youtube_search_failed'},{status:502});
  const items=classify(first.items,editions);
  const missing=editions.filter(([id])=>!items.some(item=>item.editionId===id));
  let fallbackLimited=false;
  if(missing.length){
    const fallback=await requestSearch(queryFor(missing));
    if(fallback.quota)fallbackLimited=true;
    else if(!fallback.error){
      const missingIds=new Set(missing.map(([id])=>id));
      for(const item of classify(fallback.items,editions))if(missingIds.has(item.editionId)&&!items.some(existing=>existing.videoId===item.videoId))items.push(item);
    }
  }
  const groups=editions.map(([id,name])=>({id,name,items:items.filter(item=>item.editionId===id).slice(0,5)}));
  return Response.json({locale:input.locale,bookId:input.bookId,chapter,editions:groups,...(fallbackLimited?{fallbackLimited:true}:{})},{headers:{'Cache-Control':'no-store'}});
}
