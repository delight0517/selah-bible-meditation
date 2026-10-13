const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
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
async function startup(){
 const calls=[],context={window:{},console,localStorage:{getItem:()=>null},db:{bibleBook:'GAL',bibleChapter:5,passage:4,readingState:{book:'GAL',chapter:5,verseAnchor:12,scrollRatio:.4}},defaultBibles:{ko:{id:'kor_old',file:'matthew-krv.json'}},bibleLoadSerial:0,activeBibleData:null,activeBibleBooks:[],loadedBibleLanguage:'',bibleContentLanguage:()=> 'ko',biblePreference:x=>x,storedBible:async()=>({id:'kor_old'}),storedBibleChapter:async()=>({verses:[{verse:1,text:'cached'}]}),touchBible:async()=>{},selectBibleBook:async(id,ch)=>calls.push([id,ch]),applyReadingPosition:()=>calls.push('restore-position'),renderBibleLibrary:()=>{},autoDownloadBible:()=>{},fetch:()=>{throw Error('Startup waited for network')}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/bible-book-catalogs.js','utf8'),context);vm.runInContext(extract('async function loadBibleForLanguage(','function chapterFromApi('),context);await context.loadBibleForLanguage('ko');assert.deepEqual(calls,[['GAL',5],'restore-position']);assert.equal(context.db.bibleBook,'GAL');assert.equal(context.activeBibleBooks.length,66);console.log('PASS saved book, chapter and scroll restoration after chapter load');
}
async function selection(){
 let releaseFirst;const writes=[];const translation={id:'kor_old',bookChapters:{}};const context={db:{bibleBook:'GAL',bibleChapter:5},activeBibleData:translation,activeBibleBooks:[{id:'GEN',name:'Genesis',numberOfChapters:50},{id:'EXO',name:'Exodus',numberOfChapters:40}],activeBibleBookId:'GAL',bookSelectionSerial:0,passages:[],storedBibleBook:async(id,book)=>book==='GEN'?new Promise(resolve=>releaseFirst=resolve):[],trackSelahFeature:()=>{},renderPassage:()=>writes.push(context.db.bibleBook),saveReadingPosition:()=>{},persist:()=>{},scheduleSync:()=>{},ensureCurrentBibleChapter:async()=>{}};vm.createContext(context);vm.runInContext(extract('async function selectBibleBook(','async function ensureCurrentBibleChapter'),context);const first=context.selectBibleBook('GEN',9);assert.equal(context.db.bibleBook,'GAL');await context.selectBibleBook('EXO',4);releaseFirst([]);await first;assert.equal(context.db.bibleBook,'EXO');assert.equal(context.db.bibleChapter,4);assert.deepEqual(writes,['EXO']);console.log('PASS stale asynchronous book selection cannot overwrite newer selection');
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
async function runReaderRegression(){await startup();await selection();await render();await savedPosition();await focusChapterKeys();await focusedFontShortcuts()}
module.exports=runReaderRegression;
if(require.main===module)runReaderRegression().catch(err=>{console.error(err);process.exit(1)});
