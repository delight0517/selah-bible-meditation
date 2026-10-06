import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker, { TogetherRoom } from '../together-worker/src/index.js';
import { audioLanguageList, editionList, searchYouTube } from '../together-worker/src/youtube-search.js';

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
  assert.equal(niv.items.length,5);
  assert.equal(kjv.items.length,5);
  assert.equal(data.editions.find(item=>item.id==='NKJV').items[0].title,'New King James Version Matthew 1 audio','specific edition name wins over the KJV substring');
  assert.equal(niv.items[0].verseCues[1].verse,2);
  assert.equal(niv.items[0].cueKind,'verse');
  assert.equal(kjv.items[0].verseCues[0].seconds,5,'explicit chapter timestamp provides a chapter-start cue');
  assert.equal(kjv.items[0].cueKind,'chapter');
  assert.equal(data.editions.every(group=>group.items.every(item=>item.videoId!=='xyzabcdefgh')),true,'unclassified video does not claim a translation');
  const query=new URL(calls[0].url).searchParams,fallbackQuery=new URL(captured.url).searchParams;
  assert.equal(query.get('maxResults'),'50');
  assert.equal(query.get('type'),'video,playlist','edition searches include complete audio playlists and videos');
  assert.equal(query.has('videoEmbeddable'),false,'playlist discovery is not filtered out by a video-only parameter');
  assert.equal(query.get('q').includes('|'),true,'all five editions share one OR search');
  assert.equal(fallbackQuery.get('q').includes('New King James Version'),true,'fallback includes a missing edition');
  assert.equal(fallbackQuery.get('q').includes('New International Version'),false,'fallback omits editions already found');
  assert.equal(captured.options.headers['x-goog-api-key'],'never-return-this-key');
  assert.equal(captured.url.includes('never-return-this-key'),false);
  assert.equal(JSON.stringify(data).includes('never-return-this-key'),false);
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
  assert.match(readerHtml,/id:"youtube-live-"\+\(item\.playlistId\|\|item\.videoId\)/,'the reader gives playlist and video results distinct source IDs');
  assert.match(readerHtml,/mediaType:item\.mediaType==="playlist"\?"playlist":"video"/,'the reader keeps each result media type when saving');
  assert.match(readerHtml,/verseCues:item\.mediaType==="playlist"\?\[\]:item\.verseCues\|\|\[\]/,'the reader never treats playlist descriptions as video cues');
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
  globalThis.fetch=async()=>Response.json({error:{errors:[{reason:'forbidden'}]}},{status:403});
  const forbidden=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'},async exhausted=>{if(exhausted)markedQuotaExhausted=true;return null;});
  assert.equal(forbidden.status,502,'an unrelated forbidden 403 remains a generic upstream error');
  assert.equal(markedQuotaExhausted,false,'an unrelated forbidden 403 does not lock the daily quota');

  const values=new Map(),room=new TogetherRoom({storage:{get:key=>values.get(key),put:(key,value)=>values.set(key,value)}});
  for(let count=0;count<70;count++) assert.equal((await room.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST'}))).status,200);
  assert.equal((await room.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST'}))).status,429,'daily quota preserves headroom at 70 searches');
  const blockedValues=new Map(),blockedRoom=new TogetherRoom({storage:{get:key=>blockedValues.get(key),put:(key,value)=>blockedValues.set(key,value)}});
  assert.equal((await blockedRoom.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST',headers:{'x-youtube-quota-exhausted':'1'}}))).status,200);
  assert.equal((await blockedRoom.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST'}))).status,429,'upstream quota exhaustion blocks further API requests until reset');

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
} finally { globalThis.fetch=originalFetch; }
console.log('YouTube Worker search contract passed.');
