import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

await import("./check-semantic-theme-contrast.mjs");

// Exercise the generator in an isolated fixture, never mutate a working tree.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = await mkdtemp(resolve(tmpdir(), 'selah-bundle-'));
const copy = async path => {
  const destination = resolve(fixture, path);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(root, path), destination, { recursive: true });
};
const run = (...args) => spawnSync(process.execPath, ['mobile/scripts/copy-web.mjs', ...args], { cwd: fixture, encoding: 'utf8' });
try {
  const manifest = JSON.parse(await readFile(resolve(root, 'mobile/www/SHARED_SOURCE_MANIFEST.json'), 'utf8'));
  for (const path of Object.keys(manifest.files)) await copy(path);
  await copy('mobile/scripts/copy-web.mjs');
  await copy('mobile/ios/App/App.xcodeproj/project.pbxproj');
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0);
  const html = resolve(fixture, 'index.html');
  await writeFile(html, (await readFile(html, 'utf8')) + '\n<script src="./scripts/new-feature.js"></script>');
  await writeFile(resolve(fixture, 'scripts/new-feature.js'), 'import "./feature-helper.js";');
  await writeFile(resolve(fixture, 'scripts/feature-helper.js'), 'export const feature = true;');
  assert.notEqual(run('--check').status, 0, 'New feature must fail until bundled');
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0);
  assert.equal(await readFile(resolve(fixture, 'mobile/www/scripts/feature-helper.js'), 'utf8'), 'export const feature = true;');
  await writeFile(resolve(fixture, 'mobile/www/scripts/new-feature.js'), 'stale');
  assert.notEqual(run('--check').status, 0, 'Stale mobile feature must fail');
  await rm(resolve(fixture, 'scripts/feature-helper.js'));
  assert.notEqual(run().status, 0, 'Missing runtime dependency must fail');
  console.log('Shared bundle checks passed: automatic dependencies, stale copies, missing files.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
