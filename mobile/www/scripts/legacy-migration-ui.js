(() => {
  'use strict';
  const panel = document.createElement('section'); panel.className = 'saved'; panel.id = 'legacyMigrationPanel';
  const heading = document.createElement('h3'), status = document.createElement('p'), details = document.createElement('details'), summary = document.createElement('summary'), marks = document.createElement('div');
  status.setAttribute('role', 'status'); status.id = 'legacyMigrationStatus';
  const backupButton = document.createElement('button'); backupButton.className = 'btn secondary'; backupButton.type = 'button';
  details.append(summary, marks); panel.append(heading, status, backupButton, details);
  document.getElementById('unifiedDataPanel')?.after(panel);
  let report = { notes: 0, bookmarks: 0, highlights: 0, imported: [], skipped: [], errors: [] }, backupKey = '', running = false, seenOwner = db.owner || '@local';
  const ko = () => preferredLocale() === 'ko';
  function render() {
    if (seenOwner !== (db.owner || '@local')) {
      seenOwner = db.owner || '@local'; backupKey = localStorage.getItem('selah.migration.lastBackup.' + seenOwner) || '';
      report = { notes: 0, bookmarks: 0, highlights: 0, imported: [], skipped: [], errors: [] };
    }
    heading.textContent = ko() ? '이전 기록 가져오기' : 'Previous records';
    const imported = (db.legacyReaderArchives || []).length;
    status.textContent = ko() ? `이 기기의 이전 저장소 ${imported}개 보관 · 이번 이관 메모 ${report.notes}개, 북마크 ${report.bookmarks}개, 표시 ${report.highlights}개. ${token ? '내 계정 동기화 상태는 위의 마지막 통합 시각에서 확인하세요.' : '이 기기에 보관했습니다. 계정에 연결하면 함께 동기화됩니다.'}` : `${imported} source snapshots retained. Imported ${report.notes} notes, ${report.bookmarks} bookmarks, ${report.highlights} highlights. ${token ? 'Check the last sync time above.' : 'Stored locally; connect an account to synchronize.'}`;
    if (report.skipped.length) status.textContent += ko() ? ' 다른 계정에 이미 이관한 저장소는 제외했습니다.' : 'Sources claimed by another account were skipped.';
    if (report.errors.length) status.textContent += ko() ? ' 일부 원본이나 백업의 이관을 완료하지 못했습니다. 원본은 남아 있습니다.' : 'Some sources or backups could not be migrated. Originals are retained.';
    status.textContent += ko() ? ` 통합 묵상은 총 ${(db.reflections || []).length}개입니다.` : ` Total reflections: ${(db.reflections || []).length}.`;
    backupButton.textContent = ko() ? '이관 전 원본 백업 내려받기' : 'Download original migration backup';
    backupButton.hidden = !backupKey;
    summary.textContent = ko() ? '이전 북마크·형광 표시' : 'Imported bookmarks and highlights'; marks.replaceChildren();
    for (const mark of db.readerMarks || []) {
      const link = document.createElement('a'), [book, chapter] = String(mark.ref).split(':');
      link.href = `./${mark.locale}/?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}`;
      link.textContent = `${mark.locale} · ${mark.ref} · ${mark.kind}`;
      const line = document.createElement('p'); line.append(link); marks.append(line);
    }
    details.hidden = !(db.readerMarks || []).length;
  }
  backupButton.addEventListener('click', () => {
    const raw = localStorage.getItem(backupKey); if (!raw) return;
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    a.href = url; a.download = 'selah-original-migration-backup.json'; a.click(); URL.revokeObjectURL(url);
  });
  function run() {
    if (running) return; running = true;
    try {
      const result = SelahMigration.plan(db, localStorage);
      if (result.report.imported.length) {
        const id = 'selah.migration.backup.v1.' + Date.now() + '-' + crypto.randomUUID();
        // If backup storage fails, do not start the migration.
        localStorage.setItem(id, JSON.stringify(result.backup));
        if (!localStorage.getItem(id)) throw new Error('Migration backup was not saved');
        const before = db;
        try { db = result.state; normalize(); persist(); }
        catch (error) { db = before; throw error; }
        backupKey = id;
        localStorage.setItem('selah.migration.lastBackup.' + (db.owner || '@local'), id);
        report = result.report; scheduleSync(); renderNotes(); renderQuiz(); renderQtLibrary();
      } else if (result.report.errors.length || result.report.skipped.length) report = result.report;
      localStorage.setItem('selah.migration.claims.v1', JSON.stringify(result.claims));
      backupKey = backupKey || localStorage.getItem('selah.migration.lastBackup.' + (db.owner || '@local')) || '';
    } catch (error) {
      report.errors = [{ error: error.message }];
      status.textContent = ko() ? '이관을 완료하지 못했습니다. 원본 기록은 남아 있습니다.' : 'Migration did not finish. Originals are retained.';
    } finally { running = false; render(); }
  }
  window.addEventListener('selah-data-updated', () => { if (!running) render(); });
  document.getElementById('accountBtn')?.addEventListener('click', run);
  window.addEventListener('focus', run);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  window.addEventListener('storage', event => { if (SelahMigration.sources.some(source => source.key === event.key)) run(); });
  // The existing root store already uses the shared contract and retains its IDs.
  run();
})();
