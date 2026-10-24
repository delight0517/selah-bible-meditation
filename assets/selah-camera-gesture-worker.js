let landmarker;
let lastTimestamp = 0;

self.onmessage = async event => {
  const message = event.data || {};
  if (message.type === 'load') {
    try {
      const { FilesetResolver, HandLandmarker } = await import(message.sdkUrl);
      const vision = await FilesetResolver.forVisionTasks(message.wasmUrl);
      const options = {
        baseOptions: { modelAssetPath: message.modelUrl, delegate: 'GPU' },
        runningMode: 'VIDEO', numHands: 1,
        minHandDetectionConfidence: 0.62,
        minHandPresenceConfidence: 0.62,
        minTrackingConfidence: 0.62
      };
      try { landmarker = await HandLandmarker.createFromOptions(vision, options); }
      catch { landmarker = await HandLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' } }); }
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', message: error?.message || '손동작 인식 모델을 불러오지 못했어요.' });
    }
    return;
  }
  if (message.type === 'frame' && landmarker && message.bitmap) {
    try {
      const timestamp = Math.max(Number(message.timestamp) || 0, lastTimestamp + 1);
      lastTimestamp = timestamp;
      const result = landmarker.detectForVideo(message.bitmap, timestamp);
      self.postMessage({ type: 'landmarks', landmarks: result.landmarks?.[0] || null, timestamp });
    } catch (error) {
      self.postMessage({ type: 'error', message: error?.message || '손동작을 읽지 못했어요.' });
    } finally {
      message.bitmap.close?.();
    }
  }
};
