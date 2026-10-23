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
    this.poseCandidate = '';
    this.poseFrames = 0;
    this.stablePose = '';
    this.lastActionAt = -Infinity;
    this.motionSinceAnchor = false;
  }
  consume(landmarks, now) {
    if (!landmarks || landmarks.length < 21) { this.anchor = null; this.poseCandidate = ''; this.poseFrames = 0; return []; }
    const center = landmarks[9];
    const point = { x: MIRRORED ? 1 - center.x : center.x, y: center.y };
    const rawPose = handPose(landmarks);
    if (rawPose === this.poseCandidate) this.poseFrames += 1;
    else { this.poseCandidate = rawPose; this.poseFrames = 1; }
    const previousPose = this.stablePose;
    if (this.poseFrames >= 3 && rawPose !== 'unknown') this.stablePose = rawPose;
    const actions = [];
    if (!this.anchor) this.anchor = { ...point, at: now };
    const dx = point.x - this.anchor.x, dy = point.y - this.anchor.y;
    if (Math.hypot(dx, dy) >= 0.095) this.motionSinceAnchor = true;
    const elapsed = now - this.anchor.at;
    if (now - this.lastActionAt >= 850 && elapsed >= 170 && elapsed <= 1300 && this.stablePose === 'open') {
      if (Math.abs(dx) >= 0.18 && Math.abs(dx) > Math.abs(dy) * 1.35) actions.push(dx < 0 ? 'next' : 'previous');
      else if (Math.abs(dy) >= 0.18 && Math.abs(dy) > Math.abs(dx) * 1.35) actions.push(dy < 0 ? 'scrollUp' : 'scrollDown');
      if (actions.length) { this.lastActionAt = now; this.anchor = { ...point, at: now }; this.motionSinceAnchor = false; }
    }
    if (!actions.length && now - this.lastActionAt >= 450 && !this.motionSinceAnchor && this.stablePose !== previousPose) {
      if (previousPose === 'fist' && this.stablePose === 'open') actions.push('brighter');
      if (previousPose === 'open' && this.stablePose === 'fist') actions.push('darker');
      if (actions.length) this.lastActionAt = now;
    }
    if (elapsed > 1300 && !actions.length) { this.anchor = { ...point, at: now }; this.motionSinceAnchor = false; }
    return actions;
  }
}
