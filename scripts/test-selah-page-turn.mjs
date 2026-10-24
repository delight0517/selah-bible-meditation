import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'assets/selah-page-transition.js'), 'utf8');
let reduced = false, transitions = 0, animations = 0;
const passage = { style: {}, animate: () => { animations++; return { finished: Promise.resolve(), cancel() {} }; } };
globalThis.matchMedia = () => ({ get matches() { return reduced; } });
globalThis.window = {};
globalThis.document = {
  documentElement: { dataset: {} },
  querySelector: () => passage,
  getElementById: () => passage,
  startViewTransition: update => { transitions++; return { finished: Promise.resolve().then(update) }; }
};
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
let updated = 0;
await window.SelahPageTransition.run('next', () => { updated++; });
assert.equal(updated, 1);
assert.equal(transitions, 1);
assert.equal(passage.style.viewTransitionName, '');
assert.equal(document.documentElement.dataset.selahPageDirection, undefined);

reduced = true;
await window.SelahPageTransition.run('previous', () => { updated++; });
assert.equal(updated, 2);
assert.equal(transitions, 1, 'reduced motion skips transitions');

reduced = false;
document.startViewTransition = null;
await window.SelahPageTransition.run('previous', () => { updated++; });
assert.equal(updated, 3);
assert.equal(animations, 2, 'older browsers animate out and in');
console.log('PASS Selah page-turn direction, reduced motion, and Web Animations fallback');
