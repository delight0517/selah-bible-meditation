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
