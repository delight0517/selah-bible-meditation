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
 const original = {notes:{'MAT:1':'synthetic old note'},bookmarks:['MAT:1:2'],highlights:['MAT:1:3'],extra:{keep:true}};
 const sources=['selah.reader.es.v1','selah.reader.pt-br.v1','selah.fil.reader.v1'];
 async function client(quota=false,token='') {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:404,contentType:route.request().resourceType()==='script'?'text/javascript':'application/json',body:route.request().resourceType()==='script'?'':'{}'}));
  await context.addInitScript(({origin,original,sources,quota,token})=>{
   if(!localStorage.getItem('synthetic-seeded')) {
    localStorage.setItem('synthetic-seeded','1');localStorage.setItem('selah.bluecloud.server',origin);localStorage.setItem('selah.locale','ko');localStorage.setItem('selah-guide-complete','1');
    if(token)localStorage.setItem('selah.bluecloud.token',token);
    else {localStorage.setItem('selah.v1',JSON.stringify({reflections:[{id:'existing',text:'synthetic existing note',tags:[]}],cards:[],draft:{text:'synthetic active draft'}}));for(const source of sources)localStorage.setItem(source,JSON.stringify(original));}
   }
   if(quota){const old=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('selah.migration.backup.v1.'))throw new DOMException('Synthetic quota','QuotaExceededError');return old.call(this,key,value)}}
  },{origin,original,sources,quota,token});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>document.querySelector('#legacyMigrationPanel'));return {page,context};
 }
 const local=await client();
 const read=()=>local.page.evaluate(sources=>({notes:db.reflections.length,marks:db.readerMarks?.length||0,archives:db.legacyReaderArchives?.length||0,draft:db.draft.text,originals:sources.map(source=>localStorage.getItem(source)),backups:Object.keys(localStorage).filter(key=>key.startsWith('selah.migration.backup.v1.')).length}),sources);
 const first=await read();assert.equal(first.notes,4);assert.equal(first.marks,6);assert.equal(first.archives,3);assert.equal(first.backups,1);assert.equal(first.draft,'synthetic active draft');assert.ok(first.originals.every(raw=>raw===JSON.stringify(original)));
 await local.page.reload();await local.page.waitForFunction(()=>document.querySelector('#legacyMigrationPanel'));assert.deepEqual(await read(),first);
 await local.page.evaluate(()=>connect('synthetic-migration'));await local.page.evaluate(()=>sync());assert.equal(accounts.get('synthetic-migration').reflections.length,4);assert.equal(accounts.get('synthetic-migration').readerMarks.length,6);
 const remote=await client(false,'synthetic-migration');await remote.page.waitForFunction(()=>accountStateReady&&db.reflections.length===4);assert.equal(await remote.page.evaluate(()=>db.readerMarks.length),6);
 await local.page.evaluate(()=>connect('synthetic-bob'));await local.page.locator('#accountBtn').click();assert.equal(await local.page.evaluate(()=>db.reflections.length),0);assert.equal(accounts.get('synthetic-bob').readerMarks.length,0);
 const blocked=await client(true);assert.equal(await blocked.page.evaluate(()=>db.reflections.length),1);assert.equal(await blocked.page.evaluate(()=>db.legacyReaderArchives?.length||0),0);assert.ok((await blocked.page.locator('#legacyMigrationStatus').innerText()).includes('완료하지 못'));
 assert.deepEqual(errors,[]);console.log('PASS actual UI migration: 3 stores, 4 notes, 6 marks, originals + backup retained, reload deduplication, synthetic cloud readback, account isolation, quota abort; zero live-account requests.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
