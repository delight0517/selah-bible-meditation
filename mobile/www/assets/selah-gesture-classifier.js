const MIRRORED = true;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function handPose(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) return 'unknown';
  const wrist = landmarks[0];
  const palm = Math.max(0.001, distance(wrist, landmarks[9]));
  const fingers = [[8, 6], [12, 10], [16, 14], [20, 18]];
  const extended = fingers.filter(([tip, joint]) => distance(landmarks[tip], wrist) > distance(landmarks[joint], wrist) * 1.14 && distance(landmarks[tip], wrist) > palm * 1.18).length;
  return extended >= 3 ? 'open' : extended <= 1 ? 'fist' : 'unknown';
}

export class GestureClassifier {
  constructor() { this.reset(); }
  reset() {
    this.anchor = null;
    this.motionFrames = [];
    this.poseCandidate = '';
    this.poseFrames = 0;
    this.stablePose = '';
    this.lastActionAt = -Infinity;
    this.motionSinceAnchor = false;
  }
  consume(landmarks, now) {
    if (!landmarks || landmarks.length < 21) { this.anchor = null; this.motionFrames = []; this.poseCandidate = ''; this.poseFrames = 0; this.stablePose = ''; return []; }
    const center = landmarks[9];
    const tips = [8, 12, 16, 20];
    const point = {
      x: MIRRORED ? 1 - (tips.reduce((sum, index) => sum + landmarks[index].x, 0) / tips.length - center.x) : tips.reduce((sum, index) => sum + landmarks[index].x, 0) / tips.length - center.x,
      y: tips.reduce((sum, index) => sum + landmarks[index].y, 0) / tips.length - center.y
    };
    const palm = { x: MIRRORED ? 1 - center.x : center.x, y: center.y };
    const rawPose = handPose(landmarks);
    if (rawPose === this.poseCandidate) this.poseFrames += 1;
    else { this.poseCandidate = rawPose; this.poseFrames = 1; }
    const previousPose = this.stablePose;
    if (!this.stablePose && rawPose !== 'unknown') this.stablePose = rawPose;
    else if (this.poseFrames >= 3 && rawPose !== 'unknown') this.stablePose = rawPose;
    const actions = [];
    if (previousPose === 'fist' && this.stablePose === 'open') this.motionFrames = [];
    if (!this.anchor) this.anchor = { ...palm, at: now };
    const dx = palm.x - this.anchor.x, dy = palm.y - this.anchor.y;
    if (Math.hypot(dx, dy) >= 0.095) this.motionSinceAnchor = true;
    const elapsed = now - this.anchor.at;
    this.motionFrames.push({ point, palm, pose: rawPose, at: now });
    if (this.motionFrames.length > 5) this.motionFrames.shift();
    if (now - this.lastActionAt >= 850 && rawPose === 'open' && this.stablePose === 'open' && previousPose !== 'fist') {
      for (const sample of this.motionFrames.slice(0, -1).slice(-4)) {
        const duration = now - sample.at;
        if (sample.pose !== 'open' || duration < 300 || duration > 650) continue;
        const moveX = point.x - sample.point.x, moveY = point.y - sample.point.y;
        const distance = Math.hypot(moveX, moveY);
        if (distance < 0.12 || distance / (duration / 1000) < 0.45) continue;
        const previous = this.motionFrames.at(-2);
        if (previous && (now - previous.at) <= 220) {
          const lastX = point.x - previous.point.x, lastY = point.y - previous.point.y;
          if ((Math.abs(moveX) > Math.abs(moveY) * 1.5 ? moveX * lastX : moveY * lastY) < -0.012) continue;
        }
        if (Math.abs(moveX) > Math.abs(moveY) * 1.5) actions.push(moveX < 0 ? 'next' : 'previous');
        else if (Math.abs(moveY) > 0.12) actions.push(moveY < 0 ? 'scrollUp' : 'scrollDown');
        if (actions.length) break;
      }
      if (actions.length) { this.lastActionAt = now; this.anchor = { ...palm, at: now }; this.motionSinceAnchor = false; this.motionFrames = [{ point, palm, pose: rawPose, at: now }]; }
    }
    if (!actions.length && now - this.lastActionAt >= 450 && !this.motionSinceAnchor && this.stablePose !== previousPose) {
      if (previousPose === 'fist' && this.stablePose === 'open') actions.push('brighter');
      if (previousPose === 'open' && this.stablePose === 'fist') actions.push('darker');
      if (actions.length) this.lastActionAt = now;
    }
    if (elapsed > 1300 && !actions.length) { this.anchor = { ...palm, at: now }; this.motionSinceAnchor = false; }
    return actions;
  }
}
