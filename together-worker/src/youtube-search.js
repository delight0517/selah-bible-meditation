const EDITIONS = {
  en: [['KJV','King James Version'],['NIV','New International Version'],['ESV','English Standard Version'],['NKJV','New King James Version'],['NLT','New Living Translation']],
  ko: [['KRV','개역한글'],['NKRV','개역개정'],['KSB','새번역'],['KCB','공동번역'],['KLB','우리말성경']],
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
const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const normalized = value => String(value||'').normalize('NFKD').toLocaleLowerCase().replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,'');

export function editionList(locale) {
  return (EDITIONS[locale] || []).map(([id,name]) => ({id,name}));
}

function editionScore(text, title, id, name) {
  const source=normalized(text),normalizedName=normalized(name),normalizedId=normalized(id);
  const exactName=normalizedName.length>2&&source.includes(normalizedName);
  const exactId=normalizedId.length>2&&(normalizedId.length<=4?new RegExp(`(?:^|[^\\p{L}\\p{N}])${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^\\p{L}\\p{N}])`,'iu').test(text):source.includes(normalizedId));
  return (exactName?(title?100:30)+normalizedName.length:0)+(exactId?(title?50:15)+normalizedId.length:0);
}

function parseCues(description, bookName, bookId, chapter, videoId, exactChapter) {
  const cues=[];
  let chapterSeconds=null;
  for (const line of String(description || '').split(/\r?\n/)) {
    const match=/^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/u.exec(line);
    if(!match) continue;
    const label=match[2].replace(/[「」『』]/g,'').trim();
    const escaped=bookName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const parts=match[1].split(':').map(Number),seconds=parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts[0]*60+parts[1];
    if(new RegExp(`^(?:${escaped}\\s+)?(?:chapter|chap(?:ter)?\\.?|ch\\.?|第)?\\s*${chapter}(?:章|장)?(?:\\D|$)`,'iu').test(label)) chapterSeconds??=seconds;
    const reference=new RegExp(`^(?:${escaped}\\s+)?${chapter}\\s*[:.]\\s*(\\d{1,3})(?:\\D|$)`,'iu').exec(label);
    const verseLabel=/^(?:verse|v\.?|절|節|стих|versículo|versiculo|verso)\s*(\d{1,3})(?:\D|$)/iu.exec(label);
    const verse=Number((reference&&(/^\s*\S+\s+/.test(label)||exactChapter)?reference[1]:0)||(exactChapter?verseLabel?.[1]:0)||0);
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
  const editionTerms=editions.flatMap(([id,name])=>[`"${name}"`,id]).join('|');
  const query=[editionTerms,bookName,chapter,input.locale==='ko'?'성경 오디오 낭독':input.locale.startsWith('zh')?'有声圣经':input.locale==='ja'?'聖書 音声朗読':'Bible audio reading'].join(' ');
  const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'50',relevanceLanguage:LANG_TAG[input.locale],q:query,fields:'items(id/videoId,snippet(title,description,channelTitle))'});
  const quota=await reserveQuota?.();
  if(quota) return quota;
  const response=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`,{headers:{'x-goog-api-key':env.YOUTUBE_DATA_API_KEY},signal:AbortSignal.timeout(10000)}).catch(()=>null);
  if(!response?.ok) return Response.json({error:'youtube_search_failed'},{status:502});
  const data=await response.json().catch(()=>null);
  const items=(data?.items||[]).filter(item=>/^[\w-]{11}$/.test(item?.id?.videoId||'')).map(item=>{
    const videoId=item.id.videoId,title=clean(item.snippet?.title,180),description=String(item.snippet?.description||"").slice(0,5000);
    const normalizedTitle=title.normalize('NFKC').toLocaleLowerCase(),normalizedBook=bookName.normalize('NFKC').toLocaleLowerCase();
    const chapterMatch=normalizedTitle.includes(normalizedBook) && new RegExp(`(?:chapter|chap(?:ter)?\\.?|ch\\.?|第)?\\s*${chapter}(?:章|장)?(?:$|[^\\p{L}\\p{N}])`,'iu').test(normalizedTitle.slice(normalizedTitle.indexOf(normalizedBook)+normalizedBook.length));
    const parsed=parseCues(description,bookName,input.bookId,chapter,videoId,chapterMatch),cueKind=parsed.cues.length?'verse':parsed.chapterSeconds!==null?'chapter':'none',verseCues=parsed.cues;
    if(cueKind==='chapter') verseCues.push({bookId:input.bookId,chapter,verse:1,seconds:parsed.chapterSeconds,videoId});
    const channelTitle=clean(item.snippet?.channelTitle,100),matches=editions.map(([id,name],index)=>({id,name,index,score:editionScore(title,true,id,name)*2+editionScore(description,false,id,name)+editionScore(channelTitle,false,id,name)})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
    return {videoId,title,channelTitle,url:`https://www.youtube.com/watch?v=${videoId}`,verseCues,chapterMatch,cueKind,editionId:matches[0]?.id||null};
  });
  const groups=editions.map(([id,name])=>({id,name,items:items.filter(item=>item.editionId===id).slice(0,5)}));
  return Response.json({locale:input.locale,bookId:input.bookId,chapter,editions:groups},{headers:{'Cache-Control':'no-store'}});
}
