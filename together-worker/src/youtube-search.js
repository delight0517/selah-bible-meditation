import audioBookNames from './audio-book-names.json' with {type:'json'};
import { MAX_SCHEDULED_COVERAGE_CANDIDATES } from './youtube-quota.js';

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
  const text=foldLatinMarks(title).toLocaleLowerCase().replace(/[^\p{L}\p{N}:\p{Pd}]+/gu,' ').trim(),plain=new RegExp(`(?:^|\\s)${chapter}(?=\\s|[:.]|章|장|$)`,'u');
  return bookNames.some(name=>{
    const book=foldLatinMarks(name).toLocaleLowerCase().replace(/[^\p{L}\p{N}:\p{Pd}]+/gu,' ').trim();if(!book)return false;
    let start=text.indexOf(book);
    while(start>=0){
      const after=text.slice(start+book.length,start+book.length+64),before=text.slice(Math.max(0,start-64),start);
      if(hasChapterMarker(after,locale,chapter)||hasChapterMarker(before,locale,chapter)||plain.test(after))return true;
      start=text.indexOf(book,start+book.length);
    }
    return false;
  });
}

function playlistChapterRefs(title, locale) {
  const numbers=[...new Set(String(title||'').match(/\d{1,3}/g)||[])].map(Number),matches=[];
  for(const bookId of BOOKS){
    const names=audioBookNames.locales[locale]?.books[bookId]||[];
    const aliasLength=Math.max(0,...names.filter(name=>numbers.some(chapter=>matchesChapterAfterBook(title,[name],locale,chapter))).map(name=>captionText(name).length));
    const chapters=numbers.filter(chapter=>chapter>=1&&chapter<=CHAPTERS[BOOKS.indexOf(bookId)]&&matchesChapterAfterBook(title,names,locale,chapter));
    for(const chapter of chapters)matches.push({bookId,chapter,aliasLength});
  }
  const longest=Math.max(0,...matches.map(match=>match.aliasLength));
  const chapterRefs=matches.filter(match=>match.aliasLength===longest).map(({bookId,chapter})=>({bookId,chapter}));
  if(chapterRefs.length)return chapterRefs;
  if(!/(?:audio|bible|scripture|聖書|圣经|성경|biblia|bibliya|аудио|біблі)/iu.test(title))return [];
  const source=` ${captionText(title)} `,bookMatches=[];
  for(const bookId of BOOKS){
    const aliases=audioBookNames.locales[locale]?.books[bookId]||[];
    const alias=aliases.map(captionText).filter(value=>value&&source.includes(` ${value} `)).sort((a,b)=>b.length-a.length)[0];
    if(alias)bookMatches.push({bookId,aliasLength:alias.length});
  }
  const bookLength=Math.max(0,...bookMatches.map(match=>match.aliasLength));
  const bookIds=[...new Set(bookMatches.filter(match=>match.aliasLength===bookLength).map(match=>match.bookId))];
  if(bookIds.length!==1)return [];
  const bookId=bookIds[0],count=CHAPTERS[BOOKS.indexOf(bookId)];
  return Array.from({length:count},(_,index)=>({bookId,chapter:index+1,wholeBook:true}));
}

export async function verifyYouTubePlaylistCoverage(request, env, reserveQuota) {
  const text=await request.text();
  if(text.length>2048)return Response.json({error:'payload_too_large'},{status:413});
  const input=await Promise.resolve().then(()=>JSON.parse(text)).catch(()=>null);
  if(!input||!Object.hasOwn(EDITIONS,input.locale)||!editionList(input.locale).some(item=>item.id===input.editionId)||!/^[-\w]{10,128}$/.test(input.playlistId||''))return Response.json({error:'invalid_playlist'},{status:400});
  const currentChapter=Number(input.chapter),currentBookId=String(input.bookId||'');
  if(!BOOKS.includes(currentBookId)||!Number.isInteger(currentChapter)||currentChapter<1||currentChapter>CHAPTERS[BOOKS.indexOf(currentBookId)])return Response.json({error:'invalid_passage'},{status:400});
  if(!env.YOUTUBE_DATA_API_KEY)return Response.json({error:'service_unavailable'},{status:503});
  const quota=await reserveQuota?.();if(quota)return quota;
  const api=async(path,params)=>{
    const query=new URLSearchParams(params);query.set('key',env.YOUTUBE_DATA_API_KEY);
    const response=await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query}`,{signal:AbortSignal.timeout(10000)}).catch(()=>null);
    if(!response?.ok){
      const data=await response?.json().catch(()=>null),quotaExceeded=response?.status===429||data?.error?.errors?.some(error=>['quotaExceeded','dailyLimitExceeded'].includes(error?.reason));
      if(quotaExceeded){await reserveQuota?.(true);return{error:'youtube_quota_unavailable',status:429};}
      return{error:'youtube_request_failed',status:502};
    }
    const data=await response.json().catch(()=>null);return data?{data}:{error:'youtube_request_failed',status:502};
  };
  const playlist=await api('playlists',{part:'snippet,contentDetails',id:input.playlistId,fields:'items(id,snippet(title,description,channelTitle),contentDetails/itemCount)'});
  if(playlist.error)return Response.json({error:playlist.error},{status:playlist.status});
  const metadata=playlist.data.items?.[0];
  if(!metadata)return Response.json({error:'playlist_not_found'},{status:404});
  const editions=editionList(input.locale),edition=editions.find(item=>item.id===input.editionId),metadataText=[metadata.snippet?.title,metadata.snippet?.description,metadata.snippet?.channelTitle].join(' ');
  const metadataEditionScore=editionScore(metadataText,true,edition.id,edition.name),otherMetadataScore=Math.max(0,...editions.filter(item=>item.id!==edition.id).map(item=>editionScore(metadataText,true,item.id,item.name)));
  const playlistEditionMatches=metadataEditionScore>otherMetadataScore&&metadataEditionScore>0,metadataConflict=otherMetadataScore>=metadataEditionScore&&otherMetadataScore>0,itemCount=Number(metadata.contentDetails?.itemCount)||0;
  if(itemCount>1200)return Response.json({status:'SCAN_LIMIT',playlistId:input.playlistId,itemCount},{headers:{'Cache-Control':'no-store'}});
  const playlistItems=[];let pageToken='';
  do{
    const params={part:'snippet',maxResults:'50',playlistId:input.playlistId,fields:'nextPageToken,items(snippet(title,position,resourceId/videoId))'};
    if(pageToken)params.pageToken=pageToken;
    const page=await api('playlistItems',params);
    if(page.error)return Response.json({error:page.error},{status:page.status});
    playlistItems.push(...(page.data.items||[]));pageToken=page.data.nextPageToken||'';
  }while(pageToken&&playlistItems.length<1200);
  if(pageToken||playlistItems.length!==itemCount)return Response.json({status:'SCAN_INCOMPLETE',playlistId:input.playlistId,itemCount,scannedItems:playlistItems.length},{headers:{'Cache-Control':'no-store'}});
  const candidateItems=playlistItems.filter(item=>{
    const videoId=item.snippet?.resourceId?.videoId;
    if(!/^[\w-]{11}$/.test(videoId||''))return false;
    const title=item.snippet?.title||'',selectedScore=editionScore(title,true,edition.id,edition.name),otherScore=Math.max(0,...editions.filter(candidate=>candidate.id!==edition.id).map(candidate=>editionScore(title,true,candidate.id,candidate.name)));
    if(otherScore>=selectedScore&&otherScore>0)return false;
    return playlistEditionMatches&&!metadataConflict||selectedScore>otherScore&&selectedScore>0;
  });
  if(!candidateItems.length)return Response.json({error:'edition_mismatch'},{status:422});
  const videos=[];
  for(let start=0;start<candidateItems.length;start+=50){
    const ids=candidateItems.slice(start,start+50).map(item=>item.snippet.resourceId.videoId);
    if(!ids.length)continue;
    const batch=await api('videos',{part:'snippet',id:ids.join(','),fields:'items(id,snippet(description))'});
    if(batch.error)return Response.json({error:batch.error},{status:batch.status});
    videos.push(...(batch.data.items||[]));
  }
  const descriptions=new Map(videos.map(video=>[video.id,video.snippet?.description||''])),chapterCues=[],verseCues=[],covered=new Set(),videoIds=[];let explicitVerseCueCount=0;
  for(let index=0;index<candidateItems.length;index++){
    const item=candidateItems[index],videoId=item.snippet.resourceId.videoId,itemTitle=item.snippet?.title||'';
    if(!/^[\w-]{11}$/.test(videoId||'')||!descriptions.has(videoId))continue;
    videoIds.push(videoId);
    const playlistIndex=videoIds.length-1;
    for(const ref of playlistChapterRefs(itemTitle,input.locale)){
      const key=`${ref.bookId}:${ref.chapter}`;
      if(covered.has(key))continue;
      const names=audioBookNames.locales[input.locale]?.books[ref.bookId]||[];
      const parsed=parseCues(descriptions.get(videoId),names,input.locale,ref.bookId,ref.chapter,videoId,true);
      if(ref.wholeBook&&parsed.chapterSeconds===null)continue;
      const {wholeBook,...chapterRef}=ref;
      const cue={...chapterRef,verse:1,seconds:parsed.chapterSeconds??0,videoId,playlistIndex};
      covered.add(key);chapterCues.push(cue);
      explicitVerseCueCount+=parsed.cues.length;
      const cues=parsed.cues.some(value=>value.verse===1)?parsed.cues:[cue,...parsed.cues];
      for(const value of cues)verseCues.push({...value,playlistIndex});
    }
  }
  if(!videoIds.length)return Response.json({error:'edition_mismatch'},{status:422});
  const missing=[];
  for(let i=0;i<BOOKS.length;i++)for(let chapter=1;chapter<=CHAPTERS[i];chapter++)if(!covered.has(`${BOOKS[i]}:${chapter}`))missing.push({bookId:BOOKS[i],chapter});
  const complete=missing.length===0;
  return Response.json({status:complete?'COMPLETE_CHAPTER_COVERAGE':'PARTIAL_COVERAGE',locale:input.locale,editionId:edition.id,playlistId:input.playlistId,channelTitle:metadata.snippet?.channelTitle||'',itemCount,coveredChapters:covered.size,totalChapters:1189,explicitVerseCueCount,missingChapters:missing,videoIds,chapterSync:chapterCues.length>0,verseCues},{headers:{'Cache-Control':'no-store'}});
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

export async function searchYouTube(request, env, reserveQuota, { playlistOnly = false, pageToken = '', fallbackPageTokens = {} } = {}) {
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
  const queryFor=selected=>[selected.flatMap(([id,name])=>[`"${name}"`,id]).join('|'),bookNames[0],chapter,phrase,...(playlistOnly?['playlist']:[])].join(' ');
  if(typeof pageToken!=='string'||pageToken.length>512||!fallbackPageTokens||typeof fallbackPageTokens!=='object'||Array.isArray(fallbackPageTokens))return Response.json({error:'invalid_page_token'},{status:400});
  const requestSearch=async (query,token='')=>{
    const quota=await reserveQuota?.();if(quota)return{quota};
    const params=new URLSearchParams({part:'snippet',type:playlistOnly?'playlist':'video,playlist',maxResults:'50',relevanceLanguage:LANG_TAG[input.locale],q:query,fields:'nextPageToken,items(id(videoId,playlistId),snippet(title,description,channelTitle))'});
    if(token)params.set('pageToken',token);
    const response=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`,{headers:{'x-goog-api-key':env.YOUTUBE_DATA_API_KEY},signal:AbortSignal.timeout(10000)}).catch(()=>null);
    const data=await response?.json().catch(()=>null),reasons=(data?.error?.errors||[]).map(error=>error?.reason).filter(reason=>typeof reason==='string'&&/^[\w-]{1,64}$/.test(reason)).slice(0,5);
    if(response?.status===429||reasons.some(reason=>['quotaExceeded','dailyLimitExceeded'].includes(reason))){const quota=await reserveQuota?.(true);return{quota:quota||Response.json({error:'daily_search_limit'},{status:429})};}
    if(!response?.ok){console.error('youtube_search_upstream_error',{status:response?.status||0,reasons,locale:input.locale});return{error:true};}
    return{items:data?.items||[],nextPageToken:typeof data?.nextPageToken==='string'?data.nextPageToken:''};
  };
  const classify=(raw,selected)=>raw.filter(item=>/^[\w-]{11}$/.test(item?.id?.videoId||'')||/^[\w-]{10,128}$/.test(item?.id?.playlistId||'')).map(item=>{
    const videoId=item.id.videoId||null,playlistId=item.id.playlistId||null,assetId=videoId||playlistId,mediaType=playlistId?'playlist':'video',title=clean(item.snippet?.title,180),description=String(item.snippet?.description||"").slice(0,5000);
    const chapterMatch=matchesChapterAfterBook(title,bookNames,input.locale,chapter);
    const parsed=videoId?parseCues(description,bookNames,input.locale,input.bookId,chapter,videoId,chapterMatch):{cues:[],chapterSeconds:null},cueKind=parsed.cues.length?'verse':parsed.chapterSeconds!==null?'chapter':'none',verseCues=parsed.cues;
    if(cueKind==='chapter') verseCues.push({bookId:input.bookId,chapter,verse:1,seconds:parsed.chapterSeconds,videoId});
    const channelTitle=clean(item.snippet?.channelTitle,100),matches=selected.map(([id,name],index)=>({id,name,index,score:editionScore(title,true,id,name)*2+editionScore(description,false,id,name)+editionScore(channelTitle,false,id,name)})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
    return {videoId,playlistId,mediaType,title,channelTitle,url:playlistId?`https://www.youtube.com/playlist?list=${playlistId}`:`https://www.youtube.com/watch?v=${videoId}`,verseCues,chapterMatch,cueKind,editionId:matches[0]?.id||null,_assetId:assetId};
  });
  const first=await requestSearch(queryFor(editions),pageToken);
  if(first.quota)return first.quota;
  if(first.error)return Response.json({error:'youtube_search_failed'},{status:502});
  const items=classify(first.items,editions);
  const missing=editions.filter(([id])=>!items.some(item=>item.editionId===id));
  const fallbackPageTokenKey=missing.map(([id])=>id).join(',');
  const fallbackPageToken=fallbackPageTokenKey&&Object.hasOwn(fallbackPageTokens,fallbackPageTokenKey)?fallbackPageTokens[fallbackPageTokenKey]:'';
  if(typeof fallbackPageToken!=='string'||fallbackPageToken.length>512)return Response.json({error:'invalid_page_token'},{status:400});
  let fallbackLimited=false;
  let fallbackNextPageToken='';
  if(missing.length){
    const fallback=await requestSearch(queryFor(missing),fallbackPageToken);
    if(fallback.quota)fallbackLimited=true;
    else if(!fallback.error){
      fallbackNextPageToken=fallback.nextPageToken;
      const missingIds=new Set(missing.map(([id])=>id));
      for(const item of classify(fallback.items,editions))if(missingIds.has(item.editionId)&&!items.some(existing=>existing._assetId===item._assetId))items.push(item);
    }
  }
  const maxPlaylistCandidatesPerEdition=Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES/editions.length);
  const groups=editions.map(([id,name])=>({id,name,items:items.filter(item=>item.editionId===id).slice(0,maxPlaylistCandidatesPerEdition).map(({_assetId,...item})=>item)}));
  return Response.json({locale:input.locale,bookId:input.bookId,chapter,editions:groups,...(playlistOnly?{nextPageToken:first.nextPageToken,fallbackPageTokenKey,fallbackNextPageToken}:{}),...(fallbackLimited?{fallbackLimited:true}:{})},{headers:{'Cache-Control':'no-store'}});
}
