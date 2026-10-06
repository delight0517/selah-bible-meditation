import { audioLanguageList, editionList, searchYouTube, verifyYouTubePlaylistCoverage } from './youtube-search.js';
import { discoverAudioCatalogLocale } from './youtube-audio-catalog.js';
const TTL = 86400000, ACTIVE = 15000;
const chapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const books = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
const origins = new Set(['https://delight0517.github.io', 'capacitor://localhost', 'http://localhost']);
const audioCatalogStore = 'youtube-audio-catalog-v1';
const audioLocales = audioLanguageList().map(({ code }) => code);
const idOK = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const fail = (status, error) => { throw Object.assign(new Error(error), {status}); };
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const secret = size => Array.from(crypto.getRandomValues(new Uint8Array(size)),x=>x.toString(16).padStart(2,'0')).join('');
const audioCatalogStub = env => env.ROOMS.get(env.ROOMS.idFromName(audioCatalogStore));
async function reserveYouTubeSearchQuota(env, upstreamLimit = false) {
  const quota = await env.ROOMS.get(env.ROOMS.idFromName('youtube-search-quota-v1')).fetch(new Request('https://room/internal/youtube-search-quota', {
    method: 'POST', headers: upstreamLimit ? { 'x-youtube-quota-exhausted': '1' } : {}
  }));
  return quota.ok ? null : json({ error: quota.status === 429 ? 'daily_search_limit' : 'search_unavailable' }, quota.status);
}
function pacificDay(timestamp) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(timestamp)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function passage(value) {
  const index=books.indexOf(value?.book);
  if(index<0 || !Number.isInteger(value.chapter) || value.chapter<1 || value.chapter>chapters[index] || typeof value.translation!=='string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value.translation)) fail(400,'invalid_passage');
  if(value.language!==undefined && !['ko','en','ja','zh-CN','zh-TW'].includes(value.language)) fail(400,'invalid_language');
  return {book:value.book,chapter:value.chapter,translation:value.translation,...(value.language?{language:value.language}:{})};
}
export function timer(value,now) {
  if(value===null || value===undefined) return null;
  if(!Number.isInteger(value.durationMs) || value.durationMs<1000 || value.durationMs>86400000) fail(400,'invalid_timer');
  return {durationMs:value.durationMs,startedAt:now,endsAt:now+value.durationMs};
}
async function body(request) {
  const raw=await request.text();
  if(raw.length>4096) fail(413,'payload_too_large');
  try { const parsed=JSON.parse(raw); if(!parsed || Array.isArray(parsed) || typeof parsed!=='object') fail(400,'invalid_json'); return parsed; } catch { fail(400,'invalid_json'); }
}
export default {
  async scheduled(controller,env) {
    if(controller.cron!=='20 8 * * *')return;
    try {
      return await refreshNextAudioCatalog(env,{scheduledTime:controller.scheduledTime});
    } catch(error) {
      console.error(`youtube_audio_catalog_refresh_failed:${error.message}`);
      throw error;
    }
  },
  async fetch(request,env) {
    const origin=request.headers.get('Origin');
    if(origin && !origins.has(origin)) return json({error:'origin_not_allowed'},403);
    let response;
    try {
      const url=new URL(request.url);
      if(request.method==='OPTIONS') response=new Response(null,{status:204});
      else if(url.pathname==='/youtube/search' && request.method==='POST') {
        const limit=await env.YOUTUBE_SEARCH_LIMITER?.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
        if(env.YOUTUBE_SEARCH_LIMITER && !limit.success) fail(429,'rate_limited');
        response=await searchYouTube(request,env,upstreamLimit=>reserveYouTubeSearchQuota(env,upstreamLimit));
      }
      else if(url.pathname==='/youtube/playlist-coverage' && request.method==='POST') {
        const limit=await env.YOUTUBE_SEARCH_LIMITER?.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
        if(env.YOUTUBE_SEARCH_LIMITER && !limit.success) fail(429,'rate_limited');
        response=await verifyYouTubePlaylistCoverage(request,env);
      } else if(url.pathname==='/youtube/audio-catalog' && request.method==='GET') {
        const locale=url.searchParams.get('locale');
        if(!audioLocales.includes(locale))fail(400,'invalid_locale');
        response=await audioCatalogStub(env).fetch(new Request(`https://room/internal/youtube-audio-catalog/get?locale=${encodeURIComponent(locale)}`));
      }
      else if(url.pathname==='/rooms' && request.method==='POST') {
        const input=await body(request),roomId=secret(16),hostToken=secret(32),now=Date.now();
        const room={roomId,hostToken,passage:passage(input.passage),timer:timer(input.timer,now),createdAt:now,expiresAt:now+TTL,revision:1};
        await env.ROOMS.get(env.ROOMS.idFromName(roomId)).fetch(new Request('https://room/internal/create',{method:'POST',body:JSON.stringify(room)}));
        response=json({roomId,hostToken,passage:room.passage,timer:room.timer,expiresAt:room.expiresAt,serverNow:now},201);
      } else {
        const match=url.pathname.match(/^\/rooms\/([a-f0-9]{32})(\/(join|presence|leave))?$/);
        if(!match) fail(404,'not_found');
        response=await env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
      }
    } catch(error) { response=json({error:error.status?error.message:'internal_error'},error.status||500); }
    const headers=new Headers(response.headers);
    if(origin) headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Vary','Origin');
    headers.set('Access-Control-Allow-Methods','GET, POST, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');
    return new Response(response.body,{status:response.status,headers});
  }
};

export async function refreshNextAudioCatalog(env, {
  scheduledTime = Date.now(),
  discover = discoverAudioCatalogLocale,
  reserveQuota = reserveYouTubeSearchQuota
} = {}) {
  const store = audioCatalogStub(env), day = pacificDay(scheduledTime);
  const claimResponse = await store.fetch(new Request('https://room/internal/youtube-audio-catalog/claim', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day })
  }));
  const claim = await claimResponse.json().catch(() => null);
  if (!claimResponse.ok) throw new Error(claim?.error || 'catalog_claim_failed');
  if (!claim?.claimed) return { refreshed: false, reason: 'already_claimed_today' };

  const catalog = await discover({ locale: claim.locale, env, reserveQuota });
  for (const edition of catalog.editions) {
    const saved = await store.fetch(new Request('https://room/internal/youtube-audio-catalog/save-edition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day, generation: claim.generation, locale: claim.locale, edition })
    }));
    if (!saved.ok) throw new Error('catalog_edition_store_failed');
  }
  const committed = await store.fetch(new Request('https://room/internal/youtube-audio-catalog/commit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, generation: claim.generation, locale: claim.locale, generatedAt: catalog.generatedAt, query: catalog.query, editionIds: catalog.editions.map(edition => edition.id) })
  }));
  const result = await committed.json().catch(() => null);
  if (!committed.ok) throw new Error(result?.error || 'catalog_commit_failed');
  return { refreshed: true, locale: claim.locale, generatedAt: catalog.generatedAt, editionCount: catalog.editions.length };
}

export class TogetherRoom {
  constructor(ctx) { this.ctx=ctx; }
  async alarm() { await this.ctx.storage.deleteAll(); }
  async fetch(request) {
    try {
      const url=new URL(request.url),now=Date.now();
      if(url.pathname==='/internal/create') {
        const room=await request.json();
        await this.ctx.storage.put('room',room);
        await this.ctx.storage.setAlarm(room.expiresAt);
        return json({ok:true});
      }
      if(url.pathname==='/internal/youtube-search-quota' && request.method==='POST') {
        const now=Date.now(),parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(part=>part.type!=='literal').map(part=>[part.type,part.value])),day=`${parts.year}-${parts.month}-${parts.day}`;
        const saved=await this.ctx.storage.get('youtube-search-quota'),count=saved?.day===day?Number(saved.count)||0:0;
        if(request.headers.get('x-youtube-quota-exhausted')==='1') { await this.ctx.storage.put('youtube-search-quota',{day,count,blocked:true}); return json({ok:true}); }
        if(saved?.day===day && saved.blocked || count>=70) return json({error:'daily_search_limit'},429);
        await this.ctx.storage.put('youtube-search-quota',{day,count:count+1,blocked:false});
        return json({ok:true});
      }
      if(url.pathname==='/internal/youtube-audio-catalog/claim' && request.method==='POST') {
        const input=await request.json().catch(()=>null);
        if(!input||!/^\d{4}-\d{2}-\d{2}$/.test(input.day||''))return json({error:'invalid_catalog_day'},400);
        const state=await this.ctx.storage.get('youtube-audio-catalog:state')||{nextIndex:0};
        if(state.lastClaimedDay===input.day)return json({claimed:false});
        if(state.pendingLocale&&state.pendingGeneration){
          for(const edition of editionList(state.pendingLocale))await this.ctx.storage.delete(`youtube-audio-catalog:${state.pendingLocale}:${state.pendingGeneration}:${edition.id}`);
        }
        const locale=audioLocales[state.nextIndex%audioLocales.length],generation=`${Date.now()}`;
        await this.ctx.storage.put('youtube-audio-catalog:state',{...state,lastClaimedDay:input.day,pendingLocale:locale,pendingGeneration:generation});
        return json({claimed:true,locale,generation});
      }
      if(url.pathname==='/internal/youtube-audio-catalog/save-edition' && request.method==='POST') {
        const input=await request.json().catch(()=>null),state=await this.ctx.storage.get('youtube-audio-catalog:state');
        if(!input||!audioLocales.includes(input.locale)||!editionList(input.locale).some(item=>item.id===input.edition?.id)||state?.pendingLocale!==input.locale||state?.lastClaimedDay!==input.day||state?.pendingGeneration!==input.generation)return json({error:'catalog_claim_required'},409);
        const key=`youtube-audio-catalog:${input.locale}:${input.generation}:${input.edition.id}`;
        const value=JSON.stringify(input.edition);
        if(value.length>1_900_000)return json({error:'catalog_edition_too_large'},413);
        await this.ctx.storage.put(key,input.edition);
        return json({ok:true});
      }
      if(url.pathname==='/internal/youtube-audio-catalog/commit' && request.method==='POST') {
        const input=await request.json().catch(()=>null),state=await this.ctx.storage.get('youtube-audio-catalog:state');
        if(!input||!audioLocales.includes(input.locale)||!Array.isArray(input.editionIds)||state?.pendingLocale!==input.locale||state?.lastClaimedDay!==input.day||state?.pendingGeneration!==input.generation)return json({error:'catalog_claim_required'},409);
        const expected=editionList(input.locale).map(item=>item.id);
        if(expected.length!==input.editionIds.length||expected.some(id=>!input.editionIds.includes(id)))return json({error:'incomplete_catalog'},400);
        for(const id of expected)if(!(await this.ctx.storage.get(`youtube-audio-catalog:${input.locale}:${input.generation}:${id}`)))return json({error:'catalog_edition_missing'},409);
        const metaKey=`youtube-audio-catalog:${input.locale}:meta`,previous=await this.ctx.storage.get(metaKey);
        await this.ctx.storage.put(metaKey,{schema:1,locale:input.locale,generatedAt:input.generatedAt,query:input.query,editionIds:expected,generation:input.generation});
        await this.ctx.storage.put('youtube-audio-catalog:state',{...state,nextIndex:(state.nextIndex+1)%audioLocales.length,pendingLocale:null,pendingGeneration:null});
        if(previous?.generation)for(const id of previous.editionIds||[])await this.ctx.storage.delete(`youtube-audio-catalog:${input.locale}:${previous.generation}:${id}`);
        return json({ok:true});
      }
      if(url.pathname==='/internal/youtube-audio-catalog/get' && request.method==='GET') {
        const locale=url.searchParams.get('locale');
        if(!audioLocales.includes(locale))return json({error:'invalid_locale'},400);
        const meta=await this.ctx.storage.get(`youtube-audio-catalog:${locale}:meta`);
        if(!meta)return json({error:'catalog_not_found'},404);
        const editions=await Promise.all(meta.editionIds.map(id=>this.ctx.storage.get(`youtube-audio-catalog:${locale}:${meta.generation}:${id}`)));
        if(editions.some(edition=>!edition))return json({error:'catalog_incomplete'},503);
        return json({schema:meta.schema,locale:meta.locale,generatedAt:meta.generatedAt,query:meta.query,editions});
      }
      const room=await this.ctx.storage.get('room');
      if(!room || room.expiresAt<=now) fail(410,'room_expired');
      let participants=await this.ctx.storage.get('participants')||{};
      const snapshot=()=>({roomId:room.roomId,passage:room.passage,timer:room.timer,revision:room.revision,expiresAt:room.expiresAt,participants:Object.values(participants).filter(p=>p.active&&now-p.lastSeen<=ACTIVE),serverNow:now});
      if(request.method==='PATCH' && !url.pathname.endsWith('/join')) {
        if(request.headers.get('Authorization')!==`Bearer ${room.hostToken}`) fail(403,'host_required');
        const input=await body(request);
        if(input.passage!==undefined) room.passage=passage(input.passage);
        if(input.timer!==undefined) room.timer=timer(input.timer,now);
        room.revision++;
        await this.ctx.storage.put('room',room);
        return json(snapshot());
      }
      const input=request.method==='POST'?await body(request):{},participantId=input.participantId||url.searchParams.get('participantId');
      if(!idOK(participantId)) fail(400,'invalid_participant');
      if(request.method==='POST' && url.pathname.endsWith('/join')) {
        if(!participants[participantId]) {
          participants=Object.fromEntries(Object.entries(participants).filter(([,p])=>now-p.lastSeen<=ACTIVE));
          if(Object.keys(participants).length>=8) fail(409,'room_full');
        }
        participants[participantId]={participantId,verse:1,progress:0,active:true,lastSeen:now};
      } else {
        if(!participants[participantId]) fail(403,'join_required');
        if(request.method==='POST' && url.pathname.endsWith('/presence')) {
          if(!Number.isInteger(input.verse)||input.verse<1||input.verse>176||typeof input.progress!=='number'||!Number.isFinite(input.progress)||input.progress<0||input.progress>1||typeof input.active!=='boolean') fail(400,'invalid_presence');
          participants[participantId]={participantId,verse:input.verse,progress:input.progress,active:input.active,lastSeen:now};
        } else if(request.method==='POST' && url.pathname.endsWith('/leave')) delete participants[participantId];
        else if(request.method!=='GET') fail(405,'method_not_allowed');
      }
      if(request.method==='POST') await this.ctx.storage.put('participants',participants);
      return json(snapshot());
    } catch(error) { return json({error:error.status?error.message:'internal_error'},error.status||500); }
  }
}
