import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const classifierSource = await readFile(new URL('../assets/selah-gesture-classifier.js', import.meta.url), 'utf8');
const { GestureClassifier } = await import(`data:text/javascript;base64,${Buffer.from(classifierSource).toString('base64')}`);
const runtime = (await readFile(new URL('../assets/selah-camera-gestures.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
function hand(x, y = .5) {
  const p = Array.from({length:21}, () => ({x, y}));
  p[0]={x,y:y+.35};
  for (const [base,tip,offset] of [[5,8,-.14],[9,12,0],[13,16,.11],[17,20,.19]]) {
    p[base]={x:x+offset,y:y+.06};
    p[tip-2]={x:x+offset,y:y-.1};
    p[tip]={x:x+offset,y:y-.4};
  }
  return p;
}
function swipe(start, end, at) {
  return [[start,at],[start,at+150],[start,at+300],[start+(end-start)*.45,at+400],[end,at+520]].map(([x,t]) => {
    const p=hand(x);
    for (const i of [6,7,8,10,11,12,14,15,16,18,19,20]) p[i].x+=(x-start)*1.25;
    return {landmarks:p,timestamp:t};
  });
}
async function exercise(native, replayFrames = null, cameraError = null) {
  const nodes=new Map(), listeners={}, cameras={}, timers=[];
  const node=id => { if(!nodes.has(id)) nodes.set(id,{textContent:'',hidden:false,clientHeight:400,getClientRects:()=>[{}],classList:{toggle(){}},setAttribute(){},addEventListener(name,fn){listeners[id+':'+name]=fn;},style:{},scrollBy(){},close(){}});return nodes.get(id);};
  let worker, cameraStarts=0, tracksStopped=0, cameraAttempts=0;
  const navigation=[];
  const document={visibilityState:'visible',body:{append(){}},getElementById:node,querySelector:()=>node('reader'),addEventListener(){},createElement(tag){return {...node('created-'+tag),pause(){},remove(){},play:async()=>{},readyState:2};}};
  const plugin={addListener:async(name,fn)=>{cameras[name]=fn;return {remove(){}};},start:async()=>{cameraStarts++;},stop:async()=>{}};
  const window={navigateBibleChapter:n=>navigation.push(n),addEventListener(){},Capacitor:native?{isNativePlatform:()=>true,getPlatform:()=> 'ios',Plugins:cameraError==='missing-plugin'?{}:{SelahHandCamera:plugin}}:undefined};
  const context={GestureClassifier,document,window,localStorage:{getItem:()=> '1',setItem(){}},navigator:native?{}:{mediaDevices:{getUserMedia:async()=>{cameraAttempts++;if(cameraError && cameraAttempts===1) throw Object.assign(new Error(cameraError==='constraints'?'Invalid constraint':'Denied'),{name:cameraError==='constraints'?'OverconstrainedError':'NotAllowedError'});return {getTracks:()=>[{stop(){tracksStopped++;}}]};}}},Worker:native?undefined:class {constructor(){worker=this;}postMessage(){}terminate(){}},createImageBitmap:native?undefined:async()=>({close(){}}),HTMLMediaElement:{HAVE_CURRENT_DATA:2},URL:{createObjectURL:()=> 'blob:local-video',revokeObjectURL(){}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},performance:{now:()=>5000},console};
  vm.createContext(context);
  vm.runInContext(runtime.replaceAll('import.meta.url', JSON.stringify('https://example.test/assets/selah-camera-gestures.js')),context);
  // Native iOS must work without browser camera/Worker/ImageBitmap APIs.
  if (!native) context.URL=URL;
  await context.start();
  if(cameraError==='missing-plugin') {
    assert.equal(cameraStarts,0);
    assert.match(node('selahGestureStatus').textContent,/앱을 업데이트/);
    assert.doesNotMatch(node('selahGestureStatus').textContent,/registerPlugin/);
    return;
  }
  if(cameraError==='permission'){assert.equal(cameraAttempts,1);assert.match(node('selahGestureStatus').textContent,/거부/);return;}
  if(cameraError==='constraints') assert.equal(cameraAttempts,2);
  const send=frame => native?cameras.landmarks(frame):worker.onmessage({data:{type:'landmarks',...frame}});
  if(native) assert.equal(cameraStarts,1); else {worker.onmessage({data:{type:'ready'}});assert.ok(timers.length);}
  const replay = start => replayFrames.map((f,i)=>({landmarks:f.landmarks?.map(p=>({x:1-p.x,y:p.y})),timestamp:start+i*140}));
  (replayFrames ? replay(0) : swipe(.25,.47,0)).forEach(send);
  assert.deepEqual(navigation,[1]);
  assert.match(node('selahGestureStatus').textContent,/手|손을 화면 밖으로/);
  // Continuing movement and a brief tracking dropout cannot cause another turn.
  swipe(.65,.43,800).forEach(send);
  send({landmarks:null,timestamp:1500});send({landmarks:null,timestamp:1800});
  send({landmarks:hand(.5),timestamp:1900});
  assert.deepEqual(navigation,[1]);
  for(const timestamp of [2000,2200,2400,2500]) send({landmarks:null,timestamp});
  assert.match(node('selahGestureStatus').textContent,/자동 재설정 완료/);
  assert.match(node('selahGestureStatus').textContent,/자동 재설정 1회/);
  (replayFrames ? replay(2600) : swipe(.65,.43,2600)).forEach(send);
  assert.deepEqual(navigation,[1,replayFrames ? 1 : -1]);
  assert.match(node('selahGestureStatus').textContent,/판정 2회/);
  context.stop();
  send({landmarks:null,timestamp:4000});
  assert.equal(node('selahGestureStatus').textContent,'카메라 꺼짐');
  if(!native) assert.equal(tracksStopped,1);
}
await exercise(false);
await exercise(true);
console.log('PASS actual shared camera runtime: first action → duplicate suppression → interrupted hide → 500ms automatic reset → second action, web worker + native iOS events');

if (process.env.SELAH_VISION_POSES) {
  const rows = (await readFile(process.env.SELAH_VISION_POSES,'utf8')).split(/\r?\n/);
  const clip = JSON.parse(rows.find(row => row.startsWith('['))).find(clip => clip.name === 'scroll left.MOV');
  assert.ok(clip?.frames.length, 'Recorded user video is required');
  await exercise(false, clip.frames); await exercise(true, clip.frames);
  console.log('PASS recorded scroll left.MOV → 500ms automatic reset → same recorded swipe again, through web + native camera event paths');
}

await exercise(false, null, 'constraints');
await exercise(false, null, 'permission');
console.log('PASS unsupported device constraints fall back once; camera permission denial is not retried');

await exercise(true, null, "missing-plugin");
console.log("PASS native WKWebView Plugins bridge without registerPlugin; missing native plugin stays recoverable");
