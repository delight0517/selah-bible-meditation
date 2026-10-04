import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const helper=lines.find(l=>l.startsWith('function normalizeForestRegions('));
const names=lines.find(l=>l.startsWith('const forestUSRegions='));
const layout=lines.find(l=>l.startsWith('const forestUSLayout='));
const render=lines.find(l=>l.startsWith('if(us){'));
assert.ok(helper&&names&&layout&&render);
for(const data of [{'us-ok':6,'us-az':4},{'US-OK':6,'US-AZ':4}]){
 const node={setAttribute(){},innerHTML:''}; const ctx={us:true,$:()=>node,copy:{countryVisits:'visits'},locale:'en-US',esc:s=>String(s)};
 vm.createContext(ctx); vm.runInContext(helper+names+layout+'\nconst regions=normalizeForestRegions('+JSON.stringify(data)+');\n'+render,ctx);
 assert.match(node.innerHTML,/Oklahoma · 6 visits/); assert.match(node.innerHTML,/Arizona · 4 visits/); assert.match(node.innerHTML,/California · 0 visits/);
 assert.equal((node.innerHTML.match(/role="listitem"/g)||[]).length,51);
}
console.log('US state count rendering: lowercase/uppercase API keys, nonzero counts, zero states and 51 tiles passed');
