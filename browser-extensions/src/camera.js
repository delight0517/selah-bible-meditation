const api = globalThis.browser || globalThis.chrome;
const params = new URLSearchParams(location.search);
const targetTabId = Number(params.get('tabId'));
const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('landmarks'), context = canvas.getContext('2d');
const startButton = $('start'), stopButton = $('stop'), status = $('status'), verdict = $('verdict');
const previewPlaceholder = $('cameraPlaceholder'), mode = $('mode');
let stream, worker, classifier, timer, inFlight = false;

if (params.has('unsupported') || !Number.isInteger(targetTabId) || targetTabId < 0) {
  status.textContent = '현재 탭에는 확장 프로그램을 적용할 수 없어요. 일반 웹 페이지에서 다시 눌러 주세요.';
  startButton.disabled = true;
}

function stop(message = '카메라 꺼짐') {
  clearTimeout(timer);
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  worker?.terminate();
  worker = null;
  inFlight = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  video.srcObject = null;
  video.hidden = true;
  canvas.hidden = true;
  previewPlaceholder.hidden = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  status.textContent = message;
}

function scheduleFrame() {
  timer = setTimeout(async () => {
    if (!stream || !worker || inFlight) return scheduleFrame();
    inFlight = true;
    try {
      const bitmap = await createImageBitmap(video);
      worker.postMessage({ type: 'frame', timestamp: performance.now(), bitmap }, [bitmap]);
    } catch {
      inFlight = false;
      stop('카메라 프레임을 읽지 못했어요. 다시 시작해 주세요.');
      return;
    }
  }, 143);
}

function draw(landmarks) {
  if (!landmarks?.length) { context.clearRect(0, 0, canvas.width, canvas.height); return; }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#a8f0b6';
  context.fillStyle = '#fff4b0';
  context.lineWidth = Math.max(2, canvas.width / 150);
  const chains = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
  for (const chain of chains) {
    context.beginPath();
    chain.forEach((index, position) => { const p = landmarks[index]; if (!p) return; if (!position) context.moveTo(p.x * canvas.width, p.y * canvas.height); else context.lineTo(p.x * canvas.width, p.y * canvas.height); });
    context.stroke();
  }
  for (const p of landmarks) { context.beginPath(); context.arc(p.x * canvas.width, p.y * canvas.height, context.lineWidth * 1.5, 0, Math.PI * 2); context.fill(); }
}

async function applyGesture(action) {
  const result = await api.tabs.sendMessage(targetTabId, { type: 'selah-gesture', action, mode: mode.value });
  verdict.textContent = action === 'next' ? '왼쪽 스와이프 · 다음' : action === 'previous' ? '오른쪽 스와이프 · 이전' : action === 'scrollUp' ? '위쪽 스와이프 · 위로 이동' : '아래쪽 스와이프 · 아래로 이동';
  status.textContent = result?.status || '페이지에 동작을 보냈어요.';
}

async function start() {
  if (!Number.isInteger(targetTabId) || targetTabId < 0) return;
  startButton.disabled = true;
  status.textContent = '카메라 권한을 기다리는 중…';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 256, max: 256 }, height: { ideal: 192, max: 192 }, frameRate: { ideal: 7, max: 7 } } });
    video.srcObject = stream;
    video.hidden = false;
    canvas.hidden = false;
    previewPlaceholder.hidden = true;
    await video.play();
    const { GestureClassifier } = await import('./selah-gesture-classifier.js');
    classifier = new GestureClassifier();
    worker = new Worker(new URL('./selah-camera-gesture-worker.js', import.meta.url));
    worker.onmessage = async event => {
      const message = event.data || {};
      if (message.type === 'ready') { status.textContent = '카메라 켜짐 · 손을 보여 주세요.'; scheduleFrame(); }
      if (message.type === 'landmarks') {
        inFlight = false;
        draw(message.landmarks);
        for (const action of classifier.consume(message.landmarks, message.timestamp)) {
          if (!['next', 'previous', 'scrollUp', 'scrollDown'].includes(action)) continue;
          try { await applyGesture(action); }
          catch { status.textContent = '페이지가 바뀌었거나 제스처 권한이 끝났어요. 확장 버튼을 다시 눌러 주세요.'; stop(status.textContent); return; }
        }
        scheduleFrame();
      }
      if (message.type === 'error') stop(`손 추적을 시작하지 못했어요: ${message.message}`);
    };
    worker.onerror = () => stop('손 추적 모듈을 시작하지 못했어요. 확장을 다시 설치해 주세요.');
    worker.postMessage({ type: 'load', sdkUrl: api.runtime.getURL('vendor/vision_bundle.mjs'), wasmUrl: api.runtime.getURL('vendor/wasm/'), modelUrl: api.runtime.getURL('vendor/hand_landmarker.task') });
    stopButton.disabled = false;
  } catch (error) {
    stop(error?.name === 'NotAllowedError' ? '카메라 권한이 허용되지 않았어요. 브라우저 권한을 확인해 주세요.' : `카메라를 시작하지 못했어요: ${error?.message || '다시 시도해 주세요.'}`);
  }
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', () => stop());
window.addEventListener('pagehide', () => stop());
