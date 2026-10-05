(() => {
  const copy = {
    ko: { title: '함께 읽은 기록', privacy: '이 기록과 별명은 내 계정에만 저장됩니다.', empty: '초대 링크로 함께 읽으면 이곳에 기록이 쌓입니다.', name: '친구 별명 (예: 민수)', save: '별명 저장', readers: '명 함께 읽음', ended: '함께 읽기를 마쳤어요' },
    en: { title: 'Read together history', privacy: 'This history and your nickname are saved only to your account.', empty: 'Shared reading sessions will appear here.', name: 'Friend nickname', save: 'Save nickname', readers: 'readers', ended: 'Finished reading together' },
    ja: { title: '一緒に読んだ記録', privacy: '記録とニックネームは自分のアカウントだけに保存されます。', empty: '一緒に読んだ記録がここに表示されます。', name: '友だちのニックネーム', save: 'ニックネームを保存', readers: '人で一緒に読書', ended: '共同読書を終了しました' }
  };
  const language = () => preferredLocale();
  const text = key => (copy[language()] || copy.en)[key];
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value) node.textContent = value;
    return node;
  };
  const section = el('section', 'together-history');
  section.id = 'togetherHistory';
  section.hidden = true;
  section.setAttribute('aria-labelledby', 'togetherHistoryTitle');
  const title = el('h3'); title.id = 'togetherHistoryTitle';
  const privacy = el('p', 'note');
  const list = el('div'); list.id = 'togetherHistoryList';
  section.append(title, privacy, list);
  document.getElementById('friendList').after(section);

  function render() {
    section.hidden = !(token && accountStateReady);
    if (section.hidden) return;
    title.textContent = text('title'); privacy.textContent = text('privacy');
    list.replaceChildren();
    const rows = (db.togetherReads || []).slice().sort((a, b) => b.startedAt - a.startedAt);
    if (!rows.length) { list.append(el('p', 'small', text('empty'))); return; }
    for (const row of rows) {
      const form = el('form', 'together-history-row'); form.dataset.togetherHistory = row.id;
      const meta = el('div', 'together-history-meta');
      const book = Array.isArray(activeBibleBooks) ? activeBibleBooks.find(item => item.id === row.passage.book)?.name : '';
      meta.append(el('strong', '', `${book || row.passage.book} ${row.passage.chapter} · ${row.passage.translation}`));
      meta.append(el('span', 'small', `${new Date(row.startedAt).toLocaleDateString(document.documentElement.lang)} · ${row.participantCount} ${text('readers')}`));
      const label = el('label', 'visually-hidden', text('name')); label.htmlFor = `together-name-${row.id}`;
      const controls = el('div', 'friend-tools');
      const input = el('input'); input.id = label.htmlFor; input.name = 'friendName'; input.maxLength = 80;
      input.value = row.friendName; input.placeholder = text('name');
      const button = el('button', 'btn secondary', text('save')); button.type = 'submit';
      controls.append(input, button); form.append(meta, label, controls);
      if (row.endedAt) form.append(el('span', 'small', text('ended')));
      form.addEventListener('submit', event => { event.preventDefault(); saveName(row.id, input.value); });
      list.append(form);
    }
  }

  async function recordTogetherRoom(event) {
    if (!token || !accountId || !accountStateReady || !event?.roomId || !event?.passage) return;
    const roomKey = String(event.roomId), owner = accountId, authToken = token;
    const pending = window.__selahTogetherRecordPending ??= new Map();
    const previous = pending.get(roomKey) || Promise.resolve();
    const operation = previous.catch(() => {}).then(async () => {
      if (accountId !== owner || token !== authToken || !accountStateReady) return;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(roomKey));
      if (accountId !== owner || token !== authToken || !accountStateReady) return;
      const id = Array.from(new Uint8Array(digest)).slice(0, 16).map(n => n.toString(16).padStart(2, '0')).join('');
      const passage = { book: String(event.passage.book || '').slice(0, 16), chapter: Math.max(1, Math.min(200, Number(event.passage.chapter) || 1)), translation: String(event.passage.translation || '').slice(0, 80), language: String(event.passage.language || '').slice(0, 16) };
      const rows = db.togetherReads || (db.togetherReads = []);
      const row = rows.find(item => item.id === id);
      if (!row) rows.push({ id, passage, participantCount: Math.max(1, Math.min(100, Number(event.participantCount) || 1)), startedAt: Date.now(), updatedAt: Date.now(), endedAt: 0, friendName: '' });
      else {
        const count = Math.max(1, Math.min(100, Number(event.participantCount) || 1));
        if (SelahData.stable(row.passage) === SelahData.stable(passage) && row.participantCount === count && (!event.endedAt || row.endedAt)) return;
        row.passage = passage; row.participantCount = count; row.updatedAt = Date.now();
        if (event.endedAt) row.endedAt = Number(event.endedAt);
      }
      persist(); scheduleSync(); render();
    });
    pending.set(roomKey, operation);
    try { await operation; } catch (error) { console.warn('Could not save private shared-reading history', error); }
    finally { if (pending.get(roomKey) === operation) pending.delete(roomKey); }
  }

  function saveName(id, value) {
    const row = (db.togetherReads || []).find(item => item.id === id);
    if (!row || !token || !accountStateReady) return;
    row.friendName = String(value || '').trim().slice(0, 80); row.updatedAt = Date.now();
    persist(); scheduleSync(); render(); toast(text('save'));
  }

  window.SelahTogetherBridge.recordRoom = recordTogetherRoom;
  document.addEventListener('selah-data-updated', () => {
    render();
    if (token && accountStateReady) {
      const active = window.SelahTogether?.current?.();
      if (active) void recordTogetherRoom(active);
    }
  });
  document.getElementById('signOut').addEventListener('click', () => setTimeout(render, 0));
  document.getElementById('languageSelect').addEventListener('change', () => setTimeout(render, 0));
  window.SelahTogetherHistory = { record: recordTogetherRoom, saveName, render };
  queueMicrotask(() => {
    render();
    const active = window.SelahTogether?.current?.();
    if (active) void recordTogetherRoom(active);
  });
})();
