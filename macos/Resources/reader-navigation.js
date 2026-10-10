(() => {
  if (window.selahMacReaderNavigation) return;
  const editing = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="combobox"]';
  const visible = element => element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
  function reader() {
    return document.querySelector('#meditation.active #meditationVerse') || document.querySelector('#verseText');
  }
  function blocked(target) {
    if (target?.closest?.(editing) || document.activeElement?.closest?.(editing)) return true;
    if (window.getSelection()?.toString()) return true;
    return [...document.querySelectorAll('.modal, .promo-modal, #guidePanel, dialog[open], .meditation-notebook-drawer.open')].some(visible);
  }
  let lastTurn = 0;
  function turn(direction) {
    if (direction !== 1 && direction !== -1) return false;
    if (!visible(reader()) || typeof window.navigateBibleChapter !== 'function') return false;
    if (typeof window.adjacentBibleChapter === 'function' && !window.adjacentBibleChapter(direction)) return false;
    const now = performance.now();
    if (now - lastTurn < 400) return true;
    window.navigateBibleChapter(direction);
    lastTurn = now;
    return true;
  }
  const direction = value => document.documentElement.lang.startsWith('ja') ? -value : value;
  window.selahMacReaderNavigation = { turn };
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (blocked(event.composedPath()[0])) return;
    if (event.repeat) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (turn(direction(event.key === 'ArrowRight' ? 1 : -1))) {
      event.preventDefault();
      // The hosted meditation reader has its own arrow listener.
      event.stopImmediatePropagation();
    }
  }, { capture: true });
  let distance = 0, lastWheelAt = 0, turned = false;
  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = event.composedPath()[0];
    if (!target?.closest?.('#verseText, #meditationVerse') || blocked(target)) return;
    const now = performance.now();
    if (now - lastWheelAt > 300) { distance = 0; turned = false; }
    lastWheelAt = now;
    if (Math.abs(event.deltaX) < 2 || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.5) return;
    // Horizontal reading gestures replace WebKit's browser-history gesture.
    if (event.cancelable) event.preventDefault();
    if (turned) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerWidth : 1;
    distance += event.deltaX * unit;
    if (Math.abs(distance) >= 70 && turn(direction(distance > 0 ? 1 : -1))) {
      // Keep inertia in the same gesture from skipping additional chapters.
      turned = true;
    }
  }, { capture: true, passive: false });
})();
