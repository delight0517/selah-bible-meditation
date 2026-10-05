import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

globalThis.window = globalThis;
const require = createRequire(import.meta.url);
require('../assets/scripture-highlights.js');
const highlights = globalThis.SelahScriptureHighlights;

test('renders only selected text, escapes Scripture safely and tolerates overlapping colors', () => {
  const html = highlights.render('<Light & hope>', [
    { kind: 'highlight', start: 1, end: 6, color: 'green' },
    { kind: 'highlight', start: 4, end: 9, color: 'blue', updatedAt: 2 }
  ]);
  assert.equal(html, '&lt;<mark class="scripture-highlight scripture-highlight--green">Lig</mark><mark class="scripture-highlight scripture-highlight--blue">ht &amp; </mark>hope&gt;');
  assert.doesNotMatch(highlights.render('text', [{ kind: 'highlight', start: 0, end: 4, color: 'red' }]), /scripture-highlight--red/);
});

test('recolors selected text, preserves surrounding color and clears only the selected portion', () => {
  const initial = [{ id: 'old', ref: 'MAT:1:1', kind: 'highlight', locale: 'ko', color: 'yellow', start: 2, end: 12 }];
  const selection = [{ ref: 'MAT:1:1', start: 5, end: 8, verseLength: 20 }];
  const recolored = highlights.replaceSelection(initial, selection, 'ko', 'blue', 50);
  assert.deepEqual(recolored.map(({ start, end, color }) => ({ start, end, color })), [
    { start: 2, end: 5, color: 'yellow' }, { start: 8, end: 12, color: 'yellow' }, { start: 5, end: 8, color: 'blue' }
  ]);
  assert.equal(highlights.hasSelection(recolored, selection, 'ko'), true);
  const cleared = highlights.replaceSelection(recolored, selection, 'ko', null, 60);
  assert.deepEqual(cleared.map(({ start, end }) => [start, end]), [[2, 5], [8, 12]]);
  assert.equal(highlights.hasSelection(cleared, selection, 'ko'), false);
});

test('filters marks by Bible locale and provides translated labels', () => {
  const marks = [{ id: 'ko', ref: 'MAT:1:1', kind: 'highlight', locale: 'ko', color: 'pink', start: 0, end: 2 }];
  assert.equal(highlights.render('word', marks.filter(mark => mark.locale === 'en')), 'word');
  assert.equal(highlights.copy('ja').colors.blue, '青');
  assert.equal(highlights.copy('fil').saved, 'Na-highlight ang talata gamit ang kulay mo.');
});
