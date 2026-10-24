import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageRoot, '..');
const outputRoot = join(packageRoot, 'dist');
const sdkRoot = join(packageRoot, 'node_modules/@mediapipe/tasks-vision');
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const modelSha256 = 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1';
const modelPath = join(packageRoot, 'model-cache/hand_landmarker.task');

async function verifiedModel() {
  let bytes;
  try { bytes = await readFile(modelPath); }
  catch {
    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error(`Hand landmark model download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== modelSha256) throw new Error(`Hand landmark model checksum mismatch: ${hash}`);
  return bytes;
}

const model = await verifiedModel();
const sourceFiles = ['background.js', 'content.js', 'camera.html', 'camera.css', 'camera.js'];
const wasmFiles = await (await import('node:fs/promises')).readdir(join(sdkRoot, 'wasm'));
const neededWasm = wasmFiles.filter(name => /\.(?:wasm|js|data)$/.test(name));
if (!neededWasm.length) throw new Error('MediaPipe WASM assets are missing; run npm ci first.');

const manifests = {
  chrome: {
    manifest_version: 3, name: 'Selah Gesture Navigation', version: '0.1.0',
    description: 'Use hand swipes to scroll and navigate reading pages on the active website.',
    minimum_chrome_version: '121', permissions: ['activeTab', 'scripting'],
    background: { service_worker: 'background.js' }, action: { default_title: 'Open Selah Gesture Navigation' },
    content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'" }
  },
  firefox: {
    manifest_version: 3, name: 'Selah Gesture Navigation', version: '0.1.0',
    description: 'Use hand swipes to scroll and navigate reading pages on the active website.',
    browser_specific_settings: { gecko: { id: 'selah-gesture-navigation@selah.app', strict_min_version: '121.0' } },
    permissions: ['activeTab', 'scripting'],
    background: { scripts: ['background.js'], service_worker: 'background.js', type: 'module' },
    action: { default_title: 'Open Selah Gesture Navigation' },
    content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'" }
  }
};

await rm(outputRoot, { recursive: true, force: true });
for (const [browser, manifest] of Object.entries(manifests)) {
  const output = join(outputRoot, browser);
  await mkdir(join(output, 'vendor/wasm'), { recursive: true });
  for (const file of sourceFiles) await cp(join(packageRoot, 'src', file), join(output, file));
  await cp(join(repoRoot, 'assets/selah-gesture-classifier.js'), join(output, 'selah-gesture-classifier.js'));
  await cp(join(repoRoot, 'assets/selah-camera-gesture-worker.js'), join(output, 'selah-camera-gesture-worker.js'));
  await cp(join(sdkRoot, 'vision_bundle.mjs'), join(output, 'vendor/vision_bundle.mjs'));
  for (const file of neededWasm) await cp(join(sdkRoot, 'wasm', file), join(output, 'vendor/wasm', file));
  await writeFile(join(output, 'vendor/hand_landmarker.task'), model);
  await cp(join(packageRoot, 'APACHE-2.0.txt'), join(output, 'THIRD_PARTY_LICENSE-MEDIAPIPE.txt'));
  await cp(join(packageRoot, 'THIRD_PARTY_NOTICES.md'), join(output, 'THIRD_PARTY_NOTICES.md'));
  await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(`Built local-only Chromium and Gecko extension packages; model SHA-256 ${modelSha256}.`);
