(() => {
  if (window.selahAudioReadalongInstalled) return;
  const player = document.getElementById("bibleAudioPlayer");
  const quick = document.getElementById("readerAudioPrimary");
  const focusQuick = document.getElementById("readerAudioFocusPlay");
  const panel = document.getElementById("bibleAudioPanel");
  if (!player || !quick || !focusQuick || !panel) return;
  window.selahAudioReadalongInstalled = true;

  // A fixed player still disappears inside closed details or focus-mode hidden settings.
  document.body.append(player);
  const follow = document.getElementById("bibleAudioFollowControls");
  if (follow) player.append(follow);
  const status = document.getElementById("youtubeAudioSearchStatus");
  if (status) quick.after(status);

  const playbackStatus = document.createElement("p");
  playbackStatus.id = "bibleAudioPlaybackStatus";
  playbackStatus.className = "note";
  playbackStatus.setAttribute("role", "status");
  player.append(playbackStatus);
  let playbackToken = "";
  const statusCopy = {
    ko: ["오디오 준비 중…", "재생 준비 완료", "오디오를 재생할 수 없습니다. YouTube에서 열기로 확인해 주세요.", "일시 정지", "재생 중"],
    en: ["Loading audio…", "Ready to play", "Audio unavailable. Check this video using Open in YouTube.", "Paused", "Playing"],
    ja: ["音声を準備中…", "再生準備完了", "音声を再生できません。YouTubeで確認してください。", "一時停止", "再生中"],
    "zh-CN": ["音频加载中…", "可以播放", "无法播放音频。请在YouTube中查看。", "已暂停", "播放中"],
    "zh-TW": ["音訊載入中…", "可以播放", "無法播放音訊。請在YouTube中查看。", "已暫停", "播放中"],
    fil: ["Nilo-load ang audio…", "Handa nang i-play", "Hindi ma-play ang audio. Tingnan sa YouTube.", "Naka-pause", "Nagpe-play"],
    es: ["Cargando audio…", "Listo para reproducir", "Audio no disponible. Abre el video en YouTube.", "En pausa", "Reproduciendo"],
    "pt-BR": ["Carregando áudio…", "Pronto para reproduzir", "Áudio indisponível. Abra o vídeo no YouTube.", "Pausado", "Reproduzindo"],
    ru: ["Загрузка аудио…", "Готово к воспроизведению", "Аудио недоступно. Откройте видео на YouTube.", "Пауза", "Воспроизведение"],
    uk: ["Завантаження аудіо…", "Готово до відтворення", "Аудіо недоступне. Відкрийте відео на YouTube.", "Пауза", "Відтворення"]
  };
  const copy = () => statusCopy[document.documentElement.lang] || statusCopy.en;
  window.addEventListener("message", event => {
    const frame = document.getElementById("bibleAudioPlayerFrame");
    if (!frame || event.source !== frame.contentWindow ||
        event.origin !== "https://delight0517.github.io" ||
        event.data?.channel !== "selah-youtube-player" ||
        event.data.token !== frame.dataset.playerToken) return;
    const data = event.data;
    const labels = copy();
    if (data.type === "ready") playbackStatus.textContent = labels[1];
    if (data.type === "error") playbackStatus.textContent = labels[2];
    if (data.type === "state" && data.state === 2) playbackStatus.textContent = labels[3];
    if (data.type === "progress" && Number.isFinite(Number(data.seconds))) {
      const seconds = Math.floor(Number(data.seconds));
      playbackStatus.textContent = (labels[4] + " · ") + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    }
  });

  const style = document.createElement("style");
  style.textContent = `
    :root #bibleAudioPlayer:not([hidden]) {
      position: fixed; z-index: 1001; right: max(12px, env(safe-area-inset-right)); bottom: calc(12px + env(safe-area-inset-bottom));
      box-sizing: border-box; width: min(384px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto;
      padding: 12px; border: 1px solid var(--line); border-radius: 14px;
      background: var(--card); color: var(--ink); box-shadow: 0 8px 32px #10151038;
    }
    :root #bibleAudioPlayer.is-minimized { width: min(240px, calc(100vw - 24px)); padding: 10px; }
    :root #bibleAudioPlayer .bible-audio-player-bar { flex-wrap: wrap; margin-top: 0; }
    :root #bibleAudioPlayerTitle { flex: 1 0 100%; }
    :root #bibleAudioPlayer:not([hidden]) #bibleAudioPlayerVideo iframe {
      display: block; box-sizing: border-box; width: 100% !important;
      max-width: none; min-width: 200px !important;
      height: 202px !important; min-height: 200px !important;
      margin: 8px 0 0; border: 0; border-radius: 8px; background: #111;
    }
    :root #bibleAudioPlayer .note { color: var(--ink); }
    :root #bibleAudioPlayer.is-minimized #bibleAudioCueCount { display: none; }
    :root #bibleAudioPlayer.is-minimized #bibleAudioFollowStatus { margin: 0; line-height: 1.4; max-height: 2.8em; overflow: hidden; }
    @media (max-width: 600px) {
      :root #bibleAudioPlayer:not([hidden]) { width: min(240px, calc(100vw - 24px)); padding: 10px; }
    }
    @supports (height: 100dvh) {
      :root #bibleAudioPlayer:not([hidden]) { max-height: calc(100dvh - 24px - env(safe-area-inset-bottom)); }
    }
  `;
  document.head.append(style);

  const render = window.renderBibleAudioSetup;
  if (typeof render === "function") {
    window.renderBibleAudioSetup = function (...args) {
      const result = render.apply(this, args);
      const token = document.getElementById("bibleAudioPlayerFrame")?.dataset.playerToken || "";
      if (!token || player.hidden) playbackStatus.textContent = "";
      else if (token !== playbackToken) playbackStatus.textContent = copy()[0];
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
