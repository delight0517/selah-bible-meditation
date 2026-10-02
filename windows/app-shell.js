(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('windowsShell') !== '1') return;

  const zoomKey = 'selah.windowsShell.pageZoom';
  const clampZoom = (value) => Math.max(80, Math.min(150, Math.round(value / 10) * 10));
  let zoom = clampZoom(Number(localStorage.getItem(zoomKey)) || 100);

  const style = document.createElement('style');
  style.textContent = `
    #selahWindowsToolbar{position:sticky;top:0;z-index:2147483000;display:flex;align-items:center;gap:8px;min-height:46px;padding:5px 12px;background:#173b32;color:#fffefa;border-bottom:1px solid #ffffff2b;font:13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif}
    #selahWindowsToolbar .selah-shell-brand{margin:0 auto 0 4px;font-weight:750;letter-spacing:.14em}
    #selahWindowsToolbar button{display:inline-grid;place-items:center;min-width:34px;height:34px;padding:0 8px;border:1px solid #ffffff45;border-radius:8px;background:#ffffff12;color:inherit;font:600 15px system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
    #selahWindowsToolbar button:hover:not(:disabled){background:#ffffff25}
    #selahWindowsToolbar button:disabled{opacity:.4;cursor:default}
    #selahWindowsToolbar button:focus-visible{outline:2px solid #e0bd79;outline-offset:2px}
    #selahWindowsZoom{min-width:48px;text-align:center;font-variant-numeric:tabular-nums}
    @media(max-width:520px){#selahWindowsToolbar{gap:5px;padding-inline:7px}#selahWindowsToolbar .selah-shell-brand{font-size:11px}#selahWindowsToolbar button{min-width:32px;padding-inline:5px}}
  `;
  document.head.append(style);

  const toolbar = document.createElement('nav');
  toolbar.id = 'selahWindowsToolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Selah app controls');
  toolbar.innerHTML = `
    <button type="button" id="selahWindowsBack" aria-label="Back" title="Back">←</button>
    <button type="button" id="selahWindowsForward" aria-label="Forward" title="Forward">→</button>
    <span class="selah-shell-brand" aria-hidden="true">SELAH</span>
    <button type="button" id="selahWindowsZoomOut" aria-label="Zoom out" title="Zoom out (Ctrl+Alt+-)">−</button>
    <output id="selahWindowsZoom" aria-live="polite"></output>
    <button type="button" id="selahWindowsZoomIn" aria-label="Zoom in" title="Zoom in (Ctrl+Alt++)">+</button>
    <button type="button" id="selahWindowsFocus" aria-label="Focus reading" title="Focus reading (Ctrl+Shift+F)">⛶</button>
  `;
  document.body.prepend(toolbar);

  const back = toolbar.querySelector('#selahWindowsBack');
  const forward = toolbar.querySelector('#selahWindowsForward');
  const zoomLabel = toolbar.querySelector('#selahWindowsZoom');
  const focusButton = toolbar.querySelector('#selahWindowsFocus');
  const focusToggle = document.getElementById('readerFocusToggle');

  function applyZoom() {
    document.documentElement.style.zoom = `${zoom}%`;
    zoomLabel.value = `${zoom}%`;
    zoomLabel.textContent = `${zoom}%`;
    toolbar.querySelector('#selahWindowsZoomOut').disabled = zoom <= 80;
    toolbar.querySelector('#selahWindowsZoomIn').disabled = zoom >= 150;
    localStorage.setItem(zoomKey, String(zoom));
  }

  function updateNavigation() {
    const nav = window.navigation;
    back.disabled = nav ? !nav.canGoBack : history.length <= 1;
    forward.disabled = nav ? !nav.canGoForward : true;
  }

  function syncFocusLabel() {
    const isFocused = document.body.classList.contains('mobile-reading-focus');
    const label = focusToggle?.getAttribute('aria-label') || (isFocused ? 'Exit focus reading' : 'Focus reading');
    focusButton.setAttribute('aria-label', label);
    focusButton.title = `${label} (Ctrl+Shift+F)`;
    focusButton.setAttribute('aria-pressed', String(isFocused));
  }

  back.addEventListener('click', () => history.back());
  forward.addEventListener('click', () => history.forward());
  toolbar.querySelector('#selahWindowsZoomOut').addEventListener('click', () => { zoom = clampZoom(zoom - 10); applyZoom(); });
  toolbar.querySelector('#selahWindowsZoomIn').addEventListener('click', () => { zoom = clampZoom(zoom + 10); applyZoom(); });
  focusButton.addEventListener('click', () => focusToggle?.click());
  window.addEventListener('popstate', updateNavigation);
  if (window.navigation) window.navigation.addEventListener('currententrychange', updateNavigation);
  if (focusToggle) new MutationObserver(syncFocusLabel).observe(focusToggle, { attributes: true, attributeFilter: ['aria-label', 'title'] });
  new MutationObserver(syncFocusLabel).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('keydown', (event) => {
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'ArrowLeft') {
      event.preventDefault(); history.back();
    } else if (event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'ArrowRight') {
      event.preventDefault(); history.forward();
    } else if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault(); focusToggle?.click();
    } else if (event.ctrlKey && event.altKey) {
      const key = event.key;
      if (key === '+' || key === '=' || key === 'Add') { event.preventDefault(); zoom = clampZoom(zoom + 10); applyZoom(); }
      else if (key === '-' || key === 'Subtract') { event.preventDefault(); zoom = clampZoom(zoom - 10); applyZoom(); }
      else if (key === '0') { event.preventDefault(); zoom = 100; applyZoom(); }
    }
  });

  applyZoom();
  updateNavigation();
  syncFocusLabel();
})();
