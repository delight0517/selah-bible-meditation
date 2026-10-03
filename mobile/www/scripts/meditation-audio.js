/* Exact-edition YouTube audio for timed Scripture meditation. The Korean
   per-verse starts are approximate caption-derived timestamps; captions are not bundled. */
(() => {
  const catalog = {
    "kor_old:MAT:1": {
      videoId: "FrZy71iIRm4",
      title: { ko: "개역한글판 (1961) · 마태복음 1장", en: "Korean Revised Version (1961) · Matthew 1", ja: "韓国語改訳聖書 (1961) · マタイ 1章" },
      // Starts in seconds, in verse order; derived from the video's Korean timed captions.
      verseStarts: [10.6, 15.9, 20.0, 30.7, 36.7, 45.6, 52.1, 59.8, 70.3, 75.8, 81.9, 91.1, 99.2, 104.2, 112.3, 118.3, 130.4, 145.7, 155.8, 161.9, 174.4, 183.2, 190.9, 203.4, 207.7]
    }
  };
  const $ = id => document.getElementById(id);
  const dock = $("meditationAudioDock");
  if (!dock) return;
  const button = $("meditationAudioToggle"), panel = $("meditationAudioPanel");
  const playerSlot = $("meditationAudioPlayerSlot"), status = $("meditationAudioStatus");
  let playerHost = $("meditationAudioPlayer");
  let entry = null, contextKey = "", player = null, syncTimer = 0, apiPromise = null, lastVerse = 0;
  const localeText = {
    ko: { button: "성경 오디오", heading: "같은 역본으로 듣기", unavailable: "이 장과 선택한 역본에 맞는 오디오가 아직 없습니다.", close: "오디오 닫기", verse: n => `${n}절 듣는 중` },
    en: { button: "Scripture audio", heading: "Listen to this edition", unavailable: "No audio is available for this chapter and edition yet.", close: "Close audio", verse: n => `Listening to verse ${n}` },
    ja: { button: "聖書の音声", heading: "同じ翻訳で聴く", unavailable: "この章と選択した翻訳に一致する音声はまだありません。", close: "音声を閉じる", verse: n => `${n}節を再生中` },
    "zh-CN": { button: "圣经音频", heading: "收听此译本", unavailable: "目前没有与本章和所选译本匹配的音频。", close: "关闭音频", verse: n => `正在播放第 ${n} 节` },
    "zh-TW": { button: "聖經音訊", heading: "聆聽此譯本", unavailable: "目前沒有與本章及所選譯本相符的音訊。", close: "關閉音訊", verse: n => `正在播放第 ${n} 節` }
  };
  const text = () => localeText[document.documentElement.lang] || localeText.ko;
  const setFollowingVerse = verse => {
    const reader = $("meditationVerse");
    const blocks = reader?.querySelectorAll(".bible-verse") || [];
    const node = [...blocks].find(item => Number(item.querySelector(".bible-verse-num")?.textContent) === verse);
    if (!node || verse === lastVerse) return;
    reader.querySelector(".audio-following")?.classList.remove("audio-following");
    node.classList.add("audio-following");
    lastVerse = verse;
    const readerBox = reader.getBoundingClientRect(), verseBox = node.getBoundingClientRect();
    reader.scrollTo({ top: reader.scrollTop + verseBox.top - readerBox.top - Math.max(0, (reader.clientHeight - verseBox.height) / 2), behavior: "smooth" });
    status.textContent = text().verse(verse);
  };
  const stopSync = () => { clearInterval(syncTimer); syncTimer = 0; };
  const sync = () => {
    if (!player || !entry?.verseStarts?.length || player.getPlayerState?.() !== 1) return;
    const time = player.getCurrentTime();
    let index = -1;
    for (let i = 0; i < entry.verseStarts.length; i++) if (time >= entry.verseStarts[i]) index = i; else break;
    if (index >= 0) setFollowingVerse(index + 1);
  };
  const destroyPlayer = () => {
    stopSync();
    try { player?.destroy(); } catch {}
    player = null;
    playerSlot.replaceChildren();
    playerHost = document.createElement("div");
    playerHost.id = "meditationAudioPlayer";
    playerSlot.append(playerHost);
    lastVerse = 0;
    $("meditationVerse")?.querySelector(".audio-following")?.classList.remove("audio-following");
  };
  const loadApi = () => {
    if (window.YT?.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { try { previous?.(); } finally { resolve(); } };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => reject(new Error("YouTube player unavailable"));
      document.head.append(script);
    });
    return apiPromise;
  };
  const openPlayer = async () => {
    if (!entry || player) return;
    status.textContent = entry.title[document.documentElement.lang] || entry.title.ko;
    try {
      await loadApi();
      player = new YT.Player(playerHost, {
        width: "232", height: "200", videoId: entry.videoId,
        playerVars: { controls: 1, playsinline: 1, rel: 0, origin: location.origin },
        events: { onStateChange: event => { if (event.data === 1) { stopSync(); syncTimer = setInterval(sync, 500); sync(); } else stopSync(); } }
      });
    } catch { status.textContent = text().unavailable; }
  };
  const closePanel = () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    player?.pauseVideo?.();
    stopSync();
  };
  button.addEventListener("click", () => {
    if (panel.hidden) {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      if (entry) openPlayer(); else status.textContent = "";
    } else closePanel();
  });
  $("meditationAudioClose").addEventListener("click", () => { closePanel(); button.focus(); });
  panel.addEventListener("keydown", event => { if (event.key === "Escape") { closePanel(); button.focus(); event.stopPropagation(); } });
  window.SelahMeditationAudio = {
    setActive(value) {
      dock.hidden = !value;
      if (!value) closePanel();
    },
    configure({ translationId, bookId, chapter, custom, locale }) {
      const nextKey = `${translationId}:${bookId}:${chapter}`;
      const next = custom ? null : catalog[nextKey] || null;
      if (nextKey !== contextKey || next !== entry) { destroyPlayer(); entry = next; contextKey = nextKey; }
      const strings = localeText[locale] || localeText.ko;
      button.setAttribute("aria-label", strings.button);
      $("meditationAudioTitle").textContent = strings.heading;
      $("meditationAudioUnavailable").textContent = strings.unavailable;
      $("meditationAudioClose").setAttribute("aria-label", strings.close);
      $("meditationAudioUnavailable").hidden = !!entry;
      playerSlot.hidden = !entry;
      if (panel.hidden) status.textContent = entry ? (entry.title[locale] || entry.title.ko) : "";
      else if (entry && !player) openPlayer();
    }
  };
})();
