/* Optional, pseudonymous feature usage. No account or private content in payloads. */
(() => {
  const base = 'https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/usage/';
  const key = 'selah.usage.v1';
  const allowed = new Set(['scripture_read', 'meditation_started', 'reflection_saved', 'quiz_created', 'quiz_reviewed', 'bible_downloaded', 'focused_reading_started']);
  let config, busy = false;
  const read = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
  const save = value => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  async function send(path, body) {
    return fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), priority: 'low', signal: AbortSignal.timeout(8000) });
  }
  async function flush() {
    if (busy || !navigator.onLine) return;
    busy = true;
    try {
      let state = read();
      for (const visitorId of state.deleteIds || []) {
        if (!(await send('delete', { visitorId })).ok) return;
        state = read(); state.deleteIds = (state.deleteIds || []).filter(id => id !== visitorId); save(state);
      }
      for (const event of state.queue || []) {
        const current = read();
        if (!current.enabled || current.visitorId !== event.visitorId) break;
        if (!(await send('event', event)).ok) break;
        state = read(); state.queue = (state.queue || []).filter(item => item.eventId !== event.eventId); save(state);
      }
    } catch { /* Keep bounded queue for the next online visit. */ }
    finally { busy = false; }
  }
  function track(feature) {
    if (!config || !allowed.has(feature)) return;
    const state = read(), context = config.context();
    if (!state.enabled || !state.visitorId || context.qa) return;
    const event = { consent: true, visitorId: state.visitorId, eventId: crypto.randomUUID(), feature,
      locale: context.locale, client: context.client, deviceClass: context.deviceClass,
      source: context.source || '', medium: context.medium || '', campaign: context.campaign || '' };
    state.queue = [...(state.queue || []), event].slice(-100);
    if (save(state)) void flush();
  }
  function init(options) {
    config = options;
    const ko = document.documentElement.lang === 'ko';
    const section = document.createElement('div'); section.className = 'telemetry-setting';
    const label = document.createElement('label'), toggle = document.createElement('input');
    toggle.type = 'checkbox'; toggle.checked = read().enabled === true;
    label.append(toggle, document.createTextNode(ko ? '기능 이용 분석에 동의' : 'Allow feature usage analytics'));
    const help = document.createElement('p'); help.className = 'small';
    help.textContent = ko ? '무작위 브라우저 ID로 기능·시각·국가·기기 범주·캠페인을 연결합니다. 최근 30일을 관리자만 확인하며 계정·묵상·기도 내용은 보내지 않습니다. 끄면 기록 삭제를 요청합니다.' : 'Links a random browser ID to features, time, country, device class and campaigns. Only developers see the last 30 days. No account or reflection/prayer content. Turning off requests deletion.';
    toggle.addEventListener('change', () => {
      const state = read();
      if (toggle.checked) { state.enabled = true; state.visitorId ||= crypto.randomUUID(); }
      else { state.enabled = false; if (state.visitorId) state.deleteIds = [...new Set([...(state.deleteIds || []), state.visitorId])]; delete state.visitorId; state.queue = []; }
      if (!save(state)) { toggle.checked = false; help.textContent = ko ? '브라우저 저장소를 사용할 수 없어 분석을 켜지 않았습니다.' : 'Analytics stays off because browser storage is unavailable.'; }
      void flush();
    });
    section.append(label, help); document.querySelector('.reader-settings')?.append(section);
    const panel = document.getElementById('developerAnalyticsPanel');
    if (panel) {
      const title = document.createElement('h3'); title.textContent = ko ? '동의한 브라우저별 기능 이용 · 최근 30일' : 'Consented browser usage · Last 30 days';
      const note = document.createElement('p'); note.className = 'small'; note.textContent = ko ? '최근 브라우저 100개까지 표시합니다. 같은 사람이 여러 기기를 쓰면 다른 ID입니다. ID를 누르면 최근 이벤트 200개를 확인합니다.' : 'Up to 100 recent browser IDs, not people. Select an ID for up to 200 recent events.';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary'; button.textContent = ko ? '이용 기록 새로고침' : 'Refresh usage';
      const output = document.createElement('div'); output.setAttribute('role', 'status'); output.style.overflowX = 'auto';
      const names = { scripture_read: '말씀 읽기', focused_reading_started: '집중 읽기', meditation_started: '시간 묵상', reflection_saved: '기록 저장', quiz_created: '퀴즈 생성', quiz_reviewed: '퀴즈 복습', bible_downloaded: '오프라인 저장' };
      let generation = 0;
      async function load(visitorId = '') {
        const ticket = ++generation, token = config.adminToken();
        output.replaceChildren();
        if (!token) { output.textContent = ko ? '개발자 계정에 다시 로그인해 주세요.' : 'Sign in with your developer account.'; return; }
        button.disabled = true;
        try {
          const response = await fetch(base + 'users' + (visitorId ? '?visitorId=' + encodeURIComponent(visitorId) : ''), { headers: { authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(String(response.status));
          const data = await response.json();
          if (ticket !== generation || token !== config.adminToken() || panel.hidden) return;
          const rows = visitorId ? data.events : data.rows;
          if (!rows?.length) { output.textContent = ko ? '동의한 브라우저의 이용 기록이 아직 없습니다.' : 'No consented usage records yet.'; return; }
          const table = document.createElement('table'); table.style.width = '100%';
          const head = table.insertRow();
          for (const text of (visitorId ? ['UTC', 'Feature', 'Country', 'Device', 'Source / Campaign'] : ['Browser ID', 'Feature', 'Uses', 'Last used (UTC)'])) { const th = document.createElement('th'); th.textContent = text; head.append(th); }
          for (const row of rows) {
            const tr = table.insertRow();
            if (!visitorId) { const cell = tr.insertCell(), link = document.createElement('button'); link.type = 'button'; link.className = 'link'; link.textContent = row.visitorId; link.addEventListener('click', () => load(row.visitorId)); cell.append(link); }
            const values = visitorId ? [row.occurredAt, ko ? names[row.feature] || row.feature : row.feature, row.country, row.client + ' / ' + row.deviceClass, row.source + ' / ' + row.campaign] : [ko ? names[row.feature] || row.feature : row.feature, row.uses, row.lastSeen];
            for (const value of values) tr.insertCell().textContent = String(value);
          }
          output.append(table);
        } catch { if (ticket === generation) output.textContent = ko ? '기록을 불러오지 못했습니다. 개발자 로그인과 분석 서버 배포 상태를 확인해 주세요.' : 'Unable to load records. Check developer login and analytics deployment.'; }
        finally { button.disabled = false; }
      }
      button.addEventListener('click', () => load()); panel.append(title, note, button, output);
      new MutationObserver(() => { if (panel.hidden) { generation++; output.replaceChildren(); } }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    }
    document.getElementById('startFocusReading')?.addEventListener('click', () => track('focused_reading_started'));
    window.addEventListener('online', flush); void flush();
  }
  window.SelahUsage = { init, track };
})();
