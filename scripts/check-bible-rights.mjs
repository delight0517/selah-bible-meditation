import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const registry = JSON.parse(await readFile(new URL('../bible-rights.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('../bible-translations.json', import.meta.url), 'utf8'));
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const row of catalog.translations) {
  const rights = registry.editions[row.id];
  assert.ok(rights, `Missing rights record for ${row.id}`);
  assert.ok(rights.sourceUrl?.startsWith('https://'), `Missing HTTPS source for ${row.id}`);
  assert.ok(rights.license && rights.requiredAttribution && rights.jurisdiction, `Incomplete rights record for ${row.id}`);
  if (rights.rightsStatus !== 'verified') {
    assert.equal(rights.downloadAllowed, false, `${row.id}: unverified edition cannot be downloaded`);
    assert.equal(rights.ads, 'block', `${row.id}: unverified edition must suppress ads`);
  }
  if (rights.commercialUse === false) assert.equal(rights.ads, 'block', `${row.id}: noncommercial edition must suppress ads`);
}
for (const [id, rights] of Object.entries(registry.bundled)) {
  assert.ok(rights.sourceUrl?.startsWith('https://'), `Missing HTTPS source for bundled ${id}`);
  assert.ok(rights.license && rights.requiredAttribution && rights.jurisdiction, `Incomplete bundled rights record for ${id}`);
  if (rights.rightsStatus !== 'verified') assert.equal(rights.downloadAllowed, false, `${id}: unverified bundled text cannot be redistributed anew`);
  if (rights.commercialUse !== true) assert.equal(rights.ads, 'block', `${id}: commercial permission unknown or denied`);
}
assert.equal(registry.bundled['ko-krv1961'].edition, '개역한글판 (1961)');
assert.equal(registry.editions.kor_old.edition, '한국어 성경 (1910)');
assert.notEqual(registry.editions.kor_old.edition, registry.bundled['ko-krv1961'].edition, '1961 bundled KRV must not be conflated with the API 1910 Korean Bible');
assert.equal(registry.editions.eng_aoi.commercialUse, false);
assert.equal(registry.editions.eng_aoi.ads, 'block');
assert.equal(registry.editions.GHT.commercialUse, true, 'GHT legal public-domain grant is distinct from creator preference');
assert.equal(registry.editions.GHT.commercialPreference, 'creator_opposes_commercialization');
assert.equal(registry.editions.GHT.ads, 'block', 'Selah honors the creator preference without mislabeling it as an NC license');
assert.match(html, /window\.SelahBibleRights=.*canServeAds/);
assert.match(html, /async function bibleDeviceAdPolicy\(\)/);
assert.match(html, /downloadCompleteBible\(id,language,rightsId\).*canDownload/s);
assert.match(html, /id=\"bibleRightsNotice\"/);
console.log(`Bible rights registry valid: ${catalog.translations.length} catalog editions, ${Object.keys(registry.bundled).length} bundled editions.`);
