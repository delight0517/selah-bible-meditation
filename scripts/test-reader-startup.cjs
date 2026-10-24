const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/id="startFocusReading"[\s\S]{0,260}reader-start-fallback\.js/,'reader recovery loads before the main app script');
assert.match(html,/reader-start-fallback\.js\?v=read-link-20261023/,'reader deep-link fallback bypasses the cached broken script');
assert.match(html,/const homeAction=new URLSearchParams\(location\.search\)\.get\("homeAction"\);if\(homeAction==="meditate"/,'Bible deep links are started by the early fallback, outside main initialization');
assert.doesNotMatch(html,/homeAction==="read"[\s\S]{0,100}passageBookSelect[^\n]*\.focus\(\)/,'Bible deep link does not force focus to the book picker');
assert.match(html,/function withBibleStorageTimeout\(task,ms=1200\)/,'IndexedDB waits have a bounded timeout');
assert.match(html,/void storeBibleChapter\(translationId,book\.id,index\+1,chapter\)\.catch/,'Bible rendering does not wait for a cache write');
assert.match(html,/id="openReaderNotebook"[^>]*aria-controls="meditationNotebook"/,'regular Bible reader exposes the shared notes panel');
assert.match(html,/id="openFocusNotebook"[^>]*aria-controls="meditationNotebook"/i,'focus-reading toolbar exposes the shared notes drawer');
assert.match(html,/notebookOpeners=\[\$\("openMeditationNotebook"\),\$\("openReaderNotebook"\),\$\("openFocusNotebook"\)\]/,'regular reader, focus reader and timed meditation share the same notes editor');
assert.match(html,/body:not\(\.mobile-reading-focus\):has\(#meditationNotebook\.open\) \.reading-notebook\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(320px,1fr\)/,'desktop reading splits scripture and notes evenly');
assert.match(html,/<div class="reading-notebook">[\s\S]*?<aside class="meditation-notebook-drawer" id="meditationNotebook"/,'shared notes drawer is a child of the reader split container');
assert.match(html,/body:not\(\.mobile-reading-focus\):has\(#meditationNotebook\.open\) #meditationNotebook\{position:relative;inset:auto;grid-column:2/,'desktop notes panel occupies the right half of the reader');
assert.match(html,/body\.mobile-reading-focus \.reading-scripture~\*:not\(#meditationNotebook\)/,'focus mode leaves its notes drawer outside the hidden-element group');
assert.match(html,/body\.mobile-reading-focus:has\(#meditationNotebook\.open\) \.shell\{max-width:none/,'focus reading uses the full laptop width when notes are open');
assert.match(html,/body\.mobile-reading-focus:has\(#meditationNotebook\.open\) \.reading-notebook\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/,'focus reading gives Scripture and notes equal flexible columns');
assert.match(html,/id="focusBibleWidth" type="range" min="640" max="1800"/,'reader width has a user-adjustable range');
assert.match(html,/id="focusSplitRatio" type="range" min="35" max="70"/,'Scripture and notes split ratio has a user-adjustable range');
assert.match(html,/selah\.focusBibleWidth[\s\S]*?selah\.focusSplitPercent[\s\S]*?--focus-reader-width[\s\S]*?--focus-split-ratio/,'reader width preferences persist locally and update layout variables');
assert.match(html,/body\.mobile-reading-focus:not\(:has\(#meditationNotebook\.open\)\) \.reading-scripture \.verse\{max-width:min\(var\(--focus-reader-width,1400px\),100%\)\}/,'single Scripture reading uses the adjustable wide line measure');
assert.match(html,/body\.mobile-reading-focus:has\(#meditationNotebook\.open\) #meditationNotebook \.notebook textarea\{max-height:none;min-height:clamp\(180px/,'focus notes editor expands vertically on laptop screens');
assert.match(html,/id="writerModeToggle"[^>]*data-i18n="writerMode"/,'reflection editor exposes a dedicated immersive writing mode');
assert.match(html,/id="writerFontDecrease"[\s\S]*?id="writerFontIncrease"/,'reflection editor exposes decrease and increase font controls');
assert.match(html,/function handleFocusedFontShortcut\(event\)[\s\S]*?PageUp[\s\S]*?turnNotebookPage\(key==="PageDown"\?1:-1\)[\s\S]*?changeWriterFontSize\(key===.*?stepReaderSize\(key===/ ,'font shortcuts route to the focused editor and PageUp/PageDown turn writer pages');
assert.match(html,/\.notebook\.writer-mode \.notebook-top[^}]*\{display:none!important\}/,'writer page hides note toolbar');
assert.match(html,/\.notebook\.writer-mode \.save-row[^}]*\{display:none!important\}/,'writer page hides save controls');
assert.match(html,/\.notebook\.writer-mode \.optional-ai[^}]*\{display:none!important\}/,'writer page hides AI controls');
assert.match(html,/\.notebook\.writer-mode \.notebook-title h2\{display:none\}[\s\S]*?\.notebook\.writer-mode \.notebook-title #today/,'writer page keeps only the date in its heading');
assert.match(html,/\.meditation-notebook-drawer \.notebook\.writer-mode textarea#reflection\{[^}]*font:400 var\(--writer-font-size,1\.125rem\)\/1\.9 var\(--reader-font\)/,'classic paper editor applies independent font size with theme text colors');
assert.match(html,/editor\.classList\.toggle\("writer-mode",open\)/,'opening the note drawer activates the clean writing page');
assert.match(html,/id="reflectionPagePrevious"[\s\S]*?id="reflectionPageNext"/,'legacy pagination controls remain available outside the hidden focus page');
assert.match(html,/meditation-notebook-drawer\{[^}]*background:var\(--card\)/,'notes drawer uses semantic theme tokens for dark mode');
assert.match(html,/@media\(max-width:760px\)\{\.meditation-notebook-drawer\{left:8px;right:8px;top:max\(8px,env\(safe-area-inset-top\)\);bottom:max\(8px,env\(safe-area-inset-bottom\)\);width:auto/ ,'mobile notes use a near-full-screen safe-area drawer');
function extract(start,end){return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)))}
function startupLocalization(){
 const start=html.indexOf('const uiText={'),end=html.indexOf('\n};',start);
 assert.notEqual(start,-1,'main script declares its localization table');assert.notEqual(end,-1,'localization table closes');
 const context={};vm.createContext(context);vm.runInContext(`${html.slice(start,end+3)}\nglobalThis.__initializedUiText=uiText;`,context);
 const appStart=html.indexOf('let db='),startup=html.slice(end+3,appStart),targets=new Set();
 for(const match of startup.matchAll(/Object\.assign\(uiText\.([A-Za-z0-9-]+)\s*,|Object\.assign\(uiText\[['"]([^'"]+)['"]\]\s*,/g))targets.add(match[1]||match[2]);
 assert.ok(targets.size>0,'startup has translation extensions');
 for(const locale of targets)assert.ok(context.__initializedUiText[locale],`startup initializes ${locale} before translation extensions`);
 console.log(`PASS all ${targets.size} direct translation extensions initialize before app startup`);
}
async function startup(){
 const calls=[],context={window:{},console,localStorage:{getItem:()=>null},db:{bibleBook:'GAL',bibleChapter:5,passage:4,readingState:{book:'GAL',chapter:5,verseAnchor:12,scrollRatio:.4}},defaultBibles:{ko:{id:'kor_old',file:'matthew-krv.json',label:'KRV',rightsId:'ko-krv'}},bibleLoadSerial:0,activeBibleData:null,activeBibleBooks:[],loadedBibleLanguage:'',bibleContentLanguage:()=> 'ko',biblePreference:x=>x,bibleLanguageCode:()=> 'ko',withBibleStorageTimeout:task=>task,storedBible:async()=>null,bibleBookMemory:{delete(){}},storeBible:async()=>{},storeBibleChapter:async()=>{},touchBible:async()=>{},selectBibleBook:async(id,ch)=>calls.push([id,ch]),applyReadingPosition:()=>calls.push('restore-position'),renderBibleLibrary:()=>{},autoDownloadBible:()=>{},fetch:async()=>({ok:true,json:async()=>({chapters:[{verses:[{verse:1,text:'bundled'}]}]})})};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/bible-book-catalogs.js','utf8'),context);vm.runInContext(extract('async function loadBibleForLanguage(','function chapterFromApi('),context);await context.loadBibleForLanguage('ko');assert.deepEqual(calls,[['GAL',5],'restore-position']);assert.equal(context.db.bibleBook,'GAL');assert.equal(context.activeBibleBooks.length,66);console.log('PASS saved book, chapter and scroll restoration after chapter load');
}
async function selection(){
 let releaseFirst;const writes=[];const translation={id:'kor_old',bookChapters:{}};const context={db:{bibleBook:'GAL',bibleChapter:5},activeBibleData:translation,activeBibleBooks:[{id:'GEN',name:'Genesis',numberOfChapters:50},{id:'EXO',name:'Exodus',numberOfChapters:40}],activeBibleBookId:'GAL',bookSelectionSerial:0,passages:[],withBibleStorageTimeout:task=>task,storedBibleBook:async(id,book)=>book==='GEN'?new Promise(resolve=>releaseFirst=resolve):[],trackSelahFeature:()=>{},renderPassage:()=>writes.push(context.db.bibleBook),saveReadingPosition:()=>{},persist:()=>{},scheduleSync:()=>{},ensureCurrentBibleChapter:async()=>{},preloadAdjacentBibleChapters:()=>{}};vm.createContext(context);vm.runInContext(extract('async function selectBibleBook(','async function ensureCurrentBibleChapter'),context);const first=context.selectBibleBook('GEN',9);assert.equal(context.db.bibleBook,'GAL');await context.selectBibleBook('EXO',4);releaseFirst([]);await first;assert.equal(context.db.bibleBook,'EXO');assert.equal(context.db.bibleChapter,4);assert.deepEqual(writes,['EXO']);console.log('PASS stale asynchronous book selection cannot overwrite newer selection');
}
async function preloadedAdjacentChapter(){
 const chapter={ref:'Genesis 2',chapter:2,verses:[{verse:1,text:'example'}]},writes=[];
 const context={activeBibleBooks:[{id:'GEN',name:'Genesis',numberOfChapters:50}],activeBibleData:{id:'kor_old',bookChapters:{}},activeBibleBookId:'GEN',passages:[{},{}],storedBibleChapter:async()=>null,fetch:async()=>({ok:true,json:async()=>({})}),chapterFromApi:()=>chapter,storeBibleChapter:(...args)=>{writes.push(args);return Promise.resolve()},bibleBookMemory:{delete(){}}};
 vm.createContext(context);vm.runInContext(extract('async function preloadBibleChapter(','function preloadAdjacentBibleChapters()'),context);
 assert.equal(await context.preloadBibleChapter({book:'GEN',chapter:2} ),chapter);
 assert.equal(context.passages[1],chapter,'current-book neighbors become available to navigation immediately');
 assert.equal(context.activeBibleData.bookChapters.GEN[1],chapter,'the selected translation retains the preloaded chapter');
 assert.equal(writes.length,1,'the fetched chapter is persisted through the existing IndexedDB helper');
 console.log('PASS adjacent Bible chapter is warm in memory and queued for the existing durable cache');
}
async function render(){
 const elements=new Map();let verseWrites=0;function el(id){if(!elements.has(id)){const e={hidden:false,disabled:false,firstChild:{textContent:''},textContent:'',scrollTop:90,style:{},options:[],setAttribute(){},querySelector(){return {textContent:''}},querySelectorAll(){return []}};Object.defineProperty(e,'innerHTML',{get(){return e._html||''},set(v){e._html=v;if(['verseText','meditationVerse'].includes(id))verseWrites++;e.scrollTop=0}});elements.set(id,e)}return elements.get(id)};
 const passage={ref:'Genesis 9',verses:[{verse:1,text:'example'}],chapter:9};const context={$:el,db:{customPassageActive:false},activeBibleData:{id:'kor_old'},activeBibleBooks:[{id:'GEN',name:'Genesis'}],activeBibleBookId:'GEN',passages:[passage],currentPassageIndex:()=>0,currentPassage:()=>passage,renderedPassageKey:'',renderedVerseContent:'',showBibleSource:false,sharedVerseParam:0,preferredLocale:()=> 'en',t:x=>x,esc:x=>x,passageDisplayRef:p=>p.ref,bibleContentLanguage:()=> 'ko',window:{},adjacentBibleChapter:()=>null,currentScene:()=>'',applyReadingPosition:()=>{},paintBibleAudioFollowVerse:()=>{}};vm.createContext(context);vm.runInContext(extract('function renderPassage(){','function setNotebookMode()'),context);context.renderPassage();assert.match(el('verseText').innerHTML,/example/);context.window.SelahScriptureHighlights={render:text=>'<mark>'+text+'</mark>'};context.renderPassage();assert.match(el('verseText').innerHTML,/<mark>example<\/mark>/);el('verseText').scrollTop=90;el('meditationVerse').scrollTop=120;context.renderPassage();assert.equal(verseWrites,4);assert.equal(el('verseText').scrollTop,90);assert.equal(el('meditationVerse').scrollTop,120);context.activeBibleData=null;context.renderPassage();assert.equal(el('verseText').textContent,'bibleLoadingChapter');assert.equal(el('passageBookSelect').disabled,true);console.log('PASS missing highlighter falls back to readable verses; module highlights when available');
}
async function savedPosition(){
 const calls=[];const verse={querySelector:()=>({textContent:'12'}),getBoundingClientRect:()=>({top:120,height:40})};const anchored={scrollTop:10,scrollHeight:500,clientHeight:100,getBoundingClientRect:()=>({top:100}),querySelectorAll:()=>[verse]};const ratioOnly={scrollTop:0,scrollHeight:500,clientHeight:100,getBoundingClientRect:()=>({top:0}),querySelectorAll:()=>[]};const context={db:{readingState:{verseAnchor:12,verseOffset:.25,scrollRatio:.5}},requestAnimationFrame:fn=>fn(),$:id=>id==='verseText'?anchored:ratioOnly};vm.createContext(context);vm.runInContext(extract('function applyReadingPosition(){','function saveReadingPosition('),context);context.applyReadingPosition();assert.equal(anchored.scrollTop,40);assert.equal(ratioOnly.scrollTop,200);console.log('PASS restores the saved verse anchor/offset with scroll-ratio fallback');
}
async function focusChapterKeys(){
 const calls=[],listeners={},meditation={classList:{contains:()=>false}},body={classList:{contains:name=>name==="mobile-reading-focus"}};
 const context={document:{body,addEventListener:(name,fn)=>listeners[name]=fn},meditationView:meditation,preferredLocale:()=>"en",navigateBibleChapter:delta=>calls.push(delta)};
 vm.createContext(context);vm.runInContext(extract('function handleReaderChapterKey(event){','document.addEventListener("keydown",event=>{\n if(handleReaderChapterKey(event))return;'),context);
 const event=(key,extra={})=>({key,defaultPrevented:false,isComposing:false,altKey:false,ctrlKey:false,metaKey:false,repeat:false,target:{closest:()=>null},preventDefault(){this.defaultPrevented=true},...extra});
 let e=event("ArrowRight");assert.equal(context.handleReaderChapterKey(e),true);assert.deepEqual(calls,[1]);assert.equal(e.defaultPrevented,true);
 e=event("ArrowLeft");context.handleReaderChapterKey(e);assert.deepEqual(calls,[1,-1]);
 e=event("ArrowRight",{target:{closest:selector=>selector.includes("textarea")?{}:null}});assert.equal(context.handleReaderChapterKey(e),false,'keyboard navigation does not steal keys from editing controls');
 meditation.classList.contains=()=>true;assert.equal(context.handleReaderChapterKey(event("ArrowRight")),false,'timed meditation keeps its own directional controls');
 console.log('PASS focus-reading arrow keys navigate chapters in both directions');
}
async function focusedFontShortcuts(){
 const noteCalls=[],readerCalls=[];let active={closest:selector=>selector==="#reflection"?{}:null};const context={document:{activeElement:active},changeWriterFontSize:delta=>noteCalls.push(delta),stepReaderSize:delta=>readerCalls.push(delta)};
 vm.createContext(context);vm.runInContext(extract('function handleFocusedFontShortcut(event){','document.addEventListener("keydown",handleFocusedFontShortcut);'),context);
 const event=(key,mods={})=>({key,defaultPrevented:false,isComposing:false,altKey:false,metaKey:true,ctrlKey:false,preventDefault(){this.defaultPrevented=true},...mods});
 let e=event('+');assert.equal(context.handleFocusedFontShortcut(e),true);assert.deepEqual(noteCalls,[1]);assert.deepEqual(readerCalls,[]);assert.equal(e.defaultPrevented,true);
 active={closest:selector=>selector==="#verseText"?{}:null};context.document.activeElement=active;e=event('-',{metaKey:false,ctrlKey:true});assert.equal(context.handleFocusedFontShortcut(e),true);assert.deepEqual(readerCalls,[-1]);assert.deepEqual(noteCalls,[1]);
 active={closest:()=>null};context.document.activeElement=active;e=event('+');assert.equal(context.handleFocusedFontShortcut(e),false);assert.equal(e.defaultPrevented,false);
 console.log('PASS command/control plus-minus changes only the focused note or Scripture text');
}
async function blockedStorageDoesNotBlockBundledReader(){
 const calls=[],never=new Promise(()=>{}),context={
  window:{SelahBibleBookCatalogs:{kor_old:[{id:'MAT',name:'Matthew',numberOfChapters:28}]}},
  localStorage:{getItem:()=>null},defaultBibles:{ko:{file:'matthew-krv.json',label:'KRV',id:'kor_old',rightsId:'ko-krv'}},
  biblePreference:()=> 'selah.bible.translation.ko',bibleLoadSerial:0,withBibleStorageTimeout:task=>task,storedBible:()=>never,bibleBookMemory:{delete(){}},
  fetch:async()=>({ok:true,json:async()=>({chapters:[{chapter:1,verses:[{verse:1,text:'bundled verse'}]}]})}),
  storeBible:()=>never,storeBibleChapter:()=>never,db:{bibleBook:'MAT',bibleChapter:1,passage:0},
  bibleLanguageCode:()=> 'ko',touchBible:()=>Promise.resolve(),selectBibleBook:async(...args)=>calls.push(args),
  applyReadingPosition(){},renderBibleLibrary(){},autoDownloadBible(){},
 };
 vm.createContext(context);vm.runInContext(extract('async function loadBibleForLanguage(language=bibleContentLanguage()){','function chapterFromApi('),context);
 await Promise.race([context.loadBibleForLanguage('ko'),new Promise((_,reject)=>setTimeout(()=>reject(Error('reader waited for IndexedDB')),80))]);
 assert.equal(context.activeBibleData.bookChapters.MAT[0].verses[0].text,'bundled verse');assert.deepEqual(calls,[['MAT',1,false]]);
 console.log('PASS bundled Scripture loads when IndexedDB reads and writes never resolve');
}
async function chapterRendersBeforeCacheWrite(){
 let rendered=false;const passage={chapter:1},nodes={verseText:{textContent:''},meditationVerse:{textContent:''}},context={
  passages:[passage],chapterLoadSerial:0,activeBibleData:{id:'custom',bookChapters:{}},activeBibleBooks:[{id:'MAT',name:'Matthew'}],activeBibleBookId:'MAT',
  currentPassageIndex:()=>0,bibleDefaultIds:()=>new Set(),touchBible:()=>new Promise(()=>{}),storedBibleChapter:async()=>null,
  fetch:async()=>{return {ok:true,json:async()=>({})}},chapterFromApi:()=>({ref:'Matthew 1',chapter:1,verses:[{verse:1,text:'network verse'}]}),
  storeBibleChapter:()=>new Promise(()=>{}),bibleBookMemory:{delete(){}},$:id=>nodes[id],t:key=>key,renderPassage(){rendered=true}
 };
 vm.createContext(context);vm.runInContext(extract('async function ensureCurrentBibleChapter(){','\nfunction bibleLanguageCode'),context);
 await Promise.race([context.ensureCurrentBibleChapter(),new Promise((_,reject)=>setTimeout(()=>reject(Error('chapter waited for cache write')),80))]);
 assert.equal(context.passages[0].verses[0].text,'network verse');assert.equal(rendered,true);
 console.log('PASS network Scripture renders even when cache writes and usage metadata never resolve');
}
async function storageTimeoutRejects(){
 const context={setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(extract('function withBibleStorageTimeout(task,ms=1200){','async function storedBibles'),context);
 await assert.rejects(context.withBibleStorageTimeout(new Promise(()=>{}),5),/timed out/);
 console.log('PASS a blocked IndexedDB operation fails within its timeout');
}
async function readerEntryFallback(){
 let handler,focus=false,loaded=false;const body={classList:{add(name){if(name==='mobile-reading-focus')focus=true}}},scripture={querySelector:()=>loaded?{}:null,textContent:''};
 const button={dataset:{},addEventListener:(name,fn,options)=>{assert.equal(name,'click');assert.equal(options.capture,true);handler=fn}};
 const context={location:{search:''},URLSearchParams,document:{body,getElementById:id=>id==='startFocusReading'?button:scripture},window:{setReaderFocus:()=>{focus=true},loadBibleForLanguage:async()=>{loaded=true}},setTimeout:fn=>{fn();return 1},Promise};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/reader-start-fallback.js','utf8'),context);handler();await Promise.resolve();await Promise.resolve();
 assert.equal(focus,true);assert.equal(loaded,true);assert.equal(button.dataset.readerStartFallback,'true');
 console.log('PASS Scripture entry opens immediately and retries loading if app startup missed its handler');
}
async function readerDeepLinkStartsWithoutMainBootstrap(){
 let handler,loaded=false;const scheduled=[],body={classList:{add(){}}},scripture={querySelector:()=>loaded?{}:null,textContent:''};
 const button={dataset:{},addEventListener:(name,fn,options)=>{assert.equal(name,'click');assert.equal(options.capture,true);handler=fn},click(){handler()}};
 const context={location:{search:'?homeAction=read&lang=ko'},URLSearchParams,document:{body,getElementById:id=>id==='startFocusReading'?button:scripture},window:{loadBibleForLanguage:async()=>{loaded=true}},setTimeout:fn=>{scheduled.push(fn);return scheduled.length},Promise};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/reader-start-fallback.js','utf8'),context);assert.equal(scheduled.length,1);scheduled.shift()();assert.equal(scheduled.length,1);scheduled.shift()();await Promise.resolve();await Promise.resolve();assert.equal(loaded,true);
 console.log('PASS homeAction=read starts Scripture from the early fallback without main app routing');
}
async function runReaderRegression(){startupLocalization();await startup();await selection();await preloadedAdjacentChapter();await render();await savedPosition();await focusChapterKeys();await focusedFontShortcuts();await storageTimeoutRejects();await blockedStorageDoesNotBlockBundledReader();await chapterRendersBeforeCacheWrite();await readerEntryFallback();await readerDeepLinkStartsWithoutMainBootstrap()}
module.exports=runReaderRegression;
if(require.main===module)runReaderRegression().catch(err=>{console.error(err);process.exit(1)});
