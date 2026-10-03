import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pages = [
  ['fil/index.html', 'fil-PH', 'SoftwareApplication', 'Ang Biblia 1905 sa Tagalog, libre | Selah', 'Selah: Bibliya at pagninilay', 'assets/previews/selah-fil.png', 'Ang Biblia 1905 sa Tagalog, mga minarkahang talata at pribadong pagninilay'],
  ['es/index.html', 'es', 'SoftwareApplication', 'Biblia Reina-Valera 1909 gratis | Selah', 'Selah Biblia y reflexión', 'assets/previews/selah-es.png', 'Lee la Reina-Valera 1909 y guarda reflexiones privadas en tu dispositivo'],
  ['pt-br/index.html', 'pt-BR', 'SoftwareApplication', 'Bíblia Livre 2018 grátis para ler e refletir | Selah', 'Selah Bíblia e reflexão', 'assets/previews/selah-pt-br.png', 'Leia a Bíblia Livre 2018 e guarde suas reflexões neste dispositivo'],
  ['fil/guide/index.html', 'fil-PH', 'Article', 'Paano Magnilay sa Biblia Araw-araw | Selah', 'Paano magnilay sa Biblia araw-araw', 'fil/selah-tagalog-preview.png', 'Gabay sa pagbasa ng Biblia at pribadong pagninilay sa Tagalog'],
  ['pt-br/guia/index.html', 'pt-BR', 'Article', 'Como meditar na Bíblia quando a rotina é corrida | Selah', 'Como meditar na Bíblia quando a rotina é corrida', 'assets/previews/selah-pt-br.png', 'Bíblia Livre 2018: leitura por capítulo e espaço para anotar reflexões']
];
const baseUrl = 'https://delight0517.github.io/selah-bible-meditation/';
const value = (html, pattern, label) => {
  const match = html.match(pattern);
  assert.ok(match, `${label} is required`);
  return match[1];
};

for (const [file, locale, expectedType, expectedTitle, expectedName, expectedImage, expectedImageAlt] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const canonical = value(html, /<link rel="canonical" href="([^"]+)"/i, `${file} canonical`);
  const lang = value(html, /<html lang="([^"]+)"/i, `${file} language`);
  const title = value(html, /<title>([^<]+)<\/title>/i, `${file} title`);
  const description = value(html, /<meta name="description" content="([^"]+)"/i, `${file} description`);
  const ogTitle = value(html, /<meta property="og:title" content="([^"]+)"/i, `${file} Open Graph title`);
  const ogDescription = value(html, /<meta property="og:description" content="([^"]+)"/i, `${file} Open Graph description`);
  const ogUrl = value(html, /<meta property="og:url" content="([^"]+)"/i, `${file} Open Graph URL`);
  const ogImage = value(html, /<meta property="og:image" content="([^"]+)"/i, `${file} Open Graph image`);
  const ogImageAlt = value(html, /<meta property="og:image:alt" content="([^"]+)"/i, `${file} Open Graph image alt`);
  const twitterCard = value(html, /<meta name="twitter:card" content="([^"]+)"/i, `${file} Twitter card`);
  const twitterTitle = value(html, /<meta name="twitter:title" content="([^"]+)"/i, `${file} Twitter title`);
  const twitterDescription = value(html, /<meta name="twitter:description" content="([^"]+)"/i, `${file} Twitter description`);
  const twitterImage = value(html, /<meta name="twitter:image" content="([^"]+)"/i, `${file} Twitter image`);
  const schemaText = value(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, `${file} JSON-LD`);
  const schema = JSON.parse(schemaText);

  assert.equal(lang, locale, `${file} language metadata`);
  assert.equal(ogTitle, title, `${file} Google/share title alignment`);
  assert.equal(twitterTitle, title, `${file} Twitter title alignment`);
  assert.equal(ogDescription, description, `${file} Google/share description alignment`);
  assert.equal(twitterDescription, description, `${file} Twitter description alignment`);
  assert.equal(ogUrl, canonical, `${file} canonical and Open Graph URL`);
  assert.equal(twitterCard, 'summary_large_image');
  assert.equal(title, expectedTitle, `${file} locale-specific title`);
  assert.equal(schema.name ?? schema.headline, expectedName, `${file} locale-specific structured-data name`);
  assert.equal(ogImageAlt, expectedImageAlt, `${file} locale-specific image description`);
  assert.equal(ogImage, baseUrl + expectedImage, `${file} expected preview image`);
  assert.equal(twitterImage, ogImage, `${file} Open Graph and Twitter preview image`);
  assert.equal(schema.image, ogImage, `${file} structured-data and preview image`);
  assert.ok(title.length <= 60, `${file} title should avoid the observed truncation length`);
  assert.ok(description.length <= 160, `${file} description should avoid the observed truncation length`);
  assert.equal(schema['@type'], expectedType, `${file} localized structured-data type`);
  assert.equal(schema.inLanguage, locale, `${file} structured-data language`);
  assert.equal(schema.description, description, `${file} structured-data description`);
  if (expectedType === 'SoftwareApplication') assert.equal(schema.url, canonical);
  else assert.equal(schema.mainEntityOfPage, canonical);

  assert.ok(fs.existsSync(path.join('.', expectedImage)), `${file} image asset exists: ${expectedImage}`);
}

console.log('Localized search titles, descriptions, canonical URLs, images and JSON-LD passed for 5 pages.');
