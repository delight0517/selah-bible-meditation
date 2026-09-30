import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(mobileDir, '..');
const webDir = resolve(mobileDir, 'www');
await mkdir(webDir, { recursive: true });
for (const file of ['index.html', 'matthew-krv.json']) {
  const content = execFileSync('git', ['show', `origin/main:${file}`], { cwd: repoDir, encoding: 'utf8' });
  await writeFile(resolve(webDir, file), content);
}
