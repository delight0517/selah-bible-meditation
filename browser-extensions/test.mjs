import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('.', import.meta.url));
const scripts = await readFile(join(root, 'src/content.js'), 'utf8');
assert.match(scripts, /webext\.runtime\.onMessage/);
const built = join(root, 'dist');
for (const name of ['chrome', 'firefox']) {
  const dir = join(built, name), manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting']);
  assert.equal(manifest.host_permissions, undefined);
  for (const file of ['camera.html', 'camera.js', 'content.js', 'background.js', 'selah-gesture-classifier.js', 'selah-camera-gesture-worker.js', 'vendor/vision_bundle.mjs', 'vendor/hand_landmarker.task', 'THIRD_PARTY_LICENSE-MEDIAPIPE.txt', 'THIRD_PARTY_NOTICES.md']) await stat(join(dir, file));
  assert.equal((await readdir(join(dir, 'vendor/wasm'))).some(file => file.endsWith('.wasm')), true);
  const worker = await readFile(join(dir, 'selah-camera-gesture-worker.js'), 'utf8');
  const camera = await readFile(join(dir, 'camera.js'), 'utf8');
  assert.match(camera, /new Worker\(new URL\('\.\/selah-camera-gesture-worker\.js', import\.meta\.url\)\)/, `${name} must use a classic MediaPipe worker`);
  assert.doesNotMatch(worker, /https?:\/\//, 'built extension worker must not load remote code or model files');
}

let messageHandler, clicked = 0, scrolled;
const button = { disabled: false, rel: '', title: '', innerText: '다음 장', value: '', getAttribute: () => null, getBoundingClientRect: () => ({ width: 60, height: 30 }), click: () => clicked++ };
const scroller = { scrollHeight: 900, clientHeight: 600, scrollWidth: 600, clientWidth: 600, scrollBy: value => { scrolled = value; } };
const page = { querySelectorAll: () => [button], elementsFromPoint: () => [scroller], scrollingElement: scroller };
const browserApi = { runtime: { onMessage: { addListener: callback => { messageHandler = callback; } } } };
const context = { document: page, innerWidth: 800, innerHeight: 600, getComputedStyle: () => ({ visibility: 'visible', display: 'block', overflowY: 'auto', overflowX: 'hidden' }), browser: browserApi };
context.globalThis = context;
vm.runInNewContext(scripts, context);
let response;
messageHandler({ type: 'selah-gesture', action: 'next', mode: 'buttons' }, {}, value => { response = value; });
assert.equal(clicked, 1);
assert.match(response.status, /다음 페이지/);
button.innerText = 'Previous chapter';
messageHandler({ type: 'selah-gesture', action: 'previous', mode: 'buttons' }, {}, value => { response = value; });
assert.equal(clicked, 2);
assert.match(response.status, /이전 페이지/);
button.innerText = '읽기';
messageHandler({ type: 'selah-gesture', action: 'scrollUp', mode: 'buttons' }, {}, value => { response = value; });
assert.equal(scrolled.top, -390);
assert.match(response.status, /위로/);
console.log('PASS extension packages, minimal permissions, bundled local ML assets, Korean/English page controls, and smooth scroll commands');
