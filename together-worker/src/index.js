import { searchYouTube, verifyYouTubePlaylistCoverage } from './youtube-search.js';
const TTL = 86400000, ACTIVE = 15000;
const chapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const books = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
const origins = new Set(['https://delight0517.github.io', 'capacitor://localhost', 'http://localhost']);
const idOK = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const fail = (status, error) => { throw Object.assign(new Error(error), {status}); };
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const secret = size => Array.from(crypto.getRandomValues(new Uint8Array(size)),x=>x.toString(16).padStart(2,'0')).join('');
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
        response=await searchYouTube(request,env,async(upstreamLimit=false)=>{
          const quota=await env.ROOMS.get(env.ROOMS.idFromName('youtube-search-quota-v1')).fetch(new Request('https://room/internal/youtube-search-quota',{method:'POST',headers:upstreamLimit?{'x-youtube-quota-exhausted':'1'}:{}}));
          return quota.ok?null:json({error:quota.status===429?'daily_search_limit':'search_unavailable'},quota.status);
        });
      }
      else if(url.pathname==='/youtube/playlist-coverage' && request.method==='POST') {
        const limit=await env.YOUTUBE_SEARCH_LIMITER?.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
        if(env.YOUTUBE_SEARCH_LIMITER && !limit.success) fail(429,'rate_limited');
        response=await verifyYouTubePlaylistCoverage(request,env);
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
