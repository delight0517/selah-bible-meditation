// @moasis-feature:selah-reader-start-recovery
// Keep Scripture entry responsive if a later app startup step fails.
(() => {
  const button = document.getElementById("startFocusReading");
  if (!button || button.dataset.readerStartFallback === "true") return;
  button.dataset.readerStartFallback = "true";
  const startFromLink = new URLSearchParams(location.search).get("homeAction") === "read";
  button.addEventListener("click", () => {
    setTimeout(() => {
      const body = document.body;
      try { window.setReaderFocus?.(true); } catch {}
      body.classList.add("mobile-reading-focus");
      const scripture = document.getElementById("verseText");
      if (scripture?.querySelector(".bible-verse")) return;
      const loader = window.loadBibleForLanguage;
      if (typeof loader !== "function") {
        if (scripture) scripture.textContent = "말씀을 불러오지 못했어요. 페이지를 새로고침해 주세요.";
        return;
      }
      Promise.resolve().then(() => loader()).then(() => {
        if (!scripture?.querySelector(".bible-verse") && scripture) {
          scripture.textContent = typeof window.t === "function"
            ? window.t("bibleChapterUnavailable")
            : "말씀을 불러오지 못했어요. 연결을 확인해 주세요.";
        }
      }).catch(() => {
        if (scripture && !scripture.querySelector(".bible-verse")) {
          scripture.textContent = typeof window.t === "function"
            ? window.t("bibleChapterUnavailable")
            : "말씀을 불러오지 못했어요. 연결을 확인해 주세요.";
        }
      });
    }, 0);
  }, { capture: true });
  if (startFromLink) setTimeout(() => button.click(), 0);
})();
