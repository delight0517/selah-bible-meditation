/* BlueCloud Google sign-in initialization. No credentials are cached here. */
(function (root) {
  let identityLoad = null;
  function loadIdentity(timeoutMs = 15000) {
    if (root.google?.accounts?.id) return Promise.resolve();
    if (identityLoad) return identityLoad;
    identityLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = '1';
      const timer = setTimeout(() => finish(new Error('Google identity load timeout')), timeoutMs);
      function finish(error) {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      }
      script.onload = () => finish(root.google?.accounts?.id ? null : new Error('Google identity unavailable'));
      script.onerror = () => finish(new Error('Google identity load failed'));
      document.head.appendChild(script);
    }).catch(error => { identityLoad = null; throw error; });
    return identityLoad;
  }

  function create({ getInfo, render, status, load = loadIdentity, timeoutMs = 15000, now = Date.now }) {
    let pending = null, ready = false, retryAt = 0;
    function start(force = false) {
      if (pending) return pending;
      if (now() < retryAt) { status('limited', Math.ceil((retryAt - now()) / 1000)); return Promise.resolve(false); }
      if (ready && !force) return Promise.resolve(true);
      status('loading');
      pending = (async () => {
        const abort = new AbortController();
        let timer;
        try {
          const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => { abort.abort(); reject(new Error('Google config timeout')); }, timeoutMs);
          });
          const info = await Promise.race([getInfo(abort.signal), timeout]);
          clearTimeout(timer);
          if (!info?.configured || !info.clientId) { status('unconfigured'); return false; }
          await load(timeoutMs);
          render(info.clientId);
          ready = true;
          status('ready');
          return true;
        } catch (error) {
          ready = false;
          if (error.status === 429) {
            const seconds = Math.max(1, Math.min(3600, Number(error.retryAfter) || 60));
            retryAt = now() + seconds * 1000;
            status('limited', Math.ceil(seconds));
          } else status('failed');
          return false;
        } finally { clearTimeout(timer); pending = null; }
      })();
      return pending;
    }
    return { start };
  }
  root.SelahGoogleSignIn = { create, loadIdentity };
})(typeof window === 'undefined' ? globalThis : window);
