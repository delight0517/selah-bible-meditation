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
  const [startX, startY] = coords[0];
  coords.forEach(([x, y, t]) => {
    const landmarks = hand(x, y);
    for (const joint of [6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20]) {
      landmarks[joint].x += (x - startX) * 1.25;
      landmarks[joint].y += (y - startY) * 1.25;
    }
    actions.push(...classifier.consume(landmarks, t));
  });
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
for (const t of [850, 1050, 1350]) poseChanges.consume(null, t);
for (const t of [1400, 1550, 1700]) poseChanges.consume(hand(0.5, 0.5, 'open'), t);
for (const t of [1900, 2050, 2200]) poseActions.push(...poseChanges.consume(hand(0.5, 0.5, 'fist'), t));
assert.ok(poseActions.includes('darker'));

if (process.env.SELAH_VISION_POSES) {
  const replay = (await readFile(process.env.SELAH_VISION_POSES, 'utf8')).trim().split(/\r?\n/).find(line => line.startsWith('['));
  assert.ok(replay, 'Vision replay JSON array is missing');
  const expected = { 'up.MOV': 'scrollUp', 'darker.MOV': 'darker', 'scroll down.MOV': 'scrollDown', 'scroll left.MOV': 'next', 'scroll right.MOV': 'previous', 'scroll up.MOV': 'scrollUp', 'scrollup.MOV': 'scrollUp', 'brighter.MOV': 'brighter' };
  for (const clip of JSON.parse(replay)) {
    const classifier = new GestureClassifier(), actions = [];
    clip.frames.forEach((frame, index) => {
      if (frame.landmarks) actions.push(...classifier.consume(frame.landmarks.map(point => ({ x: 1 - point.x, y: point.y })), index * 140));
    });
    assert.ok(actions.includes(expected[clip.name]), `${clip.name} did not produce ${expected[clip.name]}`);
  }
  console.log(`PASS Apple Vision labeled-video replay (${Object.keys(expected).length} clips)`);
}

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
assert.match(runtime, /frameRate: \{ ideal: 8 \}/);
assert.match(runtime, /resizeWidth: 256, resizeHeight: 192/);
assert.match(runtime, /new Worker\(new URL\('\.\/selah-camera-gesture-worker\.js', import\.meta\.url\)\)/, 'MediaPipe WASM loader needs a classic worker so importScripts exposes ModuleFactory globally');
assert.match(runtime, /document\.visibilityState !== 'visible'/);
assert.match(runtime, /track\.stop\(\)/);
assert.match(runtime, /window\.Capacitor\?\.Plugins\?\.SelahBrightness/);
assert.match(runtime, /nativeBrightness\.setBrightness/);
assert.match(worker, /numHands: 1/);
assert.match(worker, /baseOptions: \{ modelAssetPath: message\.modelUrl, delegate: 'CPU' \}/);
assert.equal((worker.match(/HandLandmarker\.createFromOptions/g) || []).length, 1, 'worker initializes MediaPipe once so failed GPU setup cannot consume the module factory before fallback');
assert.match(worker, /worker|self\.postMessage/);
assert.match(privacy, /On iPhone, the rear camera and Apple Vision analyze one hand’s joints on-device without showing a preview/);
assert.match(privacy, /MediaPipe, which sends performance and usage metrics to Google/);
assert.match(privacy, /On iPhone, hand gestures change system screen brightness/);
assert.match(sceneDelegate, /bridge\?\.registerPluginInstance\(SelahBrightnessPlugin\(\)\)/);
assert.match(sceneDelegate, /screen\.brightness = CGFloat\(level\)/);
assert.match(sceneDelegate, /AVCaptureDevice\.requestAccess\(for: \.video\)/);
assert.match(sceneDelegate, /VNDetectHumanHandPoseRequest\(\)/);
assert.match(sceneDelegate, /result\.append\(\["x": point\.location\.x, "y": 1 - point\.location\.y\]\)/, 'iOS x coordinates are mirrored once by the shared classifier');
assert.match(sceneDelegate, /request\.maximumHandCount = 1/);
assert.match(sceneDelegate, /builtInWideAngleCamera, for: \.video, position: \.back/);
assert.match(readerCss, /reader-settings-collapsed \.passage-picker:has\(\.reader-gesture-menu\)\{display:flex!important\}/, 'camera control remains visible in collapsed focus reading');
assert.match(readerCss, /:not\(\.reader-gesture-menu\)\{display:none!important\}/, 'collapsed focus reading hides other settings while retaining camera control');
assert.match(controlCss, /\.reader-display-controls :is\(\.reader-gesture-menu, \.reader-notebook-toggle, \.reader-width-settings\)\s*\{\s*grid-column: 1 \/ -1;/, 'secondary reader controls span the mobile toolbar instead of wrapping into icon columns');
assert.match(gestureCss, /\.reader-gesture-panel\{position:static/, 'gesture help stays in document flow instead of covering Scripture');
assert.match(html, /SelahPageTransition\.run/);
assert.match(html, /preloadAdjacentBibleChapters\(\)/);
assert.match(runtime, /action === 'scrollUp' \? -1 : 1/, 'hand swipe direction matches reader scroll direction');
console.log('PASS Selah camera gesture classification, user controls, local processing disclosure, and bounded capture settings');

const macSource = await readFile(resolve(root, 'macos/Sources/SelahApp.swift'), 'utf8');
assert.match(macSource, /runOpenPanelWith parameters: WKOpenPanelParameters/);
assert.match(macSource, /panel.allowsMultipleSelection = parameters.allowsMultipleSelection/);

assert.match(html, /selah-camera-gestures\.js\?v=126/, 'installed WKWebView refreshes the camera runtime after a hosted update');

assert.match(macSource, /AVCaptureDevice.authorizationStatus\(for: \.video\)/);
assert.match(macSource, /AVCaptureDevice.requestAccess\(for: \.video\)/);
assert.match(macSource, /decisionHandler\(granted \? \.grant : \.deny\)/);
