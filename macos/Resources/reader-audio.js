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
  const language = document.getElementById("youtubeAudioLanguage");
  const languageLabel = document.getElementById("youtubeAudioLanguageLabel");
  if (language && languageLabel && focusQuick.parentElement) {
    const control = document.createElement("span");
    control.className = "reader-audio-language-control";
    languageLabel.classList.add("visually-hidden");
    language.setAttribute("aria-labelledby", languageLabel.id);
    control.append(languageLabel, language);
    focusQuick.parentElement.append(control);
  }
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

  const controls = window.SelahAudioControls;
  if (controls) {
    const button = document.createElement("button");
    button.id = "readerAudioBottomPlay"; button.type = "button"; button.className = "btn";
    const korean = () => document.documentElement.lang === "ko";
    button.textContent = "▶";
    button.setAttribute("aria-label", korean() ? "성경 듣기. 길게 누르면 언어와 낭독 선택" : "Listen. Hold for language and recording choices");
    button.setAttribute("aria-haspopup", "dialog");
    document.body.append(button);
    controls.onState = state => { button.textContent=state===1?"Ⅱ":"▶";button.setAttribute("aria-pressed",String(state===1)); };
    const dialog = document.createElement("dialog"); dialog.id = "readerAudioChoices";
    const title = document.createElement("h2"); title.id = "readerAudioChoicesTitle";
    dialog.setAttribute("aria-labelledby", title.id);
    const languageLabel = document.createElement("label"), languageSelect = document.createElement("select");
    languageSelect.id = "readerAudioChoicesLanguage"; languageLabel.htmlFor = languageSelect.id;
    const recordingLabel = document.createElement("label"), recording = document.createElement("select");
    recording.id = "readerAudioChoicesRecording"; recordingLabel.htmlFor = recording.id;
    const note = document.createElement("p"); note.className = "note"; note.setAttribute("role", "status");
    const play = document.createElement("button"); play.type = "button"; play.className = "btn";
    const search = document.createElement("button"); search.type = "button"; search.className = "btn ghost";
    const login = document.createElement("a"); login.href = "https://www.youtube.com/"; login.target = "_blank"; login.rel = "noopener";
    const close = document.createElement("button"); close.type = "button"; close.className = "btn ghost";
    dialog.append(title, languageLabel, languageSelect, recordingLabel, recording, note, play, search, login, close);
    document.body.append(dialog);
    const refresh = () => {
      title.textContent = korean() ? "듣기 언어와 낭독 선택" : "Audio language and recording";
      languageLabel.textContent = korean() ? "언어" : "Language";
      recordingLabel.textContent = korean() ? "성경 버전 · YouTube 낭독" : "Bible edition · YouTube recording";
      languageSelect.replaceChildren(...Object.entries(controls.languages()).map(([id, label]) => new Option(label,id)));
      languageSelect.value = controls.language();
      const choices = controls.choices(), previous = recording.value;
      recording.replaceChildren(...choices.map(source => new Option([source.audioEdition || source.edition,source.title].filter(Boolean).join(" · "),source.id)));
      recording.value = choices.some(source=>source.id===previous)?previous:choices.some(source=>source.id===controls.current())?controls.current():choices[0]?.id||"";
      play.disabled = !choices.length;
      note.textContent = choices.length ? (korean() ? "현재 본문에서 재생할 수 있는 낭독입니다." : "Recordings available for this passage.") : (korean() ? "이 본문의 낭독을 검색해 주세요." : "Search for a recording of this passage.");
      play.textContent = korean() ? "선택한 낭독 재생" : "Play selected recording";
      search.textContent = korean() ? "다른 YouTube 낭독 찾기" : "Find another YouTube recording";
      login.textContent = korean() ? "YouTube 로그인 · Premium 계정 확인" : "YouTube sign-in · Check Premium account";
      close.textContent = korean() ? "닫기" : "Close";
    };
    const open = () => { refresh(); if(!dialog.open)dialog.showModal(); languageSelect.focus(); };
    close.onclick = () => dialog.close();
    languageSelect.onchange = () => { controls.setLanguage(languageSelect.value); recording.value=""; refresh(); };
    play.onclick = () => { controls.choose(recording.value); dialog.close(); };
    search.onclick = () => { document.getElementById("youtubeAudioSearch")?.click(); };
    new MutationObserver(() => { if(dialog.open)refresh(); }).observe(document.getElementById("bibleAudioSources"),{childList:true});
    let hold=0,held=false,start=null;
    const cancel=()=>{clearTimeout(hold);hold=0;};
    button.addEventListener("pointerdown",event=>{if(!event.isPrimary||event.button!==0)return;held=false;start={x:event.clientX,y:event.clientY};cancel();hold=setTimeout(()=>{held=true;open();},500);});
    button.addEventListener("pointermove",event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>12){held=true;cancel();}});
    button.addEventListener("pointerup",()=>{cancel();start=null;});
    button.addEventListener("pointercancel",()=>{held=true;cancel();start=null;});
    button.addEventListener("pointerleave",cancel);
    button.addEventListener("click",event=>{if(held){held=false;event.preventDefault();return;}button.textContent=controls.toggle()?"Ⅱ":"▶";});
    button.addEventListener("contextmenu",event=>{event.preventDefault();cancel();held=true;open();});
    button.addEventListener("keydown",event=>{if(event.key==="ArrowDown"||(event.key==="Enter"&&event.shiftKey)){event.preventDefault();open();}});
    window.addEventListener("message",event=>{const frame=document.getElementById("bibleAudioPlayerFrame");if(event.source===frame?.contentWindow&&event.origin==="https://delight0517.github.io"&&event.data?.token===frame?.dataset.playerToken&&event.data?.channel==="selah-youtube-player"&&event.data.type==="state")button.textContent=event.data.state===1?"Ⅱ":"▶";});
  }

  const style = document.createElement("style");
  style.textContent = `
    :root #readerAudioBottomPlay { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 1002; width: 52px; height: 52px; border-radius: 50%; padding: 0; font-size: 22px; touch-action: manipulation; user-select: none; }
    :root #readerAudioChoices { width: min(420px, calc(100vw - 32px)); max-height: 80dvh; overflow: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--card); color: var(--ink); padding: 20px; }
    :root #readerAudioChoices::backdrop { background: #0008; }
    :root #readerAudioChoices select, :root #readerAudioChoices button, :root #readerAudioChoices a { display: block; width: 100%; margin: 10px 0; min-height: 44px; }
    :root #readerAudioChoices select { color: var(--ink); background: var(--card); }
    :root .reader-audio-language-control select { width: auto; max-width: 160px; min-height: 44px; }
    :root #bibleAudioPlayer:not([hidden]) {
      position: fixed; z-index: 1001; right: max(12px, env(safe-area-inset-right)); bottom: calc(84px + env(safe-area-inset-bottom));
      box-sizing: border-box; width: min(384px, calc(100vw - 24px));
      max-height: calc(100vh - 96px); overflow: auto;
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
      :root #bibleAudioPlayer:not([hidden]) { max-height: calc(100dvh - 96px - env(safe-area-inset-bottom)); }
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
