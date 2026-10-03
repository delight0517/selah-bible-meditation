import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), data = require('./unified-data.js'), migration = require('./legacy-migration.js');
const base = () => ({ owner: 'alice', reflections: [{ id: 'existing', text: 'original', tags: [] }], cards: [], draft: { text: 'active draft' }, firstUsedAt: 1, _rev: 7 });
const fixture = { notes: { 'MAT:1': 'previous note', 'invalid': 'retained in archive' }, bookmarks: ['MAT:1:2', 'MAT:1:2'], highlights: ['MAT:2:3'], position: { book: 'MAT', chapter: 1 }, unknown: ['keep'], token: 'do not import' };
const storage = values => { const map = new Map(Object.entries(values)); return { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) }; };
test('all three old reader formats preserve notes, marks and unknown source fields', () => {
  for (const source of migration.sources) {
    const converted = migration.convert(fixture, source.key, 100);
    assert.deepEqual(converted.counts, { notes: 1, bookmarks: 1, highlights: 1 });
    assert.deepEqual(converted.state.legacyReaderArchives[0].value.unknown, ['keep']);
    assert.equal(converted.state.legacyReaderArchives[0].value.token, undefined);
    const merged = migration.importFile(base(), fixture, source.key, 100);
    assert.equal(merged.reflections.length, 2); assert.equal(merged.readerMarks.length, 2);
    assert.equal(merged.owner, 'alice'); assert.equal(merged._rev, 7); assert.equal(merged.draft.text, 'active draft');
  }
});
test('planning is read-only and a repeated migration keeps the original stores and IDs', () => {
  const raw = JSON.stringify(fixture), store = storage({ 'selah.reader.es.v1': raw });
  const first = migration.plan(base(), store, 100);
  assert.equal(store.getItem('selah.migration.claims.v1'), null);
  assert.equal(first.backup.originals[0].raw, raw);
  store.setItem('selah.migration.claims.v1', JSON.stringify(first.claims));
  const second = migration.plan(first.state, store, 200);
  assert.equal(second.report.imported.length, 0); assert.equal(second.state.reflections.length, 2);
  assert.equal(store.getItem('selah.reader.es.v1'), raw);
});
test('another account does not receive a previously claimed local source', () => {
  const store = storage({ 'selah.reader.es.v1': JSON.stringify(fixture), 'selah.migration.claims.v1': JSON.stringify({ 'selah.reader.es.v1': { owner: 'alice' } }) });
  const result = migration.plan({ ...base(), owner: 'bob' }, store);
  assert.equal(result.report.skipped.length, 1); assert.equal(result.state.reflections.length, 1);
  assert.equal(result.backup.originals.length, 0);
});
test('linking anonymous records claims only records already present in the selected account', () => {
  const store = storage({ 'selah.reader.es.v1': JSON.stringify(fixture) });
  const first = migration.plan({ ...base(), owner: '' }, store, 100);
  store.setItem('selah.migration.claims.v1', JSON.stringify(first.claims));
  assert.equal(migration.plan({ ...first.state, owner: 'alice' }, store).claims['selah.reader.es.v1'].owner, 'alice');
  assert.equal(migration.plan(base(), store).report.skipped.length, 1);
});
test('a changed original becomes an additional note rather than overwriting a current edit', () => {
  const first = migration.importFile(base(), fixture, 'selah.reader.es.v1', 100);
  first.reflections[1].text = 'edited in current system';
  const changed = migration.importFile(first, { ...fixture, notes: { 'MAT:1': 'changed old reader note' } }, 'selah.reader.es.v1', 200);
  assert.equal(changed.reflections.length, 3);
  assert.ok(changed.reflections.some(note => note.text === 'edited in current system'));
});
test('the migration backup can be imported additively and preserves the active draft', () => {
  const store = storage({ 'selah.reader.es.v1': JSON.stringify(fixture) });
  const plan = migration.plan(base(), store, 100);
  const restored = migration.importFile({ ...base(), reflections: [] }, plan.backup);
  assert.equal(restored.reflections.length, 2); assert.equal(restored.readerMarks.length, 2);
  assert.equal(restored.draft.text, 'active draft');
  assert.equal(migration.importFile(restored, plan.backup).reflections.length, 2);
});
test('corrupt readers are preserved and do not block valid sources', () => {
  const raw = '{broken', store = storage({ 'selah.reader.es.v1': raw, 'selah.fil.reader.v1': JSON.stringify(fixture) });
  const result = migration.plan(base(), store, 100);
  assert.equal(result.report.errors.length, 1); assert.equal(result.report.imported.length, 1);
  assert.equal(result.backup.originals[0].raw, raw); assert.equal(store.getItem('selah.reader.es.v1'), raw);
});
test('unsupported files and foreign applications are rejected before changing the current records', () => {
  const current = base(), saved = JSON.stringify(current);
  assert.throws(() => migration.importFile(current, { appId: 'other', notes: {} }));
  assert.throws(() => migration.importFile(current, { appId: 'selah-migration', version: 2 }));
  assert.equal(JSON.stringify(current), saved);
});
test('background rescan does not restore deleted notes or marks from the original store', () => {
  const first = migration.importFile(base(), fixture, 'selah.reader.es.v1', 100);
  const next = data.clone(first); next.reflections = [next.reflections.find(note => note.id === 'existing')]; next.readerMarks = [];
  data.observe(first, next, 'device', 200);
  const store = storage({ 'selah.reader.es.v1': JSON.stringify({ ...fixture, extraPreference: 'changed' }) });
  const result = migration.plan(next, store, 300);
  assert.equal(result.state.reflections.length, 1); assert.equal(result.state.readerMarks.length, 0);
});
