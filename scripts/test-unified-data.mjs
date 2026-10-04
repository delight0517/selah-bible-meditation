import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const data = createRequire(import.meta.url)('./unified-data.js');
const base = () => ({ firstUsedAt: 1, reflections: [], cards: [], qtLibrary: [], attendanceDays: [], draft: {}, language: 'ko', readerPrefs: { desktop: { font: 'system', size: 25 }, mobile: { font: 'system', size: 25 } } });
function edit(state, device, now, change) { const next = data.clone(state); change(next); return data.observe(state, next, device, now); }
const same = (a, b) => assert.equal(data.stable(a), data.stable(b));

test('Windows, Mac and iOS additions converge in either order without losing notes', () => {
  const start = base();
  const states = ['Windows','Mac','iOS'].map((device,i) => edit(start, device, 100+i, state => state.reflections.push({ id: device, text: device, createdAt: 100+i })));
  const forward = states.reduce((a,b) => data.merge(a,b)), reverse = states.slice().reverse().reduce((a,b) => data.merge(a,b));
  same(forward, reverse); assert.equal(forward.reflections.length,3);
  same(data.merge(forward,reverse), forward);
});
test('concurrent same-note edits converge and preserve the losing content for recovery', () => {
  const start = base(); start.reflections.push({ id:'note', text:'original', updatedAt:10 });
  const a=edit(start,'Windows',100,s=>s.reflections[0].text='Windows edit'), b=edit(start,'iOS',100,s=>s.reflections[0].text='iOS edit');
  const merged=data.merge(a,b); same(merged,data.merge(b,a));
  const values=[merged.reflections[0].text,...Object.values(merged._selahSync.recovery).map(r=>r.value.text)];
  assert.ok(values.includes('Windows edit')&&values.includes('iOS edit'));
});
test('a deleted link does not reappear when an offline old client uploads it', () => {
  const start=base(); start.qtLibrary=[{id:'link',url:'https://example.test',createdAt:10}];
  const deleted=edit(start,'Mac',200,s=>s.qtLibrary=[]);
  const merged=data.merge(deleted,start); assert.equal(merged.qtLibrary.length,0);
  assert.equal(Object.values(merged._selahSync.recovery)[0].value.id,'link');
  same(merged,data.merge(start,deleted));
});
test('an old client edit with a newer timestamp is respected despite older metadata', () => {
  const modern=edit(base(),'Windows',100,s=>s.reflections=[{id:'note',text:'first',updatedAt:100}]);
  const legacy=data.clone(modern); legacy.reflections[0]={id:'note',text:'legacy update',updatedAt:200};
  assert.equal(data.merge(modern,legacy).reflections[0].text,'legacy update');
});
test('stale cloud preferences do not undo changes and desktop/mobile changes combine', () => {
  const start=base(); const a=edit(start,'Windows',100,s=>{s.language='en';s.readerPrefs.desktop.size=32; s.appearance={theme:'dark'};});
  const b=edit(start,'iOS',101,s=>s.readerPrefs.mobile.size=20);
  const merged=data.merge(a,b); assert.equal(merged.language,'en'); assert.equal(merged.readerPrefs.desktop.size,32);assert.equal(merged.readerPrefs.mobile.size,20);assert.equal(merged.appearance.theme,'dark');
  same(merged,data.merge(b,a));
});
test('explicit backup import adds notes, restores deleted records as copies and retains local draft', () => {
  const start=base(); start.owner='accountA';start._rev=12;start.reflections=[{id:'deleted',text:'old'}];start.draft={text:'unsaved local'};
  const current=edit(start,'Windows',100,s=>{s.reflections=[];s.reflections.push({id:'current',text:'current'});});
  const imported=data.importState(current,{appId:'selah',backupVersion:1,state:{owner:'accountB',_rev:900,token:'forbidden',reflections:[{id:'deleted',text:'backup'}],cards:[],draft:{text:'backup draft'}}});
  assert.equal(imported.owner,'accountA');assert.equal(imported._rev,12);assert.equal(imported.token,undefined);assert.equal(imported.reflections.length,2);assert.equal(imported.draft.text,'unsaved local');assert.ok(imported.drafts.some(d=>d.text==='backup draft'));
});
test('portable backups keep recovery content and exclude auth and live commands', () => {
  const start=base();start.owner='account';start.token='secret';start._rev=4;start.computerReadingRequest={id:'transient'};start.meditationSession={id:'timer'};
  const a=edit(start,'Windows',100,s=>s.reflections=[{id:'note',text:'first'}]);const b=edit(start,'Mac',100,s=>s.reflections=[{id:'note',text:'second'}]);
  const backup=data.portable(data.merge(a,b));assert.equal(backup.state.owner,undefined);assert.equal(backup.state.token,undefined);assert.equal(backup.state._rev,undefined);assert.equal(backup.state.computerReadingRequest,undefined);assert.equal(backup.state.meditationSession,undefined);assert.equal(Object.keys(backup.state.recoveryArchive).length,1);
  const imported=data.importState(base(),backup);assert.equal(Object.keys(imported._selahSync.recovery).length,1);
});
test('drafts from multiple devices remain separate and finishing one does not erase the others', () => {
  const start=base();const a=edit(start,'Windows',100,s=>s.draft={text:'Windows draft'});const b=edit(start,'iOS',100,s=>s.draft={text:'iOS draft'});
  const merged=data.merge(a,b); assert.equal(merged.drafts.length,2);const done=edit({...merged,draft:{text:'Windows draft'}},'Windows',200,s=>s.draft={});
  assert.deepEqual(data.merge(done,b).drafts.map(d=>d.id),['iOS']);
});
test('unknown account extension fields survive while local-only fields are excluded', () => {
  const remote={...base(),nativeExtension:{value:7},owner:'private',authToken:'secret',_rev:3};const merged=data.merge(base(),remote);
  assert.equal(data.payload(merged).nativeExtension.value,7);assert.equal(data.payload(merged).authToken,undefined);assert.equal(data.payload(merged).owner,undefined);assert.equal(data.payload(merged).draft,undefined);
  const combined = data.merge({...base(),nativeExtension:{macField:1}},{...remote,nativeExtension:{winField:2}});
  assert.deepEqual(combined.nativeExtension,{macField:1,winField:2});
});
test('Bible language stays separate from UI language and legacy equal-time choices converge',()=>{
  const a={...base(),language:'ko',bibleContentLanguage:{code:'ko',updatedAt:100}}, b={...base(),language:'en',bibleContentLanguage:{code:'en',updatedAt:100}};
  assert.equal(data.merge(a,b).bibleContentLanguage.code,'en');same(data.merge(a,b),data.merge(b,a));
});
test('results from an older computer request cannot attach to the selected request', () => {
  const a={...base(),computerReadingRequest:{id:'new',createdAt:200},computerReadingResult:null}; const b={...base(),computerReadingRequest:{id:'old',createdAt:100},computerReadingResult:{id:'old',completedAt:300,status:'opened'}};
  assert.equal(data.merge(a,b).computerReadingResult,null);
});
test('future schemas fail before data can be overwritten', () => {assert.throws(()=>data.merge(base(),{_selahSync:{version:2}}),/newer Selah/);});
test('hybrid clocks advance after observing a device whose clock was ahead', () => {
  const future=edit(base(),'Mac',10000,s=>s.language='en'), merged=data.merge(base(),future);const local=edit(merged,'Windows',100,s=>s.language='ko');
  assert.equal(data.merge(local,future).language,'ko');
});

test("reader restores location and protects asynchronous selection and scroll", async () => { const { default: run } = await import("./test-reader-startup.cjs"); await run(); });


test('shared reading history and private friend labels sync by stable per-room ID',()=>{
 const start={...base(),togetherReads:[]};
 const room={id:'a'.repeat(32),passage:{book:'MAT',chapter:1,translation:'KRV',language:'ko'},participantCount:2,startedAt:100,updatedAt:100,friendName:''};
 const a=edit(start,'iOS',110,state=>state.togetherReads.push(room));
 const b=edit(start,'Mac',120,state=>{state.togetherReads.push({...room,friendName:'Mina',updatedAt:120});});
 const merged=data.merge(a,b);assert.equal(merged.togetherReads.length,1);assert.equal(merged.togetherReads[0].friendName,'Mina');
 assert.equal(data.payload(merged).togetherReads[0].passage.book,'MAT');
 assert.equal(data.payload(merged).token,undefined);
 same(merged,data.merge(b,a));
});

test('personal highlight color preference synchronizes as its own account register', () => {
  const start = base();
  const phone = edit(start, 'iOS', 100, state => { state.readerPrefs.highlightColor = 'pink'; });
  const mac = edit(start, 'Mac', 110, state => { state.readerPrefs.highlightColor = 'blue'; });
  const merged = data.merge(phone, mac);
  assert.ok(data.registers.includes('readerPrefs.highlightColor'));
  assert.equal(merged.readerPrefs.highlightColor, 'blue');
  assert.equal(data.payload(merged).readerPrefs.highlightColor, 'blue');
});
