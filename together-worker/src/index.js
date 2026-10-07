import { audioLanguageList, editionList, searchYouTube, verifyYouTubePlaylistCoverage } from './youtube-search.js';
import { discoverAudioCatalogLocale } from './youtube-audio-catalog.js';
const TTL = 86400000, ACTIVE = 15000;
// Search.list has a separate 100-call bucket. A full playlist scan costs at most 49 units: 1 playlist, 24 playlistItems, and 24 videos list calls. 180 scans reserve 8,820 of the 10,000 daily non-search units.
const YOUTUBE_QUOTA_LIMITS = { search: { interactive: 70, scheduled: 30 }, coverage: { interactive: 150, scheduled: 30 } };
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
async function reserveYouTubeQuota(env, kind, mode = 'interactive', upstreamLimit = false) {
  const quota = await env.ROOMS.get(env.ROOMS.idFromName('youtube-search-quota-v1')).fetch(new Request('https://room/internal/youtube-search-quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(upstreamLimit ? { 'x-youtube-quota-exhausted': '1' } : {}) },
    body: JSON.stringify({ kind, mode })
  }));
  const error = quota.status === 429 ? kind === 'search' ? 'daily_search_limit' : 'daily_playlist_coverage_limit' : 'quota_unavailable';
  return quota.ok ? null : json({ error }, quota.status);
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
        response=await searchYouTube(request,env,upstreamLimit=>reserveYouTubeQuota(env,'search','interactive',upstreamLimit));
      }
      else if(url.pathname==='/youtube/playlist-coverage' && request.method==='POST') {
        const limit=await env.YOUTUBE_SEARCH_LIMITER?.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
        if(env.YOUTUBE_SEARCH_LIMITER && !limit.success) fail(429,'rate_limited');
        response=await verifyYouTubePlaylistCoverage(request,env,upstreamLimit=>reserveYouTubeQuota(env,'coverage','interactive',upstreamLimit));
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
  reserveQuota = upstreamLimit => reserveYouTubeQuota(env,'search','scheduled',upstreamLimit),
  reserveCoverageQuota = upstreamLimit => reserveYouTubeQuota(env,'coverage','scheduled',upstreamLimit)
} = {}) {
  const store = audioCatalogStub(env), day = pacificDay(scheduledTime);
  const claimResponse = await store.fetch(new Request('https://room/internal/youtube-audio-catalog/claim', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day })
  }));
  const claim = await claimResponse.json().catch(() => null);
  if (!claimResponse.ok) throw new Error(claim?.error || 'catalog_claim_failed');
  if (!claim?.claimed) return { refreshed: false, reason: 'already_claimed_today' };

  const coverageImpl = (request, _env, reserveQuotaForCoverage) => verifyScheduledPlaylistCoverage(request, env, reserveQuotaForCoverage, store);
  const catalog = await discover({ locale: claim.locale, env, reserveQuota, reserveCoverageQuota, coverageImpl });
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

export async function verifyScheduledPlaylistCoverage(request, env, reserveQuota, store = audioCatalogStub(env)) {
  const quota = await reserveQuota?.();
  if (quota) return quota;
  const response = await store.fetch(new Request('https://room/internal/youtube-audio-coverage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-youtube-data-api-key': env.YOUTUBE_DATA_API_KEY },
    body: await request.text()
  }));
  const result = await response.clone().json().catch(() => null);
  if (response.status === 429 && result?.error === 'youtube_quota_unavailable') await reserveQuota?.(true);
  return response;
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
        const input=await request.json().catch(()=>null);
        if(!input||!['search','coverage'].includes(input.kind)||!['interactive','scheduled'].includes(input.mode))return json({error:'invalid_quota_request'},400);
        const saved=await this.ctx.storage.get('youtube-search-quota'),current=saved?.day===day?saved:{};
        const counts={
          interactiveSearchCount:Number(current.interactiveSearchCount??current.count)||0,
          scheduledSearchCount:Number(current.scheduledSearchCount)||0,
          interactiveCoverageCount:Number(current.interactiveCoverageCount)||0,
          scheduledCoverageCount:Number(current.scheduledCoverageCount)||0
        };
        const blocked={search:!!(current.searchBlocked||current.blocked),coverage:!!current.coverageBlocked};
        if(request.headers.get('x-youtube-quota-exhausted')==='1') {
          blocked[input.kind]=true;
          await this.ctx.storage.put('youtube-search-quota',{day,...counts,searchBlocked:blocked.search,coverageBlocked:blocked.coverage,count:counts.interactiveSearchCount+counts.scheduledSearchCount,blocked:blocked.search});
          return json({ok:true});
        }
        if(blocked[input.kind])return json({error:input.kind==='search'?'daily_search_limit':'daily_playlist_coverage_limit'},429);
        const key=`${input.mode}${input.kind==='search'?'Search':'Coverage'}Count`;
        const limit=YOUTUBE_QUOTA_LIMITS[input.kind][input.mode];
        if(counts[key]>=limit)return json({error:input.kind==='search'?'daily_search_limit':'daily_playlist_coverage_limit'},429);
        counts[key]++;
        await this.ctx.storage.put('youtube-search-quota',{day,...counts,searchBlocked:blocked.search,coverageBlocked:blocked.coverage,count:counts.interactiveSearchCount+counts.scheduledSearchCount,blocked:blocked.search});
        return json({ok:true});
      }
      if(url.pathname==='/internal/youtube-audio-coverage' && request.method==='POST') {
        const key=request.headers.get('x-youtube-data-api-key');
        if(!key)return json({error:'service_unavailable'},503);
        return verifyYouTubePlaylistCoverage(new Request('https://worker/youtube/playlist-coverage',{method:'POST',headers:{'Content-Type':'application/json'},body:await request.text()}),{YOUTUBE_DATA_API_KEY:key});
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
