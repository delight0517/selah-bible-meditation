import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const expected = JSON.parse(await readFile(resolve(root, 'mobile/www/SHARED_SOURCE_MANIFEST.json')));
const target = process.argv[2] || resolve(root, 'mobile/ios/App/App/public');
const bundled = JSON.parse(await readFile(resolve(target, 'SHARED_SOURCE_MANIFEST.json')));
if (JSON.stringify(bundled) !== JSON.stringify(expected)) throw new Error('Stale native runtime manifest: run npm run sync:ios and rebuild.');
for (const [file, hash] of Object.entries(expected.files)) {
  const bytes = await readFile(resolve(target, file));
  const normalized = /\.(?:html|js|css|json|webmanifest|svg|txt)$/.test(file) ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
  if (createHash('sha256').update(normalized).digest('hex') !== hash) throw new Error('Stale native runtime file: ' + file);
}
console.log(`Verified ${Object.keys(expected.files).length} packaged runtime hashes: ${expected.version} / ${expected.build}`);
