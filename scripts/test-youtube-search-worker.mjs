import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker, { TogetherRoom } from '../together-worker/src/index.js';
import { audioLanguageList, editionList, searchYouTube, verifyYouTubePlaylistCoverage } from '../together-worker/src/youtube-search.js';
import { MAX_SCHEDULED_COVERAGE_CANDIDATES, YOUTUBE_QUOTA_LIMITS } from '../together-worker/src/youtube-quota.js';
import audioBookNames from '../together-worker/src/audio-book-names.json' with {type:'json'};

for (const locale of ['en','ko','ja','zh-CN','zh-TW','fil','es','pt-BR','ru','uk']) assert.ok(editionList(locale).length>=5,`${locale} edition choices`);
assert.deepEqual(audioLanguageList().map(language=>language.code),['en','ko','ja','zh-CN','zh-TW','ru','uk','es','pt-BR','fil'],'ten selectable audio languages');
assert.equal(editionList('ko').length,6,'Korean has six configured audio editions');
assert.equal(editionList('xx').length,0);

const originalFetch=globalThis.fetch;
let captured,calls=[];
globalThis.fetch=async (url,options)=>{
  captured={url:String(url),options};
  calls.push(captured);
  return Response.json({items:calls.length===1?[
    {id:{videoId:'abcdefghijk'},snippet:{title:'NIV Matthew Chapter 1 Audio Bible',description:'00:00 Verse 1\n00:17 Verse 2',channelTitle:'Audio channel'}},
    {id:{videoId:'lmnopqrstuv'},snippet:{title:'KJV Matthew 1 reading',description:'00:05 Chapter 1',channelTitle:'Another channel'}},
    {id:{videoId:'rangexyz123'},snippet:{title:'NIV Matthew 1-28 Audio Bible',description:'',channelTitle:'Audio channel'}},
    ...Array.from({length:4},(_,index)=>({id:{videoId:`niv0000000${index+1}`},snippet:{title:`NIV Matthew 1 audio ${index+1}`,description:'',channelTitle:'Audio channel'}})),
    ...Array.from({length:4},(_,index)=>({id:{videoId:`kjv0000000${index+1}`},snippet:{title:`KJV Matthew 1 audio ${index+1}`,description:'',channelTitle:'Another channel'}})),
    {id:{videoId:'xyzabcdefgh'},snippet:{title:'Best Bible reading',description:'00:00 Verse 1',channelTitle:'Unrelated title'}},
  ]:[
    {id:{videoId:'bcdefghijkl'},snippet:{title:'New King James Version Matthew 1 audio',description:'',channelTitle:'Test'}},
    {id:{videoId:'cdefghijklm'},snippet:{title:'ESV Matthew 1 audio',description:'',channelTitle:'Test'}},
    {id:{videoId:'defghijklmn'},snippet:{title:'NLT Matthew 1 audio',description:'',channelTitle:'Test'}},
  ]});
};
try {
  const result=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'never-return-this-key'});
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.editions.length,editionList('en').length);
  const niv=data.editions.find(item=>item.id==='NIV'),kjv=data.editions.find(item=>item.id==='KJV');
  assert.equal(calls.length,2,'one focused fallback search fills editions missing from the first result page');
  assert.equal(data.editions.every(group=>group.items.length>0),true,'initial and fallback results fill all five editions');
  assert.equal(niv.items.length,6);
  assert.equal(kjv.items.length,5);
  assert.equal(data.editions.find(item=>item.id==='NKJV').items[0].title,'New King James Version Matthew 1 audio','specific edition name wins over the KJV substring');
  assert.equal(niv.items[0].verseCues[1].verse,2);
  assert.equal(niv.items[0].cueKind,'verse');
  assert.equal(niv.items.find(item=>item.videoId==='rangexyz123').fullChapterMatch,false,'a video spanning Matthew 1-28 is not a precise Matthew chapter 1 fallback');
  assert.equal(kjv.items[0].verseCues[0].seconds,5,'explicit chapter timestamp provides a chapter-start cue');
  assert.equal(kjv.items[0].cueKind,'chapter');
  assert.equal(data.editions.every(group=>group.items.every(item=>item.videoId!=='xyzabcdefgh')),true,'unclassified video does not claim a translation');
  const query=new URL(calls[0].url).searchParams,fallbackQuery=new URL(captured.url).searchParams;
  assert.equal(query.get('maxResults'),'50');
  assert.equal(query.get('type'),'video,playlist','edition searches include complete audio playlists and videos');
  assert.equal(query.get('fields'),'nextPageToken,items(id(videoId,playlistId),snippet(title,description,channelTitle))','search selects the next-page cursor and both nested video and playlist IDs');
  assert.equal(query.has('videoEmbeddable'),false,'playlist discovery is not filtered out by a video-only parameter');
  assert.equal(query.get('q').includes('|'),true,'all five editions share one OR search');
  assert.equal(fallbackQuery.get('q').includes('New King James Version'),true,'fallback includes a missing edition');
  assert.equal(fallbackQuery.get('q').includes('New International Version'),false,'fallback omits editions already found');
  assert.equal(captured.options.headers['x-goog-api-key'],'never-return-this-key');
  assert.equal(captured.url.includes('never-return-this-key'),false);
  assert.equal(JSON.stringify(data).includes('never-return-this-key'),false);
  const pageRequests=[];
  globalThis.fetch=async url=>{pageRequests.push(String(url));return Response.json({nextPageToken:'next-search-page',items:[{id:{playlistId:'PL12345678901234567890'},snippet:{title:'KJV Matthew complete audio Bible playlist',description:'',channelTitle:'KJV Audio'}}]})};
  const fallbackKey='NIV,ESV,NKJV,NLT';
  const paged=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},undefined,{playlistOnly:true,pageToken:'saved-search-page',fallbackPageTokens:{[fallbackKey]:'saved-fallback-page'}});
  const pagedData=await paged.json();
  assert.equal(new URL(pageRequests[0]).searchParams.get('pageToken'),'saved-search-page','scheduled search resumes the exact previous YouTube result page');
  assert.equal(new URL(pageRequests[1]).searchParams.get('pageToken'),'saved-fallback-page','edition-specific fallback resumes only its matching query cursor');
  assert.equal(pagedData.nextPageToken,'next-search-page','the broad search returns its next cursor even when a fallback query runs');
  assert.equal(pagedData.fallbackPageTokenKey,fallbackKey);
  assert.equal(pagedData.fallbackNextPageToken,'next-search-page','the fallback query returns its own page cursor');
  globalThis.fetch=async()=>Response.json({items:[{id:{videoId:'rangevideo1'},snippet:{title:'Scripture for these times. Matthew 23:1-12 (ESV)',description:'',channelTitle:'ESV'}}]});
  const verseRange=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  assert.equal((await verseRange.json()).editions.find(group=>group.id==='ESV').items[0].chapterMatch,false,'a verse range such as Matthew 23:1-12 is not Matthew chapter 1');
  globalThis.fetch=async()=>Response.json({items:[{id:{videoId:'rangevideo2'},snippet:{title:'Matthew 1:18-25 (ESV)',description:'',channelTitle:'ESV'}}]});
  const sameChapterVerseRange=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const sameChapterRangeItem=(await sameChapterVerseRange.json()).editions.find(group=>group.id==='ESV').items[0];
  assert.equal(sameChapterRangeItem.chapterMatch,true,'the excerpt still matches Matthew chapter 1 for partial manual search');
  assert.equal(sameChapterRangeItem.fullChapterMatch,false,'Matthew 1:18-25 is a verse excerpt, not the complete chapter');
  globalThis.fetch=async()=>Response.json({items:[{id:{videoId:'rangevideo3'},snippet:{title:'マタイによる福音書（１：18-25）【新共同訳】',description:'',channelTitle:'聖書朗読'}}]});
  const japaneseVerseRange=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ja',bookId:'MAT',bookName:'マタイによる福音書',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const japaneseRangeItem=(await japaneseVerseRange.json()).editions.find(group=>group.id==='新共同訳').items[0];
  assert.equal(japaneseRangeItem.chapterMatch,true,'Japanese verse excerpts remain available as manual chapter results');
  assert.equal(japaneseRangeItem.fullChapterMatch,false,'Japanese full-width chapter/verse notation is rejected as a full-chapter catalog fallback');
  globalThis.fetch=async()=>Response.json({items:[
    {id:{videoId:'jpv00000001'},snippet:{title:'新約聖書【口語訳】 マタイによる福音書 第1章 #聖書朗読',description:'',channelTitle:'口語訳聖書朗読'}},
    {id:{videoId:'jpv00000002'},snippet:{title:'マタイの福音書 1章 新改訳聖書2017',description:'',channelTitle:'Bible'}},
    {id:{videoId:'jpv00000003'},snippet:{title:'マタイによる福音書（１：18-25）【新共同訳】',description:'',channelTitle:'Bible'}},
    {id:{videoId:'jpv00000004'},snippet:{title:'マタイによる福音書24章 聖書協会共同訳 聖書朗読',description:'',channelTitle:'Bible'}},
    {id:{videoId:'jpv00000005'},snippet:{title:'【聖書朗読】マタイの福音書1章',description:'',channelTitle:'リビングバイブル'}},
  ]});
  const japaneseCandidates=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ja',bookId:'MAT',bookName:'マタイによる福音書',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const japaneseGroups=(await japaneseCandidates.json()).editions;
  assert.equal(japaneseGroups.find(group=>group.id==='JPN1965').items[0].fullChapterMatch,true,'an exact Japanese chapter title qualifies for automatic fallback');
  assert.equal(japaneseGroups.find(group=>group.id==='新改訳').items[0].fullChapterMatch,true,'a localized Japanese chapter marker qualifies');
  assert.equal(japaneseGroups.find(group=>group.id==='新共同訳').items[0].fullChapterMatch,false,'a Japanese verse excerpt does not qualify as a full chapter');
  assert.equal(japaneseGroups.find(group=>group.id==='聖書協会共同訳').items[0].fullChapterMatch,false,'another chapter does not qualify');
  assert.equal(japaneseGroups.find(group=>group.id==='リビングバイブル').items[0].fullChapterMatch,true,'Japanese script-specific titles retain an exact chapter match');
  let playlistOnlyUrls=[];
  globalThis.fetch=async url=>{playlistOnlyUrls.push(String(url));return Response.json({items:[{id:{playlistId:'PL12345678901234567890'},snippet:{title:'KJV Matthew complete audio Bible playlist',description:'',channelTitle:'KJV Audio'}}]})};
  const playlistOnly=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},undefined,{playlistOnly:true});
  const playlistOnlyData=await playlistOnly.json();
  assert.equal(playlistOnlyUrls.length,2,'playlist discovery makes one focused fallback for editions missing a playlist');
  assert.equal(playlistOnlyUrls.every(url=>new URL(url).searchParams.get('type')==='playlist'),true,'the scheduled search and fallback stay playlist-only');
  assert.equal(new URL(playlistOnlyUrls[0]).searchParams.get('q').endsWith(' playlist'),true,'playlist-only discovery adds a playlist search term');
  assert.equal(playlistOnlyData.editions.find(group=>group.id==='KJV').items[0].mediaType,'playlist');
  for (const locale of ['en','ko']) {
    const localizedEditions=editionList(locale), limit=Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES/localizedEditions.length);
    globalThis.fetch=async()=>Response.json({items:localizedEditions.flatMap((edition,editionIndex)=>Array.from({length:7},(_,candidateIndex)=>({
      id:{playlistId:`PL${String(editionIndex*10+candidateIndex+1).padStart(20,'0')}`},
      snippet:{title:`${edition.name} Matthew chapter 1 Bible audio playlist ${candidateIndex+1}`,description:'',channelTitle:edition.name}
    })))});
    const response=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale,bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},undefined,{playlistOnly:true});
    const groups=(await response.json()).editions;
    assert.ok(groups.every(group=>group.items.length===Math.min(7,limit)),`${locale} exposes at most ${limit} playlist candidates per edition within its scheduled scan share`);
    assert.ok(groups.length*limit<=MAX_SCHEDULED_COVERAGE_CANDIDATES,`${locale} search results never exceed the daily playlist scan ceiling`);
  }
  for (const locale of ['en','ko','ja','zh-CN','zh-TW','fil','es','pt-BR','ru','uk']) {
    globalThis.fetch=async()=>Response.json({items:editionList(locale).map((edition,index)=>({id:{videoId:`id${locale}${index}`.replace(/[^\w-]/g,'').slice(0,11).padEnd(11,'x')},snippet:{title:`${edition.name} Matthew 1 audio`,description:'',channelTitle:'Test'}}))});
    const localized=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale,bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
    const localizedData=await localized.json();
    assert.equal(localizedData.editions.length,editionList(locale).length,`${locale} returns every configured group`);
    assert.equal(localizedData.editions.filter(group=>group.items.length===1).length,editionList(locale).length,`${locale} classifies every configured edition`);
  }
  let compactCalls=0;
  globalThis.fetch=async url=>{compactCalls++;const locale=new URL(url).searchParams.get('relevanceLanguage'),selected=editionList(locale==='es'?'es':'ru');return Response.json({items:selected.map(({id,name},index)=>({id:{videoId:`one${String(index).padStart(8,'0')}`},snippet:{title:`${name} Mateo capítulo 1 audio`,description:'',channelTitle:name}}))})};
  const compact=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'es',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  assert.equal(compact.status,200);assert.equal(compactCalls,1,'one result per edition does not trigger a five-video-per-edition quota-expensive fallback');
  const compactData=await compact.json();assert.equal(compactData.editions.filter(group=>group.items.length).length,5);
  let localizedCalls=0;
  const localizedCases=[
    {locale:'en',title:'KJV Matthew Chapter 1',description:'00:00 Matthew Chapter 1 Verse 1'},
    {locale:'ko',title:'KRV 마태복음 1장',description:'00:00 마태복음 1장 1절'},
    {locale:'ja',title:'JPN1965 マタイの福音書 第1章',description:'00:00 マタイの福音書 第1章 第1節'},
    {locale:'zh-CN',title:'CUV-S 马太福音 第1章',description:'00:00 马太福音 第1章 第1节'},
    {locale:'zh-TW',title:'CUV-T 馬太福音 第1章',description:'00:00 馬太福音 第1章 第1節'},
    {locale:'fil',title:'AB1905 Mateo kabanata 1',description:'00:00 Mateo kabanata 1 talata 1'},
    {locale:'es',title:'RVR1960 Mateo capítulo 1',description:'00:00 Mateo capítulo 1 versículo 1'},
    {locale:'pt-BR',title:'ARC Mateus capítulo 1',description:'00:00 Mateus capítulo 1 versículo 1'},
    {locale:'ru',title:'SYN Матфея глава 1',description:'00:00 Матфея глава 1 стих 1'},
    {locale:'uk',title:'Огієнка Матвія розділ 1',description:'00:00 Матвія розділ 1 вірш 1'}
  ];
  for(const sample of localizedCases){
    globalThis.fetch=async()=>{localizedCalls++;return Response.json({items:[{id:{videoId:`local${String(localizedCalls).padStart(6,'0')}`},snippet:{title:sample.title,description:sample.description,channelTitle:'Localized Bible'}}]})};
    const localized=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:sample.locale,bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
    const grouped=(await localized.json()).editions.flatMap(group=>group.items);
    assert.equal(grouped.length,1,`${sample.locale} recognizes localized audio title with Korean text book name`);
    assert.equal(grouped[0].chapterMatch,true,`${sample.locale} recognizes localized chapter markers`);
    assert.equal(grouped[0].verseCues[0]?.verse,1,`${sample.locale} extracts localized verse timestamps`);
  }
  globalThis.fetch=async()=>Response.json({items:[{id:{playlistId:'PL12345678901234567890'},snippet:{title:'KJV Matthew Complete Audio Bible',description:'Full Bible reading',channelTitle:'Bible audio'}}]});
  const playlist=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const playlistItem=(await playlist.json()).editions.find(group=>group.id==='KJV').items[0];
  assert.equal(playlistItem.mediaType,'playlist','complete edition playlists remain selectable');
  assert.equal(playlistItem.playlistId,'PL12345678901234567890');
  assert.equal(playlistItem.url,'https://www.youtube.com/playlist?list=PL12345678901234567890');
  assert.deepEqual(playlistItem.verseCues,[],'playlist-level timestamps are not mistaken for video verse cues');
  const readerHtml=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const passageCueLine=readerHtml.split('\n').find(line=>line.startsWith('function youtubeAudioHasPassageCue('));
  const relevanceLine=readerHtml.split('\n').find(line=>line.startsWith('function youtubeAudioItemMatchesPassage(item,bookId,chapter,coverage=null){'));
  assert.ok(passageCueLine&&relevanceLine,'the reader has passage-cue and passage-relevance helpers for audio search results');
  const youtubeAudioItemMatchesPassage=new Function(`${passageCueLine};${relevanceLine};return youtubeAudioItemMatchesPassage;`)();
  assert.equal(youtubeAudioItemMatchesPassage({mediaType:'video',chapterMatch:false,verseCues:[]},'JHN',1),false,'off-book/unmatched video results are not shown as current-passage audio');
  assert.equal(youtubeAudioItemMatchesPassage({mediaType:'video',chapterMatch:true,verseCues:[]},'JHN',1),true,'an exact chapter video remains selectable without verse cues');
  assert.equal(youtubeAudioItemMatchesPassage({mediaType:'video',chapterMatch:false,verseCues:[{bookId:'JHN',chapter:1}]},'JHN',1),true,'a video with an explicit cue for the current passage remains selectable');
  const coveredPlaylist={mediaType:'playlist',chapterMatch:false,verseCues:[]},verifiedCoverage={status:'PARTIAL_COVERAGE',videoIds:['abcdefghijk'],verseCues:[{bookId:'JHN',chapter:1,playlistIndex:0,videoId:'abcdefghijk'}]};
  assert.equal(youtubeAudioItemMatchesPassage(coveredPlaylist,'JHN',1,null),false,'unverified playlists are not shown for a passage');
  assert.equal(youtubeAudioItemMatchesPassage(coveredPlaylist,'JHN',1,verifiedCoverage),true,'verified playlist coverage exposes the exact current chapter');
  assert.equal(youtubeAudioItemMatchesPassage(coveredPlaylist,'MAT',1,verifiedCoverage),false,'a playlist without the selected passage is not shown');
  assert.equal(youtubeAudioItemMatchesPassage(coveredPlaylist,'JHN',1,{...verifiedCoverage,status:'SCAN_INCOMPLETE'}),false,'incomplete playlist scans cannot qualify as passage audio');
  assert.match(readerHtml,/const found=results\.filter\(items=>items\.length\)\.length/,'edition status counts only passage-relevant visible results');
  assert.match(readerHtml,/id:"youtube-live-"\+\(item\.playlistId\|\|item\.videoId\)/,'the reader gives playlist and video results distinct source IDs');
  assert.match(readerHtml,/mediaType:item\.mediaType==="playlist"\?"playlist":"video"/,'the reader keeps each result media type when saving');
  assert.match(readerHtml,/\/youtube\/playlist-coverage/,'the reader verifies one playlist candidate per edition before labeling its coverage');
  assert.match(readerHtml,/verseCues:audioSource\?\.verseCues\|\|\(item\.mediaType==="playlist"\?\[\]:item\.verseCues\|\|\[\]\)/,'playlist cues come only from verified per-video descriptions, never the playlist description');
  assert.match(readerHtml,/coverageStatus:audioSource\?\.status\|\|"UNVERIFIED"/,'unverified playlist candidates remain explicitly unverified');
  const currentVideoIdLine=readerHtml.split('\n').find(line=>line.startsWith('function youtubeAudioVideoId(value){'));
  assert.ok(currentVideoIdLine,'the reader has a dedicated current-video ID parser');
  const youtubeAudioVideoId=new Function('safeQtUrl',`${currentVideoIdLine};return youtubeAudioVideoId;`)(value=>value);
  assert.equal(youtubeAudioVideoId('https://www.youtube.com/watch?v=abcdefghijk&list=PL1234567890'),'abcdefghijk','playlist playback follows the current video ID, not the playlist ID');
  assert.equal(youtubeAudioVideoId('https://youtu.be/abcdefghijk?t=5'),'abcdefghijk');
  assert.equal(youtubeAudioVideoId('https://www.youtube.com/playlist?list=PL1234567890'),'');
  assert.equal((readerHtml.match(/youtubeAudioVideoId\(player\.getVideoUrl\(\)\)/g)||[]).length,2,'automatic verse following and manual cue marking use the current playlist video');
  let koreanApiCalls=0,videoNumber=0;
  globalThis.fetch=async()=>{
    koreanApiCalls++;
    const make=(title,channelTitle='Test')=>({id:{videoId:`v${String(videoNumber++).padStart(10,'0')}`},snippet:{title,description:'',channelTitle}});
    return koreanApiCalls===1
      ? Response.json({items:editionList('ko').filter(edition=>edition.id!=='KCB').flatMap(edition=>Array.from({length:5},()=>make(`${edition.name} 마태복음 1장 오디오`)))})
      : Response.json({items:[make('공동번역 마태복음 전체듣기'),make('개역개정 마태복음 전체듣기','공동번역 낭독 채널')]});
  };
  const korean=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const koreanData=await korean.json(),kcb=koreanData.editions.find(group=>group.id==='KCB');
  assert.equal(koreanData.editions.find(group=>group.id==='EASY').items.length,5,'Easy Bible is an additional Korean audio-edition choice');
  assert.equal(koreanApiCalls,2,'one targeted fallback runs when an edition is absent');
  assert.equal(kcb.items.length,1,'metadata identifying a different configured edition is excluded from the missing edition');
  assert.equal(kcb.items[0].title,'공동번역 마태복음 전체듣기');
  globalThis.fetch=async(url,options)=>{captured={url:String(url),options};return Response.json({items:[
    {id:{videoId:'abcdefghijk'},snippet:{title:'NIV Matthew Chapter 1 Audio Bible',description:'00:00 Verse 1\n00:17 Verse 2',channelTitle:'Audio channel'}},
    {id:{videoId:'lmnopqrstuv'},snippet:{title:'KJV Matthew 1 reading',description:'00:05 Chapter 1',channelTitle:'Another channel'}},
    {id:{videoId:'xyzabcdefgh'},snippet:{title:'Best Bible reading',description:'00:00 Verse 1',channelTitle:'Unrelated title'}},
  ]})};
  const invalid=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:29})}),{YOUTUBE_DATA_API_KEY:'unused'});
  assert.equal(invalid.status,400);

  let markedQuotaExhausted=false;
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{errors:[{reason:'quotaExceeded'}]}}),{status:429});
  const upstreamLimited=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{if(exhausted)markedQuotaExhausted=true;return null;});
  assert.equal(upstreamLimited.status,429);
  assert.equal(markedQuotaExhausted,true,'an upstream daily limit blocks later Worker searches');
  markedQuotaExhausted=false;
  globalThis.fetch=async()=>Response.json({error:{errors:[{reason:'quotaExceeded'}]}},{status:403});
  const quota403=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{if(exhausted)markedQuotaExhausted=true;return null;});
  assert.equal(quota403.status,429,'YouTube quotaExceeded is returned as a daily-search limit');
  assert.equal(markedQuotaExhausted,true,'an upstream quotaExceeded 403 blocks later Worker searches');
  markedQuotaExhausted=false;
  globalThis.fetch=async()=>Response.json({error:{errors:[{reason:'dailyLimitExceeded'}]}},{status:403});
  const dailyLimit403=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{if(exhausted)markedQuotaExhausted=true;return null;});
  assert.equal(dailyLimit403.status,429,'an upstream dailyLimitExceeded is returned as a daily-search limit');
  assert.equal(markedQuotaExhausted,true,'an upstream dailyLimitExceeded blocks later Worker searches');
  markedQuotaExhausted=false;
  globalThis.fetch=async()=>Response.json({error:{errors:[{reason:'forbidden'}]}},{status:403});
  const forbidden=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{if(exhausted)markedQuotaExhausted=true;return null;});
  assert.equal(forbidden.status,502,'an unrelated forbidden 403 remains a generic upstream error');
  assert.equal(markedQuotaExhausted,false,'an unrelated forbidden 403 does not lock the daily quota');

  const quotaRequest=(kind,mode,exhausted=false)=>new Request('https://room/internal/youtube-search-quota',{method:'POST',headers:{'Content-Type':'application/json',...(exhausted?{'x-youtube-quota-exhausted':'1'}:{})},body:JSON.stringify({kind,mode})});
  const values=new Map(),room=new TogetherRoom({storage:{get:key=>values.get(key),put:(key,value)=>values.set(key,value)}});
  assert.equal(YOUTUBE_QUOTA_LIMITS.search.interactive+YOUTUBE_QUOTA_LIMITS.search.scheduled,100,'search reservations never exceed the separate 100-call daily bucket');
  for(let count=0;count<YOUTUBE_QUOTA_LIMITS.search.interactive;count++) assert.equal((await room.fetch(quotaRequest('search','interactive'))).status,200);
  assert.equal((await room.fetch(quotaRequest('search','interactive'))).status,429,'interactive searches preserve the scheduled search reserve');
  for(let count=0;count<YOUTUBE_QUOTA_LIMITS.search.scheduled;count++) assert.equal((await room.fetch(quotaRequest('search','scheduled'))).status,200);
  assert.equal((await room.fetch(quotaRequest('search','scheduled'))).status,429,'scheduled search reservations stop at their configured daily ceiling');
  for(let count=0;count<YOUTUBE_QUOTA_LIMITS.coverage.interactive;count++) assert.equal((await room.fetch(quotaRequest('coverage','interactive'))).status,200);
  assert.equal((await room.fetch(quotaRequest('coverage','interactive'))).status,429,'interactive playlist verification is bounded');
  for(let count=0;count<YOUTUBE_QUOTA_LIMITS.coverage.scheduled;count++) assert.equal((await room.fetch(quotaRequest('coverage','scheduled'))).status,200);
  assert.equal((await room.fetch(quotaRequest('coverage','scheduled'))).status,429,'scheduled catalog discovery can verify up to 60 candidates per Pacific day');
  const savedQuota=values.get('youtube-search-quota');
  assert.equal(savedQuota.interactiveCoverageCount+savedQuota.scheduledCoverageCount,180);
  assert.ok((savedQuota.interactiveCoverageCount+savedQuota.scheduledCoverageCount)*49<=10000,'worst-case playlist scans stay below the default non-search 10,000-unit daily bucket');
  assert.equal(savedQuota.interactiveCoverageCount*49+savedQuota.scheduledCoverageCount*49,8820,'schedule receives 60 scans while preserving 1,180 non-search units of headroom');
  const blockedValues=new Map(),blockedRoom=new TogetherRoom({storage:{get:key=>blockedValues.get(key),put:(key,value)=>blockedValues.set(key,value)}});
  assert.equal((await blockedRoom.fetch(quotaRequest('coverage','scheduled',true))).status,200);
  assert.equal((await blockedRoom.fetch(quotaRequest('coverage','scheduled'))).status,429,'upstream coverage quota exhaustion blocks coverage until reset');
  assert.equal((await blockedRoom.fetch(quotaRequest('search','interactive'))).status,200,'an exhausted coverage bucket does not block the separate search bucket');

  let apiCalls=0;
  globalThis.fetch=async()=>{apiCalls++;return Response.json({items:[]})};
  const routeValues=new Map(),namespace={idFromName:id=>id,get:id=>({fetch:request=>new TogetherRoom({storage:{get:key=>routeValues.get(id+key),put:(key,value)=>routeValues.set(id+key,value)}}).fetch(request)})};
  const env={ROOMS:namespace,YOUTUBE_DATA_API_KEY:'route-key',YOUTUBE_SEARCH_LIMITER:{limit:async()=>({success:true})}};
  const route=await worker.fetch(new Request('https://worker.test/youtube/search',{method:'POST',headers:{Origin:'https://delight0517.github.io','Content-Type':'application/json'},body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),env);
  assert.equal(route.status,200);
  assert.equal((await route.json()).editions.length,editionList('ko').length);
  const denied=await worker.fetch(new Request('https://worker.test/youtube/search',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),env);
  assert.equal(denied.status,403,'origin allowlist applies to the search endpoint');
  assert.equal(apiCalls,2,'one initial and one missing-edition fallback request run; rejected origins consume neither');

  globalThis.fetch=async raw=>{apiCalls++;assert.ok(String(raw).includes('/playlists?'));return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'KJV Bible Audio',channelTitle:'KJV'},contentDetails:{itemCount:1201}}]})};
  const coverageRoute=await worker.fetch(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',headers:{Origin:'https://delight0517.github.io','Content-Type':'application/json'},body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),env);
  assert.equal(coverageRoute.status,200);
  assert.equal((await coverageRoute.json()).status,'SCAN_LIMIT');
  assert.equal(apiCalls,3,'playlist quota is reserved once before a playlist metadata call');

  const books='GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
  const chapterCounts=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
  const tracks=[];let position=0;
  for(let book=0;book<books.length;book++)for(let chapter=1;chapter<=chapterCounts[book];chapter++){
    const videoId=`v${String(position).padStart(10,'0')}`;
    tracks.push({videoId,title:`${audioBookNames.locales.en.books[books[book]][0]} Chapter ${chapter} Audio Bible`});position++;
  }
  let verificationCalls=0;
  globalThis.fetch=async raw=>{
    verificationCalls++;const url=new URL(String(raw));
    if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'KJV King James Version full audio Bible',description:'',channelTitle:'KJV Audio'},contentDetails:{itemCount:tracks.length}}]});
    if(url.pathname.endsWith('/playlistItems')){
      const start=Number(url.searchParams.get('pageToken')||0),page=tracks.slice(start,start+50);
      return Response.json({items:page.map((track,index)=>({snippet:{title:track.title,position:start+index,resourceId:{videoId:track.videoId}}})),...(start+50<tracks.length?{nextPageToken:String(start+50)}:{})});
    }
    if(url.pathname.endsWith('/videos'))return Response.json({items:url.searchParams.get('id').split(',').map(id=>({id,snippet:{description:id==='v0000000000'?'00:20 Verse 2':'00:00 Verse 1\n00:20 Verse 2'}}))});
    throw Error(`Unexpected YouTube API path: ${url.pathname}`);
  };
  const coverage=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const coverageData=await coverage.json();
  assert.equal(coverage.status,200);
  assert.equal(coverageData.status,'COMPLETE_CHAPTER_COVERAGE',`all 1,189 explicit book/chapter tracks are required for a complete status (${coverageData.coveredChapters} found; ${coverageData.missingChapters?.slice(0,5).map(ref=>ref.bookId+':'+ref.chapter).join(',')})`);
  assert.equal(coverageData.coveredChapters,1189);
  assert.equal(coverageData.missingChapters.length,0);
  assert.equal(coverageData.videoIds.length,1189);
  assert.equal(coverageData.chapterSync,true,'chapter cues remain available across the complete playlist');
  assert.equal(coverageData.verseCues.length,2378,'explicit verse timestamps from every covered chapter are retained');
  assert.equal(coverageData.verseCues.find(cue=>cue.bookId==='MAT'&&cue.chapter===1).playlistIndex,929);
  assert.equal(coverageData.verseCues.find(cue=>cue.verse===2).seconds,20);
  assert.equal(coverageData.verseCues.find(cue=>cue.bookId==='GEN'&&cue.chapter===1&&cue.verse===2).playlistIndex,0,'verse cues from chapters outside the requested Matthew chapter remain available for playback');
  assert.equal(coverageData.verseCues.find(cue=>cue.bookId==='GEN'&&cue.chapter===1&&cue.verse===1).seconds,0,'a missing verse-one marker keeps the verified chapter-start cue before later verse markers');
  assert.equal(coverageData.verseCues.find(cue=>cue.bookId==='REV'&&cue.chapter===22&&cue.verse===2).playlistIndex,1188,'the final Bible chapter retains its verse cue');
  assert.ok(JSON.stringify(coverageData).length<1_900_000,'all explicit test cues fit the existing Durable Object edition-value limit');
  assert.equal(verificationCalls,49,'full coverage uses 1 metadata call, 24 item pages and 24 50-video batches, below the 50 external-subrequest limit');
  globalThis.fetch=async raw=>{
    const url=new URL(String(raw));
    if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'KJV King James Version audio Bible',channelTitle:'KJV'},contentDetails:{itemCount:1}}]});
    if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'Matthew 23:1–12 Audio Bible',position:0,resourceId:{videoId:'rangevideo1'}}}]});
    if(url.pathname.endsWith('/videos'))return Response.json({items:[{id:'rangevideo1',snippet:{description:'00:10 Matthew 23:1–12'}}]});
    throw Error(`Unexpected YouTube API path: ${url.pathname}`);
  };
  const verseRangeCoverage=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const verseRangeData=await verseRangeCoverage.json();
  assert.equal(verseRangeData.coveredChapters,1,'chapter coverage ignores the verse endpoints in a range');
  assert.equal(verseRangeData.verseCues[0].chapter,23,'the chapter cue points to Matthew 23');
  assert.ok(verseRangeData.missingChapters.some(ref=>ref.bookId==='MAT'&&ref.chapter===1),'a verse numbered 1 cannot falsely cover Matthew chapter 1');
  const quotaReservations=[];
  globalThis.fetch=async()=>Response.json({error:{errors:[{reason:'quotaExceeded'}]}},{status:403});
  const upstreamCoverageQuota=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{quotaReservations.push(!!exhausted);return null;});
  assert.equal(upstreamCoverageQuota.status,429,'upstream quotaExceeded stops playlist verification');
  assert.deepEqual(quotaReservations,[false,true],'coverage reserves before calling YouTube and marks exhaustion after the provider limit response');
  let blockedCoverageCalls=0;
  globalThis.fetch=async()=>{blockedCoverageCalls++;throw Error('quota-closed request must not reach YouTube')};
  const blockedCoverage=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async()=>Response.json({error:'daily_playlist_coverage_limit'},{status:429}));
  assert.equal(blockedCoverage.status,429);
  assert.equal(blockedCoverageCalls,0,'an exhausted local coverage budget prevents the upstream API call');
  const bookTracks=books.map((book,index)=>({videoId:`book${String(index).padStart(7,'0')}`,book,chapters:chapterCounts[index],title:`${audioBookNames.locales.en.books[book][0]} Audio Bible NIV`}));
  globalThis.fetch=async raw=>{
    const url=new URL(String(raw));
    if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'NIV Audio Bible',description:'',channelTitle:'NIV'},contentDetails:{itemCount:bookTracks.length}}]});
    if(url.pathname.endsWith('/playlistItems')){
      const start=Number(url.searchParams.get('pageToken')||0),page=bookTracks.slice(start,start+50);
      return Response.json({items:page.map((track,index)=>({snippet:{title:track.title,position:start+index,resourceId:{videoId:track.videoId}}})),...(start+50<bookTracks.length?{nextPageToken:String(start+50)}:{})});
    }
    if(url.pathname.endsWith('/videos'))return Response.json({items:url.searchParams.get('id').split(',').map(id=>{
      const track=bookTracks.find(item=>item.videoId===id);
      return {id,snippet:{description:Array.from({length:track.chapters},(_,index)=>`${String(Math.floor(index/2)).padStart(2,'0')}:${index%2?'30':'00'} Chapter ${index+1}`).join('\n')}};
    })});
    throw Error(`Unexpected YouTube API path: ${url.pathname}`);
  };
  const bookCoverage=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'NIV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const bookCoverageData=await bookCoverage.json();
  assert.equal(bookCoverageData.status,'COMPLETE_CHAPTER_COVERAGE','timestamped one-video-per-book playlists cover all chapters');
  assert.equal(bookCoverageData.videoIds.length,66);
  assert.equal(bookCoverageData.coveredChapters,1189);
  assert.equal(bookCoverageData.verseCues.find(cue=>cue.bookId==='MAT'&&cue.chapter===1).playlistIndex,39);
  assert.equal(bookCoverageData.verseCues.find(cue=>cue.bookId==='MAT'&&cue.chapter===2).seconds,30);
  globalThis.fetch=async raw=>{
    const url=new URL(String(raw));
    if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'NIV Audio Bible',description:'',channelTitle:'NIV'},contentDetails:{itemCount:1}}]});
    if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'NIV Matthew 1-28 Audio Bible',position:0,resourceId:{videoId:'rangvideo01'}}}]});
    if(url.pathname.endsWith('/videos'))return Response.json({items:[{id:'rangvideo01',snippet:{description:Array.from({length:28},(_,index)=>`${String(index).padStart(2,'0')}:00 Chapter ${index+1}`).join('\n')}}]});
    throw Error(`Unexpected YouTube API path: ${url.pathname}`);
  };
  const rangedBookCoverage=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'NIV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const rangedBookData=await rangedBookCoverage.json();
  assert.equal(rangedBookData.coveredChapters,28,'a video titled for Matthew 1-28 can align all chapter timestamps in its description');
  assert.equal(rangedBookData.verseCues.find(cue=>cue.bookId==='MAT'&&cue.chapter===14).seconds,13*60,'chapter starts use timestamps from the matching video description');
  globalThis.fetch=async raw=>{
    const url=new URL(String(raw));
    if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'새번역 오디오 성경',description:'',channelTitle:'새번역'},contentDetails:{itemCount:1}}]});
    if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'새번역 마태복음서 1장~28장 오디오 성경',position:0,resourceId:{videoId:'kobookvid01'}}}]});
    if(url.pathname.endsWith('/videos'))return Response.json({items:[{id:'kobookvid01',snippet:{description:Array.from({length:28},(_,index)=>`${String(index).padStart(2,'0')}:00 ${index+1}장`).join('\n')}}]});
    throw Error(`Unexpected YouTube API path: ${url.pathname}`);
  };
  const koreanRangedBook=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'ko',editionId:'KSB',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const koreanRangedData=await koreanRangedBook.json();
  assert.equal(koreanRangedData.coveredChapters,28,'Korean 새번역 video title ranges also parse every description chapter start');
  globalThis.fetch=async raw=>new URL(String(raw)).pathname.endsWith('/playlists')?Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'NIV Audio Bible',description:'',channelTitle:'NIV'},contentDetails:{itemCount:0}}]}):Response.json({items:[]});
  const mismatched=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  assert.equal(mismatched.status,422,'a playlist labeled as another translation cannot count for the requested edition');
  globalThis.fetch=async raw=>{const url=new URL(String(raw));if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'Bible Audio Playlist',description:'',channelTitle:'Independent Audio'},contentDetails:{itemCount:1}}]});if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'Matthew Chapter 1 Audio Bible KJV',position:0,resourceId:{videoId:'matvideo001'}}}]});if(url.pathname.endsWith('/videos'))return Response.json({items:[{id:'matvideo001',snippet:{description:'00:00 Chapter 1'}}]});throw Error(`Unexpected YouTube API path: ${url.pathname}`)};
  const neutralMetadata=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const neutralMetadataData=await neutralMetadata.json();
  assert.equal(neutralMetadata.status,200,'generic playlist metadata may be supplemented by per-video edition evidence');
  assert.equal(neutralMetadataData.coveredChapters,1);
  assert.deepEqual(neutralMetadataData.videoIds,['matvideo001']);
  globalThis.fetch=async raw=>{const url=new URL(String(raw));if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'Bible Audio Playlist',description:'',channelTitle:'Independent Audio'},contentDetails:{itemCount:1}}]});if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'Matthew Chapter 1 Audio Bible NIV',position:0,resourceId:{videoId:'matvideo001'}}}]});if(url.pathname.endsWith('/videos'))return Response.json({items:[{id:'matvideo001',snippet:{description:'00:00 Chapter 1'}}]});throw Error(`Unexpected YouTube API path: ${url.pathname}`)};
  const conflictingTrack=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  assert.equal(conflictingTrack.status,422,'an edition-conflicting track cannot count just because playlist metadata is generic');
  globalThis.fetch=async raw=>{const url=new URL(String(raw));if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'NIV and KJV Bible Audio',description:'',channelTitle:'Mixed Editions'},contentDetails:{itemCount:2}}]});if(url.pathname.endsWith('/playlistItems'))return Response.json({items:[{snippet:{title:'Matthew Chapter 1 Audio Bible KJV',position:0,resourceId:{videoId:'matvideo001'}}},{snippet:{title:'Matthew Chapter 1 Audio Bible NIV',position:1,resourceId:{videoId:'matvideo002'}}}]});if(url.pathname.endsWith('/videos'))return Response.json({items:url.searchParams.get('id').split(',').map(id=>({id,snippet:{description:'00:00 Chapter 1'}}))});throw Error(`Unexpected YouTube API path: ${url.pathname}`)};
  const mixedPlaylist=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const mixedPlaylistData=await mixedPlaylist.json();
  assert.equal(mixedPlaylist.status,200,'an ambiguous playlist may contribute only tracks with explicit requested-edition proof');
  assert.deepEqual(mixedPlaylistData.videoIds,['matvideo001']);
  globalThis.fetch=async raw=>{const url=new URL(String(raw));if(url.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PL12345678901234567890',snippet:{title:'KJV King James Version full audio Bible',description:'',channelTitle:'KJV Audio'},contentDetails:{itemCount:tracks.length}}]});if(url.pathname.endsWith('/playlistItems')){const start=Number(url.searchParams.get('pageToken')||0),page=tracks.slice(start,start+50);return Response.json({items:page.map((track,index)=>({snippet:{title:track.title,position:start+index,resourceId:{videoId:track.videoId}}})),...(start+50<tracks.length?{nextPageToken:String(start+50)}:{})})}if(url.pathname.endsWith('/videos'))return Response.json({items:url.searchParams.get('id').split(',').filter(id=>id!==tracks[0].videoId).map(id=>({id,snippet:{description:''}}))});throw Error(`Unexpected YouTube API path: ${url.pathname}`)};
  const partial=await verifyYouTubePlaylistCoverage(new Request('https://worker.test/youtube/playlist-coverage',{method:'POST',body:JSON.stringify({locale:'en',editionId:'KJV',playlistId:'PL12345678901234567890',bookId:'MAT',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
  const partialData=await partial.json();
  assert.equal(partialData.status,'PARTIAL_COVERAGE','unavailable video metadata cannot count as a complete chapter');
  assert.equal(partialData.coveredChapters,1188);
  assert.equal(partialData.verseCues.find(cue=>cue.bookId==='MAT'&&cue.chapter===1).playlistIndex,928,'playlist positions are compacted when unavailable entries are skipped');
} finally { globalThis.fetch=originalFetch; }
console.log('YouTube Worker search contract passed.');
