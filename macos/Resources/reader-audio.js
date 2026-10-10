(() => {
  const player = document.getElementById("bibleAudioPlayer");
  const quick = document.getElementById("readerAudioPrimary");
  const focusQuick = document.getElementById("readerAudioFocusPlay");
  const panel = document.getElementById("bibleAudioPanel");
  if (!player || !quick || !focusQuick || !panel) return;

  // A fixed player still disappears inside closed details or focus-mode hidden settings.
  document.body.append(player);
  const follow = document.getElementById("bibleAudioFollowControls");
  if (follow) player.append(follow);
  const status = document.getElementById("youtubeAudioSearchStatus");
  if (status) quick.after(status);

  const playbackStatus = document.createElement("p");
  playbackStatus.className = "note";
  playbackStatus.setAttribute("role", "status");
  player.append(playbackStatus);
  let playbackToken = "";
  window.addEventListener("message", event => {
    const frame = document.getElementById("bibleAudioPlayerFrame");
    if (!frame || event.source !== frame.contentWindow ||
        event.origin !== "https://delight0517.github.io" ||
        event.data?.channel !== "selah-youtube-player" ||
        event.data.token !== frame.dataset.playerToken) return;
    const data = event.data;
    const korean = document.documentElement.lang.startsWith("ko");
    if (data.type === "ready") playbackStatus.textContent = korean ? "재생 준비 완료" : "Ready to play";
    if (data.type === "error") playbackStatus.textContent = korean ? "오디오를 재생할 수 없습니다. YouTube에서 열기로 확인해 주세요." : "Audio unavailable. Check this video using Open in YouTube.";
    if (data.type === "state" && data.state === 2) playbackStatus.textContent = korean ? "일시 정지" : "Paused";
    if (data.type === "progress" && Number.isFinite(Number(data.seconds))) {
      const seconds = Math.floor(Number(data.seconds));
      playbackStatus.textContent = (korean ? "재생 중 · " : "Playing · ") + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    }
  });

  const style = document.createElement("style");
  style.textContent = `
    :root #bibleAudioPlayer:not([hidden]) {
      position: fixed; z-index: 1001; right: 12px; bottom: 12px;
      box-sizing: border-box; width: min(384px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto;
      padding: 12px; border: 1px solid var(--line); border-radius: 14px;
      background: var(--card); color: var(--ink); box-shadow: 0 8px 32px #10151038;
    }
    :root #bibleAudioPlayer.is-minimized { width: min(264px, calc(100vw - 24px)); }
    :root #bibleAudioPlayer .bible-audio-player-bar { flex-wrap: wrap; margin-top: 0; }
    :root #bibleAudioPlayerTitle { flex: 1 0 100%; }
    :root #bibleAudioPlayer #bibleAudioPlayerVideo iframe {
      display: block; box-sizing: border-box; width: 100% !important;
      max-width: none; min-width: 200px !important;
      height: 202px !important; min-height: 200px !important;
      margin: 8px 0 0; border: 0; border-radius: 8px; background: #111;
    }
    :root #bibleAudioPlayer .note { color: var(--ink); }
  `;
  document.head.append(style);

  const render = window.renderBibleAudioSetup;
  if (typeof render === "function") {
    window.renderBibleAudioSetup = function (...args) {
      const result = render.apply(this, args);
      const token = document.getElementById("bibleAudioPlayerFrame")?.dataset.playerToken || "";
      if (!token || player.hidden) playbackStatus.textContent = "";
      else if (token !== playbackToken) playbackStatus.textContent = document.documentElement.lang.startsWith("ko") ? "오디오 준비 중…" : "Loading audio…";
      playbackToken = token;
      if (!panel.hidden && quick.hidden) {
        const label = window.bibleAudioCopy().play;
        quick.hidden = false;
        quick.textContent = "♫ " + label;
        focusQuick.hidden = false;
        focusQuick.title = label;
        focusQuick.setAttribute("aria-label", label);
      }
      return result;
    };
    window.renderBibleAudioSetup();
  }
})();
