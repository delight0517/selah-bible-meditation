(() => {
  'use strict';
  const copy = {
    ko: { title: '모든 기기의 내 기록', help: '같은 BlueCloud 계정의 묵상·읽던 위치·화면 설정을 함께 관리해요. 백업을 가져오면 기존 기록과 합쳐집니다.', local: '이 기기에 보관 중 · 계정 연결 후 통합', synced: '마지막 통합', pending: '계정에 연결됨 · 통합 대기', drafts: '다른 기기의 작성 중인 노트', recover: '덮어쓰기·삭제 전 기록 복구', open: '초안 이어 쓰기', restore: '새 기록으로 복구', empty: '이어 쓸 초안이나 복구할 기록이 없습니다.', saved: '복구한 기록을 새 기록으로 저장했어요.', snapshot: '기존 초안은 백업에 보관했습니다.' },
    en: { title: 'My records across devices', help: 'Use the same BlueCloud account for reflections, reading position and appearance. Imported backups are added to existing records.', local: 'Stored on this device · connect an account to combine', synced: 'Last combined', pending: 'Account connected · waiting to combine', drafts: 'Drafts from other devices', recover: 'Recover earlier or deleted records', open: 'Continue draft', restore: 'Restore as a new record', empty: 'No other drafts or earlier records to recover.', saved: 'Saved a recovered copy as a new record.', snapshot: 'Your previous draft is preserved in the local backup.' }
  };
  const panel = document.createElement('section');
  panel.className = 'saved unified-data-panel';
  panel.id = 'unifiedDataPanel';
  const title = document.createElement('h3'), help = document.createElement('p'), status = document.createElement('p'), list = document.createElement('div');
  status.setAttribute('role', 'status');
  help.className = status.className = 'small';
  panel.append(title, help, status, list);
  const version = document.createElement('p'); version.className = 'small'; panel.append(version);
  fetch('./SHARED_APP_BUILD.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(build => { if (build) version.textContent = 'Selah ' + build.version + ' · ' + build.build; }).catch(() => {});
  document.getElementById('modal')?.querySelector('.dialog-actions')?.before(panel);
  const label = () => copy[preferredLocale()] || copy.en;
  function button(text, action) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = 'btn secondary'; item.textContent = text;
    item.addEventListener('click', action);
    return item;
  }
  function saveDraftBackup() {
    localStorage.setItem('selah.draft.backup.' + unifiedDeviceId, JSON.stringify({ owner: db.owner || '', draft: db.draft || {} }));
  }
  function render() {
    const words = label();
    title.textContent = words.title; help.textContent = words.help;
    status.textContent = !token ? words.local : unifiedLastSyncAt ? words.synced + ' · ' + new Date(unifiedLastSyncAt).toLocaleTimeString() : words.pending;
    list.replaceChildren();
    const drafts = (db.drafts || []).filter(record => record.id !== unifiedDeviceId && (record.text || record.prayer));
    const recovered = Object.entries(db._selahSync?.recovery || {});
    if (drafts.length) {
      const heading = document.createElement('h4'); heading.textContent = words.drafts; list.append(heading);
      for (const record of drafts) {
        const line = document.createElement('p'), summary = document.createElement('span');
        summary.textContent = (record.platform || 'Web') + ' · ' + String(record.text || record.prayer).slice(0,70) + ' ';
        line.append(summary, button(words.open, () => {
          saveDraftBackup();
          db.draft = { text: record.text || '', prayer: record.prayer || '', tags: record.tags || '' };
          activeReflectionId = ''; persist(); scheduleSync();
          $('reflection').value = db.draft.text; $('prayer').value = db.draft.prayer; $('reflectionTags').value = db.draft.tags;
          setNotebookMode(); updateNotebookPageCount(); toast(words.snapshot);
        }));
        list.append(line);
      }
    }
    if (recovered.length) {
      const section = document.createElement('details'), heading = document.createElement('summary');
      heading.textContent = words.recover + ' (' + recovered.length + ')'; section.append(heading);
      for (const [, record] of recovered) {
        if (!SelahData.collections.includes(record.collection)) continue;
        const line = document.createElement('p'), summary = document.createElement('span');
        summary.textContent = record.collection + ' · ' + String(record.value?.text || record.value?.title || record.value?.q || record.value?.ref || record.id).slice(0,70) + ' ';
        line.append(summary, button(words.restore, () => {
          const restored = { ...SelahData.clone(record.value), id: 'recovered-' + crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
          db[record.collection] = [...(db[record.collection] || []), restored];
          normalize(); persist(); scheduleSync(); renderNotes(); renderQuiz(); renderQtLibrary(); toast(words.saved);
        }));
        section.append(line);
      }
      list.append(section);
    }
    if (!drafts.length && !recovered.length) { const empty = document.createElement('p'); empty.className = 'small'; empty.textContent = words.empty; list.append(empty); }
  }
  window.addEventListener('selah-data-updated', render);
  document.getElementById('accountBtn')?.addEventListener('click', render);
  for (const id of ['themeSelect', 'uiFont', 'themePaper', 'themeCard', 'themeInk', 'themeAccent', 'themeAccentText', 'themeReset']) {
    const control = document.getElementById(id);
    control?.addEventListener(id.startsWith('theme') && control.type === 'color' ? 'input' : id === 'themeReset' ? 'click' : 'change', () => {
      db.appearance = unifiedAppearance(); persist(); scheduleSync();
    });
  }
  for (const id of ['reflection', 'prayer', 'reflectionTags']) document.getElementById(id)?.addEventListener('input', scheduleSync);
  window.addEventListener('online', () => { if (token) scheduleSync(); });
  window.addEventListener('storage', event => {
    if (event.key !== key || !event.newValue) return;
    try {
      const incoming = JSON.parse(event.newValue);
      if ((incoming.owner || '') !== (db.owner || '')) return;
      const merged = SelahData.merge(db, incoming);
      if (SelahData.stable(SelahData.payload(db)) === SelahData.stable(SelahData.payload(merged))) return;
      db = { ...db, ...merged, owner: db.owner, draft: db.draft };
      normalize(); unifiedBaseline = SelahData.clone(db); persist(); renderNotes(); renderQuiz(); renderQtLibrary(); scheduleSync();
    } catch { /* Keep the current draft and retry on the next account sync. */ }
  });
  render();
})();
