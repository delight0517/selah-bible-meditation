import { AD_CONFIG, mountDashboardAd } from './dashboard-ad.mjs';

const GOOGLE_VENDOR = '755';
const CONSENT_PURPOSES = ['1', '3', '4'];

export function googleTcfConsent(win) {
  return new Promise(resolve => {
    let settled = false;
    let listenerId;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (listenerId !== undefined) win.__tcfapi?.('removeEventListener', 2, () => {}, listenerId);
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), 120000);
    try {
      if (typeof win.__tcfapi !== 'function') return finish(false);
      win.__tcfapi('addEventListener', 2, (data, success) => {
        if (!success || !data || !['tcloaded', 'useractioncomplete'].includes(data.eventStatus)) return;
        listenerId = data.listenerId;
        if (data.gdprApplies === false) return finish(true);
        const purpose = data.purpose?.consents || {};
        const vendor = data.vendor?.consents || {};
        finish(data.gdprApplies === true
          && CONSENT_PURPOSES.every(id => purpose[id] === true)
          && vendor[GOOGLE_VENDOR] === true);
      });
    } catch { finish(false); }
  });
}

export function startHomeAds(doc = document) {
  const win = doc.defaultView;
  const privacyLink = doc.getElementById('adPrivacySettings');
  let mounted;
  let departed = false;
  win.googlefc = win.googlefc || {};
  win.googlefc.callbackQueue = win.googlefc.callbackQueue || [];
  win.googlefc.callbackQueue.push({ CONSENT_API_READY: () => { if (privacyLink) privacyLink.hidden = false; } });
  const openPrivacySettings = () => {
    departed = true;
    mounted?.dispose();
    win.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => win.googlefc.callbackQueue.push(win.googlefc.showRevocationMessage),
    });
  };
  privacyLink?.addEventListener('click', event => {
    event.preventDefault();
    openPrivacySettings();
  });
  for (const id of ['readFromHome', 'meditateFromHome']) {
    doc.getElementById(id)?.addEventListener('click', () => { departed = true; mounted?.dispose(); });
  }
  win.addEventListener('pagehide', () => { departed = true; mounted?.dispose(); }, { once: true });
  if (new URLSearchParams(win.location.search).get('consent') === 'settings') {
    openPrivacySettings();
    return;
  }
  googleTcfConsent(win).then(granted => {
    if (!granted || departed || !AD_CONFIG.enabled) return;
    const host = doc.getElementById('dashboardAdHost');
    if (!host) return;
    mounted = mountDashboardAd(host, {
      getView: () => 'home',
      consentGranted: () => granted,
      render: renderAdSense,
    });
  });
}

async function renderAdSense(slot, { config, signal, eligible }) {
  if (signal.aborted || !eligible()) return false;
  const ins = slot.ownerDocument.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:block;width:100%;height:100px';
  ins.dataset.adClient = config.publisherId;
  ins.dataset.adSlot = config.slotId;
  slot.append(ins);

  return new Promise(resolve => {
    let done = false;
    const finish = shown => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      observer.disconnect();
      visibility.disconnect();
      signal.removeEventListener('abort', abort);
      if (!shown) ins.remove();
      resolve(shown);
    };
    const visible = () => {
      const rect = ins.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0
        && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
    };
    const check = () => {
      if (!eligible()) return finish(false);
      if (ins.dataset.adStatus === 'unfilled') return finish(false);
      if (ins.dataset.adStatus === 'filled' && visible()) finish(true);
    };
    const abort = () => finish(false);
    const observer = new MutationObserver(check);
    const visibility = new IntersectionObserver(check);
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    visibility.observe(ins);
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => finish(false), 15000);
    try {
      if (signal.aborted || !eligible()) return finish(false);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      check();
    } catch { finish(false); }
  });
}

if (typeof document !== 'undefined' && document.getElementById('dashboardAdHost')) startHomeAds();
