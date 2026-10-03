import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(mobileDir, '..');
const webDir = resolve(mobileDir, 'www');
await mkdir(webDir, { recursive: true });
for (const file of ['index.html', 'manifest.webmanifest', 'assets/selah-app.svg', 'assets/selah-app-192.png', 'assets/selah-app-512.png', 'windows/app-shell.js', 'scripts/computer-reading-handoff.js', 'scripts/google-login-recovery.js', 'styles/computer-reading-handoff.css', 'matthew-krv.json', 'matthew-web.json', 'matthew-jpn1965.json', 'matthew-cuv-simp.json', 'matthew-cuv-trad.json', 'bible-translations.json']) {
  const content = await readFile(resolve(repoDir, file), 'utf8');
  await mkdir(dirname(resolve(webDir, file)), { recursive: true });
  await writeFile(resolve(webDir, file), content);
}
