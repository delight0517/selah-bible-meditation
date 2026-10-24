import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../assets/selah-camera-gestures.js',import.meta.url),'utf8');
const classifierSource = await readFile(new URL('../assets/selah-gesture-classifier.js',import.meta.url),'utf8');
const {GestureClassifier}=await import('data:text/javascript;base64,'+Buffer.from(classifierSource).toString('base64'));
function fixture() {
  const nodes=new Map(), events={}, requests=[], workers=[], timers=new Map();let timerId=0,visible=true;
  const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},hidden:false,clientHeight:400,getClientRects:()=>visible?[{}]:[],classList:{toggle(){}},setAttribute(){},addEventListener(){},pause(){},remove(){},play:async()=>{},readyState:2});return nodes.get(id);};
  const document={visibilityState:'visible',body:{append(){}},getElementById:node,querySelector:()=>node('reader'),createElement:()=>({...node('video')}),addEventListener:(n,f)=>events[n]=f};
  const window={addEventListener:(n,f)=>events[n]=f};
  const ctx={GestureClassifier,document,window,URL,localStorage:{getItem:()=> '1'},navigator:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}},Worker:class{constructor(){workers.push(this);}postMessage(){}terminate(){this.terminated=true;}},createImageBitmap:async()=>({close(){}}),HTMLMediaElement:{HAVE_CURRENT_DATA:2},performance:{now:()=>1000},setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id),console};
  vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/,'').replaceAll('import.meta.url',JSON.stringify('https://example.test/assets/camera.js')),ctx);
  const stream=()=>{const track={ended:false,stop(){this.ended=true;}};return {track,getTracks:()=>[track]};};
  return {ctx,events,requests,workers,timers,stream,node,document,window,hideReader(){visible=false;}};
}
{
 const f=fixture(),first=f.ctx.start();f.ctx.stop();const second=f.ctx.start();
 const old=f.stream(),current=f.stream();f.requests[0].resolve(old);await first;f.requests[1].resolve(current);await second;
 assert.equal(old.track.ended,true,'a late camera grant must release its own stream instead of attaching to the restarted session');
 assert.equal(f.workers.length,1,'a cancelled start must not create an orphan worker');
 f.ctx.stop();assert.equal(current.track.ended,true);
}
for(const reason of ['visibilitychange','selah-mac-app-activity','selah-mac-camera-stop','pagehide','reader-exit']){
 const f=fixture(),start=f.ctx.start(),camera=f.stream();f.requests[0].resolve(camera);await start;
 f.workers[0].onmessage({data:{type:'ready'}});
 if(reason==='visibilitychange')f.document.visibilityState='hidden';
 if(reason==='selah-mac-app-activity')f.window.selahMacAppPresence={active:false};
 if(reason==='reader-exit'){f.hideReader();await [...f.timers.values()][0]();}else f.events[reason]();
 assert.equal(camera.track.ended,true,reason+' releases the camera track');
 assert.equal(f.workers[0].terminated,true,reason+' terminates the recognition worker');
 assert.equal(f.timers.size,0,reason+' cancels frame capture');
}
{
 const f=fixture(),old=f.ctx.start();f.ctx.stop();const current=f.ctx.start();
 f.requests[0].reject(new Error('old request failed'));await old;
 const camera=f.stream();f.requests[1].resolve(camera);await current;
 assert.equal(camera.track.ended,false,'an old failure must not shut down a new camera session');f.ctx.stop();
}
console.log('PASS camera shutdown: late grant/rejection, restart, app background, native stop, page exit, reader exit, track/worker/timer cleanup');
