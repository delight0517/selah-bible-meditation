import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../assets/bible-edition-wishlist.js', import.meta.url), 'utf8');
const windowsShell = await readFile(new URL('../windows/app-shell.js', import.meta.url), 'utf8');
assert.match(windowsShell, /Quiet office reading/);
assert.match(windowsShell, /조용한 오피스 읽기/);
assert.match(windowsShell, /Ctrl\+Shift\+F/);
const context = {
  window: {},
  document: { readyState: 'loading', documentElement: { lang: 'en' }, addEventListener() {} },
  URL
};
runInNewContext(source, context);
const wishlist = context.window.SelahBibleEditionWishlist;
assert.ok(wishlist);

assert.equal(wishlist.normalizeEditionName('  Revised\n  Edition\u0000 '), 'Revised Edition');
assert.equal(wishlist.normalizeLanguage('ar'), 'ar');
assert.equal(wishlist.normalizeLanguage('unexpected'), 'other');
assert.equal(wishlist.normalizeHttpsUrl('https://publisher.example/edition'), 'https://publisher.example/edition');
assert.throws(() => wishlist.normalizeHttpsUrl('http://publisher.example/edition'), /source_url_https_only/);
assert.throws(() => wishlist.normalizeHttpsUrl('javascript:alert(1)'), /source_url_https_only/);
assert.equal(wishlist.languageForCatalog('eng'), 'en');
assert.equal(wishlist.languageForCatalog('jpn'), 'ja');

const local = new Map();
const storage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value) };
let nextId = 0;
const store = wishlist.createStore(storage, { now: () => 1000, makeId: () => `wish-${++nextId}` });
const first = store.add({ editionName: 'Revised Korean Bible', language: 'ko', catalogId: 'KRV1961', sourceUrl: 'https://publisher.example/krv', shareConsent: false });
assert.equal(first.item.id, 'wish-1');
assert.equal(first.item.shareConsent, false);
const duplicate = store.add({ editionName: 'Different alias', language: 'ko', catalogId: 'KRV1961', shareConsent: true, paidInterest: true });
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.item.shareConsent, true);
assert.equal(duplicate.item.paidInterest, true);
assert.equal(store.all().length, 1);
assert.equal(store.wasShared(wishlist.interestKey(first.item, 'read')), false);
store.markShared(wishlist.interestKey(first.item, 'read'));
assert.equal(store.wasShared(wishlist.interestKey(first.item, 'read')), true);
assert.equal(store.remove(first.item.id), true);
assert.equal(store.all().length, 0);
assert.equal(store.wasShared(wishlist.interestKey(first.item, 'read')), true);

const unsafeLocal = new Map([[wishlist.STORAGE_KEY, JSON.stringify({ version: 1, items: [{ id: 'unsafe', editionName: 'Imported test edition', language: 'en', sourceUrl: 'javascript:alert(1)', shareConsent: false, paidInterest: true }], shared: [] })]]);
const sanitized = wishlist.createStore({ getItem: key => unsafeLocal.get(key) ?? null, setItem: (key, value) => unsafeLocal.set(key, value) }).all()[0];
assert.equal(sanitized.sourceUrl, '');
assert.equal(sanitized.paidInterest, false);

const event = wishlist.safeEvent({ editionName: 'Revised Korean Bible', language: 'ko', catalogId: 'KRV1961' }, 'paid');
assert.deepEqual(JSON.parse(JSON.stringify(event)), {
  appId: 'selah', editionName: 'Revised Korean Bible', editionId: 'KRV1961', language: 'ko', interestType: 'paid', locale: 'en'
});
const sent = [];
assert.equal(await wishlist.sendInterest({ editionName: 'Revised Korean Bible', language: 'ko', catalogId: 'KRV1961' }, 'read', async (url, options) => {
  sent.push({ url, options });
  return { ok: true };
}), true);
assert.equal(sent[0].options.credentials, 'omit');
assert.equal(sent[0].options.method, 'POST');
assert.equal(JSON.parse(sent[0].options.body).editionName, 'Revised Korean Bible');
assert.equal(JSON.parse(sent[0].options.body).notes, undefined);

const nativeContext = {
  window: { Capacitor: { isNativePlatform: () => true } },
  document: { readyState: 'loading', documentElement: { lang: 'en' }, addEventListener() {} },
  URL
};
runInNewContext(source, nativeContext);
let nativeRequests = 0;
assert.equal(await nativeContext.window.SelahBibleEditionWishlist.sendInterest({ editionName: 'Test edition', language: 'en' }, 'read', async () => { nativeRequests += 1; return { ok: true }; }), false);
assert.equal(nativeRequests, 0);
console.log('Bible edition wishlist: local-only storage, validation, duplicate handling, opt-in event shape, no credentials, and native sharing gate passed');
