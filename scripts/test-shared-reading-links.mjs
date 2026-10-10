import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window = {};
vm.runInNewContext(fs.readFileSync(new URL('../assets/shared-reading-links.js', import.meta.url), 'utf8'), { window, URL, URLSearchParams });
const links = window.SelahReadingLinks;
const room = 'a'.repeat(32);
const passage = { book: 'LUK', chapter: 4, translation: 'KRV', language: 'ko' };
const web = links.web(passage, room, 7), native = links.native(web);
for (const input of [web, native]) {
  const target = links.route(input, 'capacitor://localhost/');
  const parsed = links.parse(input);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), { ...passage, verse: 7, room });
  assert.equal(target.searchParams.get('selahTranslation'), 'KRV');
  assert.equal(target.searchParams.get('selahVerse'), '7');
  assert.equal(target.hash, '#selahRoom=' + room);
}
assert.equal(new URL(web).protocol, 'https:', 'no-app fallback remains an ordinary HTTPS page');
assert.equal(links.parse(web.replace('delight0517.github.io', 'example.com')), null);
assert.equal(links.parse(web.replace('selahPassage=4', 'selahPassage=0')), null);
assert.equal(links.parse(web.replace('selahVerse=7', 'selahVerse=201')), null);
assert.equal(links.parse(web.replace(room, 'invalid')), null);
assert.equal(links.parse('selah://auth?token=private'), null);
assert.ok(!native.includes('hostToken'));
console.log('Shared-link contract PASS: browser/native preserve book, chapter, verse, translation, language and room; invalid routes rejected. OS app selection is not covered.');

if (process.argv.includes('--live')) {
  const endpoint = 'https://selah-together.rogan2534.workers.dev';
  const ids = ['1'.repeat(32), '2'.repeat(32)];
  let created;
  async function request(path, body) {
    const response = await fetch(endpoint + path, { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'https://delight0517.github.io' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    assert.ok(response.ok, 'live room request returned HTTP' + response.status);
    return response.json();
  }
  try {
    const expected = { book: 'MAT', chapter: 3, language: 'en', translation: 'ENGWEBP' };
    created = await request('/rooms', { passage: expected, timer: null });
    const a = await request('/rooms/' + created.roomId + '/join', { participantId: ids[0] });
    const b = await request('/rooms/' + created.roomId + '/join', { participantId: ids[1] });
    assert.deepEqual(a.passage, expected); assert.deepEqual(b.passage, expected);
    assert.equal(b.participants.length, 2);
    const link = links.web(expected, created.roomId, 7);
    assert.deepEqual(JSON.parse(JSON.stringify(links.parse(links.native(link)))), { ...expected, verse: 7, room: created.roomId });
    console.log('Live Worker PASS: two distinct participants joined one exact passage/edition room; browser/native invitation contract agrees. Not an OS/UI test.');
  } finally {
    if (created) for (const participantId of ids) await request('/rooms/' + created.roomId + '/leave', { participantId });
  }
}
