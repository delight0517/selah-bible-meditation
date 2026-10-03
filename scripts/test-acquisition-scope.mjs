import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
for(const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(!/application\/ld\+json/.test(match[1]||""))new vm.Script(match[2]);}
const activation=html.split('\n').find(line=>line.startsWith('async function activateKoreanHomeExperiment'));
async function scenario(search, client='web',country='KR',locale='ko',ready=true){
 const cards={};const events=[];const funnelCalls=[];const saved=new Map();const node=id=>cards[id]??={hidden:true,textContent:'',addEventListener(){}};
 const context={document:{documentElement:{lang:locale},addEventListener(){}},location:{search,pathname:'/selah-bible-meditation/'},window:{},fetch:async()=>({ok:true,json:async()=>({country,experiments:ready?["kr-spiritual-curiosity-v3"]:[]})}),selahSignupDevice:()=>({client,deviceClass:'computer'}),selahAttribution:()=>({source:'owned',medium:'share',campaign:'kr-god-curiosity-v3'}),localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},crypto:{getRandomValues:a=>{a[0]=200;return a}},URLSearchParams,Date,$:node,selahInternalQa:search.includes('selah_qa=1'),marketExperimentKey:'home',invitationExperimentId:'kr-spiritual-curiosity-v3',invitationExperimentKey:'invitation',marketExperimentVariant:'',invitationExperimentVariant:'',activateGlobalFunnel:()=>funnelCalls.push('activate'),installGlobalFunnelListeners:()=>funnelCalls.push('listeners'),trackMarketExperiment:(...v)=>events.push(['home',...v]),trackInvitationExperiment:(...v)=>events.push(['invitation',...v])};vm.createContext(context);vm.runInContext(activation,context);await context.activateKoreanHomeExperiment();return{cards,events,funnelCalls,context};
}
const baseline=await scenario('');assert.equal(baseline.cards.gentleInvitation.hidden,true);assert.deepEqual(baseline.funnelCalls,['activate','listeners']);
assert.equal((await scenario('?utm_campaign=other')).cards.gentleInvitation.hidden,true);
assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','app')).cards.gentleInvitation.hidden,true);
assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','web','US')).cards.gentleInvitation.hidden,true);
const b=await scenario('?utm_campaign=kr-god-curiosity-v3');assert.equal(b.cards.gentleInvitation.hidden,false);assert.equal(b.context.marketExperimentVariant,'');assert.equal(b.context.invitationExperimentVariant,'b');assert.deepEqual(b.events,[['invitation','exposure']]);
const a=await scenario('?utm_campaign=kr-god-curiosity-v3&selah_qa=1&invitation_variant=a','web','US');assert.equal(a.cards.gentleInvitation.hidden,true);assert.equal(a.context.invitationExperimentVariant,'a');
console.log('Acquisition scope: normal, unrelated, app, geography, treatment, control, and inline syntax passed');

assert.equal((await scenario('?utm_campaign=kr-god-curiosity-v3','web','KR','ko',false)).cards.gentleInvitation.hidden,true);
