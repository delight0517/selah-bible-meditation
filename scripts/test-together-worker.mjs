import assert from 'node:assert/strict';
import worker,{TogetherRoom,passage,timer} from '../together-worker/src/index.js';
class MemoryStorage {
  data=new Map();
  async get(k){return structuredClone(this.data.get(k));}
  async put(k,v){this.data.set(k,structuredClone(v));}
  async setAlarm(v){this.alarm=v;}
  async deleteAll(){this.data.clear();}
}
const rooms=new Map();
const env={ROOMS:{idFromName:id=>id,get(id){if(!rooms.has(id))rooms.set(id,new TogetherRoom({storage:new MemoryStorage()}));return rooms.get(id);}}};
async function call(path,method='GET',data,token,origin='https://delight0517.github.io') {
  const headers={Origin:origin}; if(data)headers['Content-Type']='application/json'; if(token)headers.Authorization=`Bearer ${token}`;
  const response=await worker.fetch(new Request(`https://test${path}`,{method,headers,...(data?{body:JSON.stringify(data)}:{})}),env);
  return {status:response.status,data:await response.json()};
}
const selection={book:'MAT',chapter:1,translation:'kor_old',language:'ko'};
assert.throws(()=>passage({...selection,chapter:29}));
assert.throws(()=>passage({...selection,book:'junk'}));
assert.throws(()=>timer({durationMs:Infinity},0));
const created=await call('/rooms','POST',{passage:selection,timer:{durationMs:60000}});
assert.equal(created.status,201);
const {roomId,hostToken}=created.data,route=`/rooms/${roomId}`,a='a'.repeat(32),b='b'.repeat(32);
assert.match(roomId,/^[a-f0-9]{32}$/);assert.match(hostToken,/^[a-f0-9]{64}$/);
assert.equal(created.data.timer.endsAt-created.data.timer.startedAt,60000);
assert.equal((await call(`${route}?participantId=${a}`)).status,403);
assert.equal((await call(`${route}/join`,'POST',{participantId:a})).status,200);
assert.equal((await call(`${route}/join`,'POST',{participantId:b})).status,200);
let result=await call(`${route}/presence`,'POST',{participantId:b,verse:12,progress:.7,active:true});
assert.equal(result.data.participants.find(p=>p.participantId===b).verse,12);
assert.equal(result.data.hostToken,undefined);
assert.equal((await call(route,'PATCH',{timer:{durationMs:120000}})).status,403);
result=await call(route,'PATCH',{passage:{...selection,chapter:2},timer:{durationMs:120000}},hostToken);
assert.equal(result.data.passage.chapter,2);assert.equal(result.data.timer.endsAt-result.data.timer.startedAt,120000);
assert.equal((await call(`${route}/presence`,'POST',{participantId:b,verse:0,progress:.5,active:true})).status,400);
assert.equal((await call(`${route}/presence`,'POST',{participantId:b,verse:2,progress:2,active:true})).status,400);
const instance=rooms.get(roomId),stored=await instance.ctx.storage.get('participants');
stored[b].lastSeen=Date.now()-16000;await instance.ctx.storage.put('participants',stored);
assert.equal((await call(`${route}?participantId=${a}`)).data.participants.some(p=>p.participantId===b),false);
assert.equal((await call('/rooms','POST',{passage:selection},null,'https://evil.example')).status,403);
await call(`${route}/leave`,'POST',{participantId:a});
assert.equal((await call(`${route}?participantId=${a}`)).status,403);
const room=await instance.ctx.storage.get('room');room.expiresAt=Date.now()-1;await instance.ctx.storage.put('room',room);
assert.equal((await call(`${route}/join`,'POST',{participantId:a})).status,410);
await instance.alarm();assert.equal(instance.ctx.storage.data.size,0);
const full=await call('/rooms','POST',{passage:selection});
for(let i=0;i<8;i++)assert.equal((await call(`/rooms/${full.data.roomId}/join`,'POST',{participantId:i.toString(16).padStart(32,'0')})).status,200);
assert.equal((await call(`/rooms/${full.data.roomId}/join`,'POST',{participantId:'f'.repeat(32)})).status,409);
console.log('Together Worker: validation, room capability, host control, timer, presence, expiry, CORS and capacity passed.');
