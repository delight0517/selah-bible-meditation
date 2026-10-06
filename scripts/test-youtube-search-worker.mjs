import assert from 'node:assert/strict';
import worker, { TogetherRoom } from '../together-worker/src/index.js';
import { editionList, searchYouTube } from '../together-worker/src/youtube-search.js';

for (const locale of ['en','ko','ja','zh-CN','zh-TW','fil','es','pt-BR','ru','uk']) assert.equal(editionList(locale).length,5,`${locale} edition choices`);
assert.equal(editionList('xx').length,0);

const originalFetch=globalThis.fetch;
let captured;
globalThis.fetch=async (url,options)=>{
  captured={url:String(url),options};
  return Response.json({items:[
    {id:{videoId:'abcdefghijk'},snippet:{title:'NIV Matthew Chapter 1 Audio Bible',description:'00:00 Verse 1\n00:17 Verse 2',channelTitle:'Audio channel'}},
    {id:{videoId:'lmnopqrstuv'},snippet:{title:'KJV Matthew 1 reading',description:'00:05 Chapter 1',channelTitle:'Another channel'}},
    {id:{videoId:'xyzabcdefgh'},snippet:{title:'Best Bible reading',description:'00:00 Verse 1',channelTitle:'Unrelated title'}},
  ]});
};
try {
  const result=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'never-return-this-key'});
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.editions.length,5);
  const niv=data.editions.find(item=>item.id==='NIV'),kjv=data.editions.find(item=>item.id==='KJV');
  assert.equal(niv.items[0].verseCues[1].verse,2);
  assert.equal(niv.items[0].cueKind,'verse');
  assert.equal(kjv.items[0].verseCues[0].seconds,5,'explicit chapter timestamp provides a chapter-start cue');
  assert.equal(kjv.items[0].cueKind,'chapter');
  assert.equal(data.editions.every(group=>group.items.every(item=>item.videoId!=='xyzabcdefgh')),true,'unclassified video does not claim a translation');
  const query=new URL(captured.url).searchParams;
  assert.equal(query.get('maxResults'),'50');
  assert.equal(query.get('q').includes('|'),true,'all five editions share one OR search');
  assert.equal(captured.options.headers['x-goog-api-key'],'never-return-this-key');
  assert.equal(captured.url.includes('never-return-this-key'),false);
  assert.equal(JSON.stringify(data).includes('never-return-this-key'),false);
  for (const locale of ['en','ko','ja','zh-CN','zh-TW','fil','es','pt-BR','ru','uk']) {
    globalThis.fetch=async()=>Response.json({items:editionList(locale).map((edition,index)=>({id:{videoId:`id${locale}${index}`.replace(/[^\w-]/g,'').slice(0,11).padEnd(11,'x')},snippet:{title:`${edition.name} Matthew 1 audio`,description:'',channelTitle:'Test'}}))});
    const localized=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale,bookId:'MAT',bookName:'Matthew',chapter:1})}),{YOUTUBE_DATA_API_KEY:'test'});
    const localizedData=await localized.json();
    assert.equal(localizedData.editions.length,5,`${locale} returns five categorized groups`);
    assert.equal(localizedData.editions.filter(group=>group.items.length===1).length,5,`${locale} classifies every configured edition`);
  }
  globalThis.fetch=async(url,options)=>{captured={url:String(url),options};return Response.json({items:[
    {id:{videoId:'abcdefghijk'},snippet:{title:'NIV Matthew Chapter 1 Audio Bible',description:'00:00 Verse 1\n00:17 Verse 2',channelTitle:'Audio channel'}},
    {id:{videoId:'lmnopqrstuv'},snippet:{title:'KJV Matthew 1 reading',description:'00:05 Chapter 1',channelTitle:'Another channel'}},
    {id:{videoId:'xyzabcdefgh'},snippet:{title:'Best Bible reading',description:'00:00 Verse 1',channelTitle:'Unrelated title'}},
  ]})};
  const invalid=await searchYouTube(new Request('https://worker.test/youtube/search',{method:'POST',body:JSON.stringify({locale:'en',bookId:'MAT',bookName:'Matthew',chapter:29})}),{YOUTUBE_DATA_API_KEY:'unused'});
  assert.equal(invalid.status,400);

  const values=new Map(),room=new TogetherRoom({storage:{get:key=>values.get(key),put:(key,value)=>values.set(key,value)}});
  for(let count=0;count<90;count++) assert.equal((await room.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST'}))).status,200);
  assert.equal((await room.fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST'}))).status,429,'daily quota fails closed at 90 searches');

  let apiCalls=0;
  globalThis.fetch=async()=>{apiCalls++;return Response.json({items:[]})};
  const routeValues=new Map(),namespace={idFromName:id=>id,get:id=>({fetch:request=>new TogetherRoom({storage:{get:key=>routeValues.get(id+key),put:(key,value)=>routeValues.set(id+key,value)}}).fetch(request)})};
  const env={ROOMS:namespace,YOUTUBE_DATA_API_KEY:'route-key',YOUTUBE_SEARCH_LIMITER:{limit:async()=>({success:true})}};
  const route=await worker.fetch(new Request('https://worker.test/youtube/search',{method:'POST',headers:{Origin:'https://delight0517.github.io','Content-Type':'application/json'},body:JSON.stringify({locale:'ko',bookId:'MAT',bookName:'마태복음',chapter:1})}),env);
  assert.equal(route.status,200);
  assert.equal((await route.json()).editions.length,5);
  const denied=await worker.fetch(new Request('https://worker.test/youtube/search',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),env);
  assert.equal(denied.status,403,'origin allowlist applies to the search endpoint');
  assert.equal(apiCalls,1,'the route makes one API call and rejects disallowed origins before quota use');
} finally { globalThis.fetch=originalFetch; }
console.log('YouTube Worker search contract passed.');
