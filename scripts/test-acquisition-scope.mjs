import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const staticAnalytics=fs.readFileSync('fil/analytics.js','utf8');
assert.match(staticAnalytics,/source:\s*campaign\.source\s*\|\|\s*"direct",\s*medium:\s*campaign\.medium\s*\|\|\s*"none",\s*campaign:\s*campaign\.campaign\s*\|\|\s*""/,'Static landing and app must use the same direct-attribution deduplication scope');
assert.match(html,/let source="direct",medium="none"/,'Application direct-attribution default must remain aligned with static landing events');
assert.match(staticAnalytics,/"selah\.experiment\.global-funnel-v1\.a\."\s*\+\s*scope\s*\+\s*"\."\s*\+\s*event/,'Static landing funnel key must use the shared funnel scope');
assert.match(html,/"selah\.experiment\.global-funnel-v1\.a\."\s*\+\s*scope\s*\+\s*"\."\s*\+\s*event/,'Application funnel key must use the shared funnel scope');
for(const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(!/application\/ld\+json/.test(match[1]||""))new vm.Script(match[2]);}
const activation=html.split('\n').find(line=>line.startsWith('async function activateKoreanHomeExperiment'));
async function scenario(search, client='web',country='KR',locale='ko',ready=true){
 const cards={};const events=[];const funnelCalls=[];const saved=new Map();const node=id=>cards[id]??={hidden:true,textContent:'',addEventListener(){}};
 const context={document:{documentElement:{lang:locale},addEventListener(){}},location:{search,pathname:'/selah-bible-meditation/'},window:{},fetch:async()=>({ok:true,json:async()=>({country,experiments:ready?["kr-spiritual-curiosity-v3"]:[]})}),selahSignupDevice:()=>({client,deviceClass:'computer'}),selahAttribution:()=>({source:'owned',medium:'share',campaign:'kr-god-curiosity-v3'}),localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},crypto:{getRandomValues:a=>{a[0]=200;return a}},URLSearchParams,Date,$:node,selahInternalQa:search.includes('selah_qa=1'),marketExperimentKey:'home',invitationExperimentId:'kr-spiritual-curiosity-v3',invitationExperimentKey:'invitation',marketExperimentVariant:'',invitationExperimentVariant:'',selahLandingRoute:()=>'app',activateGlobalFunnel:()=>funnelCalls.push('activate'),installGlobalFunnelListeners:()=>funnelCalls.push('listeners'),trackMarketExperiment:(...v)=>events.push(['home',...v]),trackInvitationExperiment:(...v)=>events.push(['invitation',...v])};vm.createContext(context);vm.runInContext(activation,context);await context.activateKoreanHomeExperiment();return{cards,events,funnelCalls,context};
}
const baseline=await scenario('');assert.equal(baseline.cards.gentleInvitation.hidden,true);assert.deepEqual(baseline.funnelCalls,['activate','listeners']);
assert.equal((await scenario('?utm_campaign=other')).cards.gentleInvitation.hidden,true);
assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','app')).cards.gentleInvitation.hidden,true);
assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','web','US')).cards.gentleInvitation.hidden,true);
const b=await scenario('?utm_campaign=kr-god-curiosity-v3');assert.equal(b.cards.gentleInvitation.hidden,false);assert.equal(b.context.marketExperimentVariant,'');assert.equal(b.context.invitationExperimentVariant,'b');assert.deepEqual(b.events,[['invitation','exposure']]);
const a=await scenario('?utm_campaign=kr-god-curiosity-v3&selah_qa=1&invitation_variant=a','web','US');assert.equal(a.cards.gentleInvitation.hidden,true);assert.equal(a.context.invitationExperimentVariant,'a');

const routeHelper=html.split("\n").find(line=>line.startsWith("function selahLandingRoute()"));
assert.ok(routeHelper,"app exposes the allow-listed entry-route classifier");
const routeStorage=new Map();let routeLocation={pathname:"/selah-bible-meditation/fil/",origin:"https://delight0517.github.io"};let routeReferrer="https://google.com/";
const routeContext=vm.createContext({location:routeLocation,document:{referrer:routeReferrer},sessionStorage:{getItem:key=>routeStorage.get(key)||null,setItem:(key,value)=>routeStorage.set(key,value)},URL});
vm.runInContext(routeHelper,routeContext);
assert.equal(routeContext.selahLandingRoute(),"localized-landing");
routeLocation.pathname="/selah-bible-meditation/";routeContext.document.referrer="https://delight0517.github.io/selah-bible-meditation/fil/";
assert.equal(routeContext.selahLandingRoute(),"localized-landing","same-origin landing-to-app navigation keeps the entry route");
routeContext.document.referrer="https://google.com/";assert.equal(routeContext.selahLandingRoute(),"app","a new external entry resets the route");
for(const [path,expected] of [["/selah-bible-meditation/guide/","guide"],["/selah-bible-meditation/pt-br/guia/","guide"],["/selah-bible-meditation/download/","download"],["/selah-bible-meditation/windows/download.html","download"],["/selah-bible-meditation/unexpected/","other"]]){routeLocation.pathname=path;routeContext.document.referrer="https://google.com/";assert.equal(routeContext.selahLandingRoute(),expected,path)}
const staticRouteSource=staticAnalytics.slice(staticAnalytics.indexOf("function classifyFunnelRoute"),staticAnalytics.indexOf("function entryFunnelRoute"));
assert.ok(staticRouteSource.includes("function classifyFunnelRoute"));const staticRouteContext=vm.createContext({});vm.runInContext(staticRouteSource,staticRouteContext);
for(const [path,expected] of [["/selah-bible-meditation/fil/","localized-landing"],["/selah-bible-meditation/fil/guide/","guide"],["/selah-bible-meditation/pt-br/guia/","guide"],["/selah-bible-meditation/windows/download.html","download"],["/selah-bible-meditation/unexpected/","other"]])assert.equal(staticRouteContext.classifyFunnelRoute(path),expected,path);
assert.match(staticAnalytics,/landingRoute/);assert.match(staticAnalytics,/sessionStorage\.getItem\(funnelRouteKey\)/);

console.log('Acquisition scope: routing, landing-to-reader continuity, reset, normal, unrelated, app, geography, treatment, control, and inline syntax passed');

assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','web','KR','ko',false)).cards.gentleInvitation.hidden,true);
