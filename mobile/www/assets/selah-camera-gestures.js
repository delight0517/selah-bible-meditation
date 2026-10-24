import { GestureClassifier } from './selah-gesture-classifier.js?v=12';
const STORAGE_KEY = 'selah.cameraGesture.brightness.v1';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function readerVisible() {
  const reader = window.SelahTogetherBridge?.reader?.() || document.querySelector('#meditation.active #meditationVerse') || document.getElementById('verseText');
  return reader && reader.getClientRects().length && reader.clientHeight > 0 ? reader : null;
}

function setStatus(text, active = false) {
  const status = document.getElementById('selahGestureStatus');
  const button = document.getElementById('selahGestureToggle');
  if (!status || !button) return;
  status.textContent = text;
  status.hidden = false;
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? '손동작 끄기' : '손동작 켜기';
  button.classList.toggle('is-active', active);
}

const brightnessOverlay = document.createElement('div');
brightnessOverlay.id = 'selahBrightnessOverlay';
brightnessOverlay.setAttribute('aria-hidden', 'true');
document.body.append(brightnessOverlay);
let brightness = clamp(Number(localStorage.getItem(STORAGE_KEY)) || 1, 0.7, 1.3);
let forceOverlayBrightness = false;
function applyBrightness() {
  brightnessOverlay.hidden = !!window.Capacitor?.Plugins?.SelahBrightness && !forceOverlayBrightness;
  if (brightnessOverlay.hidden) return;
  const amount = Math.abs(brightness - 1);
  brightnessOverlay.style.backgroundColor = brightness > 1
    ? `rgba(255,255,255,${Math.min(0.28, amount * 0.85)})`
    : `rgba(0,0,0,${Math.min(0.35, amount * 0.9)})`;
}
applyBrightness();

let active = false, stream = null, video = null, worker = null, frameTimer = 0, inFlight = false;
let replayURL = null, decisionCount = 0, resetCount = 0;
let nativeCamera = null, nativeCameraListener = null, nativeCameraErrorListener = null;
const classifier = new GestureClassifier();
let lastFeedbackText = '';
function trackingStatus() {
  const phase = classifier.phase;
  const readiness = phase === 'waiting-for-hide' ? '손을 화면 밖으로 0.5초 숨기면 자동 재설정돼요.'
    : phase === 'resetting' ? `자동 재설정 중 · ${Math.ceil(classifier.resetRemainingMs / 100) / 10}초 남음`
    : phase === 'rearmed' ? '자동 재설정 완료 · 손을 다시 보여 주세요.'
    : phase === 'tracking' ? '다음 동작 준비 완료'
    : '손을 화면에 보여 주세요.';
  setStatus(`판정 ${decisionCount}회 · 자동 재설정 ${resetCount}회 · ${lastFeedbackText ? `마지막 판정: ${lastFeedbackText} · ` : ''}${readiness}`, true);
}
function showFeedback(text) { lastFeedbackText = text; if (active) trackingStatus(); }
function consumeCameraFrame(landmarks, timestamp) {
  if (!active) return;
  const previousPhase = classifier.phase;
  for (const action of classifier.consume(landmarks, timestamp)) { decisionCount += 1; feedback(action); }
  if (classifier.phase === 'rearmed' && previousPhase !== 'rearmed') resetCount += 1;
  trackingStatus();
}

function feedback(action) {
  if (action === 'next' || action === 'previous') {
    window.navigateBibleChapter?.(action === 'next' ? 1 : -1);
    showFeedback(action === 'next' ? '← 왼쪽 · 다음 장' : '→ 오른쪽 · 이전 장');
  } else if (action === 'scrollUp' || action === 'scrollDown') {
    const reader = readerVisible();
    reader?.scrollBy({ top: (action === 'scrollUp' ? -1 : 1) * Math.max(120, reader.clientHeight * 0.65), behavior: 'smooth' });
    showFeedback(action === 'scrollUp' ? '↑ 위쪽 스크롤' : '↓ 아래쪽 스크롤');
  } else if (action === 'brighter' || action === 'darker') {
    void adjustBrightness(action);
  }
}

async function adjustBrightness(action) {
  const delta = action === 'brighter' ? 0.1 : -0.1;
  const nativeBrightness = window.Capacitor?.Plugins?.SelahBrightness;
  if (nativeBrightness) {
    try {
      const current = await nativeBrightness.getBrightness();
      const result = await nativeBrightness.setBrightness({ level: clamp(Number(current.level) + delta, 0.05, 1) });
      brightness = Number(result.level);
      showFeedback(action === 'brighter' ? '기기 화면 밝게' : '기기 화면 어둡게');
      return;
    } catch {
      forceOverlayBrightness = true;
      setStatus('기기 밝기를 바꾸지 못해 읽기 화면 밝기로 조절했어요.', true);
      applyBrightness();
    }
  }
    brightness = clamp(brightness + (action === 'brighter' ? 0.12 : -0.12), 0.7, 1.3);
    localStorage.setItem(STORAGE_KEY, String(brightness));
    applyBrightness();
    showFeedback(action === 'brighter' ? '화면 밝게' : '화면 어둡게');
}

function stop(message = '카메라 꺼짐') {
  active = false;
  clearTimeout(frameTimer); frameTimer = 0; inFlight = false;
  worker?.terminate(); worker = null;
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  video?.pause(); video?.remove(); video = null;
  if (replayURL) { URL.revokeObjectURL(replayURL); replayURL = null; }
  nativeCameraListener?.remove(); nativeCameraListener = null;
  nativeCameraErrorListener?.remove(); nativeCameraErrorListener = null;
  if (nativeCamera) void nativeCamera.stop().catch(() => {});
  classifier.reset();
  setStatus(message, false);
}

async function start(file = null) {
  if (active) { stop(); return; }
  if (!readerVisible()) { setStatus('말씀 읽기를 연 뒤 켜 주세요.'); return; }
  const nativeIOS = window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === 'ios';
  if (!(nativeIOS && !file) && ((!file && !navigator.mediaDevices?.getUserMedia) || typeof Worker === 'undefined' || typeof createImageBitmap !== 'function')) {
    setStatus('이 브라우저에서는 카메라 손동작을 사용할 수 없어요.'); return;
  }
  active = true;
  lastFeedbackText = ''; decisionCount = 0; resetCount = 0;
  setStatus(file ? '영상 인식 준비 중…' : '카메라 권한을 기다리는 중…', true);
  try {
    if (nativeIOS && !file) {
      nativeCamera ??= window.Capacitor.registerPlugin('SelahHandCamera');
      nativeCameraListener = await nativeCamera.addListener('landmarks', event => {
        consumeCameraFrame(event.landmarks, event.timestamp);
      });
      nativeCameraErrorListener = await nativeCamera.addListener('cameraError', event => {
        setStatus(`손동작을 읽지 못했어요: ${event.message || '다시 시도해 주세요.'}`, true);
      });
      setStatus('후면 카메라로 손 한 개를 찾는 중…', true);
      await nativeCamera.start();
      if (!active) { await nativeCamera.stop(); return; }
      setStatus('카메라 켜짐 · 화면에는 영상 없이 손 한 개만 기기에서 인식해요.', true);
      return;
    }
    if (!file) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 8 } }
        });
      } catch (error) {
        if (error?.name !== 'OverconstrainedError' && !/invalid constraint/i.test(error?.message || '')) throw error;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }
    }
    if (!active) { stream.getTracks().forEach(track => track.stop()); stream = null; return; }
    video = document.createElement('video');
    video.autoplay = true; video.muted = true; video.playsInline = true;
    video.setAttribute('aria-hidden', 'true'); video.className = 'selah-gesture-camera-source';
    if (file) {
      replayURL = URL.createObjectURL(file); video.src = replayURL;
      video.addEventListener('ended', () => stop(`영상 테스트 완료 · 판정 ${decisionCount}회 · 자동 재설정 ${resetCount}회${lastFeedbackText ? ` · 마지막 판정: ${lastFeedbackText}` : ''}`), { once: true });
    } else video.srcObject = stream;
    document.body.append(video);
    await video.play();
    if (file) { video.pause(); video.currentTime = 0; }
    if (!active) { stop(); return; }
    worker = new Worker(new URL('./selah-camera-gesture-worker.js', import.meta.url));
    worker.onmessage = event => {
      const message = event.data || {};
      if (message.type === 'ready') {
        setStatus('인식 준비 완료 · 손을 화면에 보여 주세요.', true);
        if (replayURL) {
          video.currentTime = 0;
          void video.play().then(scheduleFrame).catch(() => stop('영상을 재생하지 못했어요.'));
        } else scheduleFrame();
      } else if (message.type === 'landmarks') {
        inFlight = false;
        consumeCameraFrame(message.landmarks, message.timestamp);
      } else if (message.type === 'error') {
        stop(`손동작 인식 오류: ${message.message}`);
      }
    };
    worker.onerror = () => stop('손동작 모델을 불러오지 못했어요. 네트워크를 확인해 주세요.');
    worker.postMessage({
      type: 'load',
      sdkUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs',
      wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm',
      modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
    });
  } catch (error) {
    stop(error?.name === 'NotAllowedError' ? '카메라 접근이 거부됐어요. 기기 설정에서 권한을 허용해 주세요.' : `카메라를 시작하지 못했어요: ${error?.message || '다시 시도해 주세요.'}`);
  }
}

function scheduleFrame() {
  clearTimeout(frameTimer);
  if (!active || !worker || !video || document.visibilityState !== 'visible') return;
  frameTimer = setTimeout(async () => {
    if (!readerVisible()) { stop('읽기 화면을 벗어나 카메라를 껐어요.'); return; }
    if (!active || inFlight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) { scheduleFrame(); return; }
    inFlight = true;
    try {
      const bitmap = await createImageBitmap(video, { resizeWidth: 256, resizeHeight: 192 });
      if (!active || !worker) { bitmap.close(); inFlight = false; return; }
      worker.postMessage({ type: 'frame', bitmap, timestamp: performance.now() }, [bitmap]);
    } catch { inFlight = false; }
    scheduleFrame();
  }, 150);
}

document.getElementById('selahGestureToggle')?.addEventListener('click', () => {
  if (active) { stop(); return; }
  const dialog = document.getElementById('selahGestureConsent');
  if (!localStorage.getItem('selah.cameraGesture.consent.v1') && dialog?.showModal) dialog.showModal();
  else start();
});
document.getElementById('selahGestureCancel')?.addEventListener('click', () => document.getElementById('selahGestureConsent')?.close());
document.getElementById('selahGestureContinue')?.addEventListener('click', async () => {
  localStorage.setItem('selah.cameraGesture.consent.v1', '1');
  document.getElementById('selahGestureConsent')?.close();
  await start();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible' && active) stop('앱이 백그라운드로 가서 카메라를 껐어요.'); });
window.addEventListener('selah-mac-app-activity', () => {
  if (active && window.selahMacAppPresence?.active === false) stop('Selah이 비활성화되어 카메라를 껐어요.');
});
window.addEventListener('pagehide', () => { if (active) stop(); }, { once: true });

document.getElementById('selahGestureReplay')?.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (active) stop();
  void start(file);
  event.target.value = '';
});
