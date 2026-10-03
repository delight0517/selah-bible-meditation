// Synthetic browser/API integration. No real account or hosted service is contacted.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SELAH_PLAYWRIGHT_PATH || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const accounts = new Map(), writes = [], errors = [];
let forcedConflict = false, conflictCount = 0, revokeAccount = false;
const server = createServer(async (req,res) => {
  const path = new URL(req.url,'http://localhost').pathname;
  const send = (status, value) => {res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
  if (path.startsWith('/api/')) {
    const account = String(req.headers.authorization || '').replace('Bearer ','');
    if (path==='/api/auth/me') return send(200,{username:account});
    if (path==='/api/cloud-state/selah') {
      if (revokeAccount) return send(409,{error:'account_merged'});
      const current = accounts.get(account) || null;
      if (req.method==='GET') return send(200,{state:current});
      let body='';for await(const chunk of req)body+=chunk;
      const state=JSON.parse(body);
      if (forcedConflict || Number(state._rev)!==Number(current?._rev||0)) {forcedConflict=false;conflictCount++;return send(409,{error:'stale_state'});}
      state._rev=Number(current?._rev||0)+1;accounts.set(account,state);writes.push(structuredClone(state));return send(200,{rev:state._rev});
    }
    return send(200,{following:[],followers:[],communities:[]});
  }
  try {
    const target=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
    if (!target.startsWith(root)) return send(403,{});
    const content=await readFile(target);
    const type={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[extname(target)]||'application/octet-stream';
    res.writeHead(200,{'content-type':type});res.end(content);
  }catch{return send(404,{})}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const clients=[];
  for (const [platform,width,ua] of [['Windows',1366,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'],['Mac',1280,'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'],['iOS',390,'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18 Mobile Safari/604.1']]) {
    const context=await browser.newContext({viewport:{width,height:900},userAgent:ua});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:404,contentType:route.request().resourceType()==='script'?'text/javascript':'application/json',body:route.request().resourceType()==='script'?'':'{}'}));
    await context.addInitScript(({origin,platform})=>{localStorage.setItem('selah.bluecloud.server',origin);localStorage.setItem('selah.bluecloud.token','synthetic-alice');localStorage.setItem('selah.locale','ko');localStorage.setItem('selah-guide-complete','1');Object.defineProperty(navigator,'platform',{get:()=>platform==='Windows'?'Win32':platform==='iOS'?'iPhone':'MacIntel'});}, {origin,platform});
    const page=await context.newPage();page.on('pageerror',err=>errors.push(platform+': '+err.message));
    await page.goto(origin+'/?'+(platform==='Windows'?'windowsShell=1':''));
    await page.waitForFunction(()=>typeof accountStateReady!=='undefined'&&accountStateReady&&db.owner?.endsWith('|synthetic-alice'));
    clients.push({platform,page,context});
  }
  assert.deepEqual(errors,[],'all three UIs must boot without uncaught errors');
  await Promise.all(clients.map(({page,platform})=>page.evaluate(platform=>{db.reflections.push({id:platform,ref:'Matthew 1',date:'2026-10-02',text:platform+' synthetic note',tags:[],createdAt:Date.now(),updatedAt:Date.now()});persist();},platform)));
  forcedConflict=true;
  await Promise.all(clients.map(({page})=>page.evaluate(()=>sync())));
  for (const {page} of clients) await page.evaluate(()=>sync());
  for (const {page} of clients) assert.deepEqual(await page.evaluate(()=>db.reflections.map(n=>n.id).sort()),['Mac','Windows','iOS']);
  for (const {page} of clients) await page.evaluate(()=>sync());
  const stableWrites=writes.length;for (const {page} of clients) await page.evaluate(()=>sync());assert.equal(writes.length,stableWrites,'idle polling must not create a write feedback loop');
  assert.ok(conflictCount>0,'the actual browser sync path must retry revision conflicts');
  const [windows,mac,ios]=clients;
  await windows.page.evaluate(()=>{db.appearance={theme:'dark'};db.readerPrefs.desktop={font:'serif',size:32};persist();});
  await ios.page.evaluate(()=>{db.readerPrefs.mobile={font:'sans',size:20};persist();});
  await windows.page.evaluate(()=>sync());await ios.page.evaluate(()=>sync());await windows.page.evaluate(()=>sync());
  assert.deepEqual(await windows.page.evaluate(()=>[db.readerPrefs.desktop.size,db.readerPrefs.mobile.size,db.appearance.theme]),[32,20,'dark']);
  await windows.context.setOffline(true);
  await windows.page.evaluate(()=>{db.reflections.push({id:'offline',ref:'Matthew 1',date:'2026-10-02',text:'offline synthetic note',tags:[],updatedAt:Date.now()});persist();});
  assert.equal(await windows.page.evaluate(async()=>{try{await sync();return false}catch{return JSON.parse(localStorage.getItem(key)).reflections.some(n=>n.id==='offline')}}),true);
  await windows.context.setOffline(false);await windows.page.evaluate(()=>sync());await mac.page.evaluate(()=>sync());
  assert.equal(await mac.page.evaluate(()=>db.reflections.some(n=>n.id==='offline')),true);
  await mac.page.evaluate(()=>{db.qtLibrary.push({id:'delete-test',title:'Synthetic link',url:'https://example.test',createdAt:Date.now()});persist();});await mac.page.evaluate(()=>sync());await ios.page.evaluate(()=>sync());
  await mac.page.evaluate(()=>{db.qtLibrary=db.qtLibrary.filter(n=>n.id!=='delete-test');persist();});await mac.page.evaluate(()=>sync());await ios.page.evaluate(()=>sync());
  assert.equal(accounts.get('synthetic-alice').qtLibrary.some(n=>n.id==='delete-test'),false);
  await windows.page.evaluate(()=>{db.draft={text:'Windows synthetic draft'};persist();});await ios.page.evaluate(()=>{db.draft={text:'iOS synthetic draft'};persist();});
  await windows.page.evaluate(()=>sync());await ios.page.evaluate(()=>sync());await windows.page.evaluate(()=>sync());
  assert.equal(await windows.page.evaluate(()=>db.drafts.length),2);
  await windows.page.locator('#accountBtn').click();assert.ok((await windows.page.locator('#unifiedDataPanel').innerText()).includes('iOS synthetic draft'));
  await windows.page.evaluate(()=>connect('synthetic-bob'));
  assert.equal(await windows.page.evaluate(()=>db.reflections.length),0,'a different account must not receive Alice records');
  assert.equal(accounts.get('synthetic-bob').drafts.length,0);
  await windows.page.evaluate(()=>connect('synthetic-alice'));
  assert.equal(await windows.page.evaluate(()=>db.reflections.length),4);
  for (const payload of writes) for (const key of ['owner','draft','token','authToken','authorization']) assert.equal(payload[key],undefined,'local-only field leaked: '+key);
  revokeAccount=true;const previousWrites=writes.length;
  assert.equal(await windows.page.evaluate(async()=>{try{await sync();return false}catch{return token===''&&JSON.parse(localStorage.getItem(key)).reflections.length===4}}),true,'a merged account must stop retrying and preserve local records');
  assert.equal(writes.length,previousWrites);
  assert.deepEqual(errors,[]);
  console.log(`Synthetic browser integration passed: 3 isolated platforms, offline recovery, revision retry (${conflictCount}), deletion, settings, shared drafts and account isolation. ${writes.length} synthetic writes; zero live-account requests.`);
} finally {await browser.close();await new Promise(r=>server.close(r));}
