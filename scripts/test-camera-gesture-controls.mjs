import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'assets/selah-gesture-classifier.js'), 'utf8');
const { GestureClassifier, handPose } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function hand(x, y, pose = 'open') {
  const points = Array.from({ length: 21 }, () => ({ x, y }));
  const shiftX = x - 0.5, shiftY = y - 0.5;
  const set = (index, px, py) => { points[index] = { x: px + shiftX, y: py + shiftY }; };
  set(0, 0.5, 0.85); set(5, 0.36, 0.56); set(6, 0.36, 0.39); set(8, 0.36, pose === 'open' ? 0.1 : 0.69);
  set(9, 0.5, 0.5); set(10, 0.5, 0.38); set(12, 0.5, pose === 'open' ? 0.08 : 0.7);
  set(13, 0.61, 0.56); set(14, 0.63, 0.42); set(16, 0.66, pose === 'open' ? 0.16 : 0.7);
  set(17, 0.69, 0.61); set(18, 0.72, 0.48); set(20, 0.75, pose === 'open' ? 0.22 : 0.72);
  return points;
}

function swipe(points, coords) {
  const classifier = new GestureClassifier();
  const actions = [];
  coords.forEach(([x, y, t]) => actions.push(...classifier.consume(hand(x, y), t)));
  return actions;
}

assert.equal(handPose(hand(0.5, 0.5, 'open')), 'open');
assert.equal(handPose(hand(0.5, 0.5, 'fist')), 'fist');
assert.ok(swipe(null, [[0.25, 0.5, 0], [0.25, 0.5, 150], [0.25, 0.5, 300], [0.35, 0.5, 400], [0.47, 0.5, 520]]).includes('next'));
assert.ok(swipe(null, [[0.65, 0.5, 0], [0.65, 0.5, 150], [0.65, 0.5, 300], [0.55, 0.5, 400], [0.43, 0.5, 520]]).includes('previous'));
assert.ok(swipe(null, [[0.5, 0.72, 0], [0.5, 0.72, 150], [0.5, 0.72, 300], [0.5, 0.6, 400], [0.5, 0.48, 520]]).includes('scrollUp'));
assert.ok(swipe(null, [[0.5, 0.28, 0], [0.5, 0.28, 150], [0.5, 0.28, 300], [0.5, 0.4, 400], [0.5, 0.52, 520]]).includes('scrollDown'));

const poseChanges = new GestureClassifier();
let poseActions = [];
for (const t of [0, 150, 300]) poseActions.push(...poseChanges.consume(hand(0.5, 0.5, 'fist'), t));
for (const t of [500, 650, 800]) poseActions.push(...poseChanges.consume(hand(0.5, 0.5, 'open'), t));
assert.ok(poseActions.includes('brighter'));
for (const t of [1000, 1150, 1300]) poseActions.push(...poseChanges.consume(hand(0.5, 0.5, 'fist'), t));
assert.ok(poseActions.includes('darker'));

const [html, runtime, worker, privacy, sceneDelegate, readerCss, controlCss, gestureCss] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'assets/selah-camera-gestures.js'), 'utf8'),
  readFile(resolve(root, 'assets/selah-camera-gesture-worker.js'), 'utf8'),
  readFile(resolve(root, 'privacy.html'), 'utf8'),
  readFile(resolve(root, 'mobile/ios/App/App/SceneDelegate.swift'), 'utf8'),
  readFile(resolve(root, 'assets/together-reading.css'), 'utf8'),
  readFile(resolve(root, 'styles/reader-controls.css'), 'utf8'),
  readFile(resolve(root, 'assets/selah-camera-gestures.css'), 'utf8')
]);
assert.match(html, /selahGestureToggle/);
assert.match(html, /iPhone 앱은 후면 카메라와 Apple Vision으로 손 한 개만 기기 안에서 분석/);
assert.match(html, /웹·Mac의 손동작 인식에 사용하는 MediaPipe는 성능·사용 통계를 Google로 보냅니다/);
assert.match(runtime, /getUserMedia/);
assert.match(runtime, /registerPlugin\('SelahHandCamera'\)/);
assert.match(runtime, /addListener\('landmarks'/);
assert.match(runtime, /frameRate: \{ ideal: 8, max: 10 \}/);
assert.match(runtime, /resizeWidth: 256, resizeHeight: 192/);
assert.match(runtime, /document\.visibilityState !== 'visible'/);
assert.match(runtime, /track\.stop\(\)/);
assert.match(runtime, /window\.Capacitor\?\.Plugins\?\.SelahBrightness/);
assert.match(runtime, /nativeBrightness\.setBrightness/);
assert.match(worker, /numHands: 1/);
assert.match(worker, /worker|self\.postMessage/);
assert.match(privacy, /On iPhone, the rear camera and Apple Vision analyze one hand’s joints on-device without showing a preview/);
assert.match(privacy, /MediaPipe, which sends performance and usage metrics to Google/);
assert.match(privacy, /On iPhone, hand gestures change system screen brightness/);
assert.match(sceneDelegate, /bridge\?\.registerPluginInstance\(SelahBrightnessPlugin\(\)\)/);
assert.match(sceneDelegate, /screen\.brightness = CGFloat\(level\)/);
assert.match(sceneDelegate, /AVCaptureDevice\.requestAccess\(for: \.video\)/);
assert.match(sceneDelegate, /VNDetectHumanHandPoseRequest\(\)/);
assert.match(sceneDelegate, /request\.maximumHandCount = 1/);
assert.match(sceneDelegate, /builtInWideAngleCamera, for: \.video, position: \.back/);
assert.match(readerCss, /reader-settings-collapsed \.passage-picker:has\(\.reader-gesture-menu\)\{display:flex!important\}/, 'camera control remains visible in collapsed focus reading');
assert.match(readerCss, /:not\(\.reader-gesture-menu\)\{display:none!important\}/, 'collapsed focus reading hides other settings while retaining camera control');
assert.match(controlCss, /\.reader-display-controls :is\(\.reader-gesture-menu, \.reader-notebook-toggle, \.reader-width-settings\)\s*\{\s*grid-column: 1 \/ -1;/, 'secondary reader controls span the mobile toolbar instead of wrapping into icon columns');
assert.match(gestureCss, /\.reader-gesture-panel\{position:static/, 'gesture help stays in document flow instead of covering Scripture');
console.log('PASS Selah camera gesture classification, user controls, local processing disclosure, and bounded capture settings');
