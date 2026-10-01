// Deliberately disconnected from every live page. No AdSense loader or request code.
export const AD_CONFIG = Object.freeze({
  enabled: false,
  publisherId: 'ca-pub-7874410414327857',
  slotId: '9881198711',
});

const KEY = 'selah.ads.displayed.v1';
const allowed = context => ['home', 'dashboard'].includes(context.view)
  && context.consentGranted === true && context.visible === true
  && context.reading !== true && context.meditating !== true;

// Separate from account/sync data: one origin/browser profile on this device.
export function createDailyAdGate({ storage, locks, context, now = () => new Date() }) {
  let closed = false;
  let blocked = false;
  const day = () => now().toLocaleDateString('sv-SE');
  const read = () => {
    const raw = storage.getItem(KEY);
    const state = raw === null ? { day: day(), count: 0 } : JSON.parse(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(state.day)
      || !Number.isInteger(state.count) || state.count < 0 || state.count > 2) {
      throw new Error('Invalid ad counter');
    }
    return state.day === day() ? state : { day: day(), count: 0 };
  };
  const eligible = () => !closed && !blocked && allowed(context());
  return {
    close() { closed = true; },
    // render must resolve true ONLY after filled content is visibly displayed.
    // False/rejection includes no-fill, blocked, timeout, or cancelled rendering.
    async show(render) {
      if (!locks?.request || !eligible()) return false;
      try {
        return await locks.request(KEY, async () => {
          if (!eligible()) return false;
          const state = read();
          if (state.count >= 2) return false; // Before any future provider request.
          storage.setItem(KEY, JSON.stringify(state)); // Fail closed if unavailable.
          if (await render(eligible) !== true || !eligible()) return false;
          // Count the display date, including a request crossing local midnight.
          const displayed = read();
          if (displayed.count >= 2) return false;
          storage.setItem(KEY, JSON.stringify({ day: day(), count: displayed.count + 1 }));
          return true;
        });
      } catch {
        blocked = true;
        return false;
      }
    },
  };
}

// Future integration seam, never mounted in the current mixed reader/dashboard.
// No default renderer: supplying IDs alone cannot make an advertising request.
export function mountDashboardAd(host, { getView, consentGranted, render } = {}) {
  if (!AD_CONFIG.enabled || !AD_CONFIG.publisherId || !AD_CONFIG.slotId
    || typeof render !== 'function' || typeof getView !== 'function'
    || typeof consentGranted !== 'function') return null;
  const doc = host.ownerDocument;
  const context = () => ({
    view: getView(),
    consentGranted: consentGranted(),
    visible: host.isConnected && doc.visibilityState === 'visible'
      && host.getClientRects().length > 0,
    // Fail closed on the current reader pages, even if labelled "home".
    reading: !!doc.querySelector('.reading-scripture, #verseText, #reader'),
    meditating: !!doc.querySelector('#meditation.active')
      || doc.body.classList.contains('mobile-reading-focus'),
  });
  if (!allowed(context())) return null;
  let storage;
  try { storage = doc.defaultView.localStorage; } catch { return null; }
  const box = doc.createElement('aside');
  box.setAttribute('aria-label', 'Advertisement');
  box.style.cssText = 'position:relative;max-width:320px;margin:12px auto;border:1px solid var(--line,#ddd);border-radius:8px;padding:6px;background:var(--card,#fff);color:var(--ink,#222)';
  const label = doc.createElement('small');
  label.textContent = 'Advertisement';
  const close = doc.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close advertisement');
  close.style.cssText = 'float:right;width:44px;height:44px;cursor:pointer';
  const slot = doc.createElement('div');
  slot.style.cssText = 'clear:both;width:100%;height:100px;overflow:hidden';
  box.append(label, close, slot);
  host.append(box);
  const gate = createDailyAdGate({
    storage,
    locks: doc.defaultView.navigator.locks,
    context,
  });
  const controller = new AbortController();
  const dispose = () => {
    gate.close();
    controller.abort();
    observer.disconnect();
    doc.removeEventListener('visibilitychange', check);
    box.remove();
  };
  const check = () => { if (!allowed(context())) dispose(); };
  const observer = new MutationObserver(check);
  observer.observe(doc.body, { subtree: true, attributes: true, childList: true });
  doc.addEventListener('visibilitychange', check);
  close.onclick = dispose;
  gate.show(eligible => render(slot, {
    config: AD_CONFIG, signal: controller.signal, eligible,
  })).then(shown => { if (!shown) dispose(); });
  return { dispose }; // Router must dispose BEFORE leaving home/dashboard.
}
