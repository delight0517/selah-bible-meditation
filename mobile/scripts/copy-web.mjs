import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(mobileDir, '..');
const webDir = resolve(mobileDir, 'www');
const check = process.argv.includes('--check');
const release = JSON.parse(await readFile(resolve(repoDir, 'SHARED_APP_BUILD.json'), 'utf8'));
const files = ['index.html', 'home.html', 'privacy.html', 'manifest.webmanifest', 'magazine.json', 'windows/app-shell.js', 'scripts/unified-data.js', 'scripts/unified-data-ui.js', 'scripts/legacy-migration.js', 'scripts/legacy-migration-ui.js', 'scripts/computer-reading-handoff.js', 'scripts/google-login-recovery.js', 'styles/computer-reading-handoff.css', 'styles/desktop-polish.css', 'matthew-krv.json', 'matthew-web.json', 'matthew-jpn1965.json', 'matthew-cuv-simp.json', 'matthew-cuv-trad.json', 'bible-translations.json', 'SHARED_APP_BUILD.json'];
async function assets(directory) {
  for (const entry of await readdir(resolve(repoDir, directory), { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) await assets(path);
    else if (entry.isFile()) files.push(path);
  }

}
await assets('assets');
files.sort();
const hashes = {};
for (const file of files) {
  const canonical = bytes => /\.(?:html|js|css|json|webmanifest|svg|txt)$/.test(file) ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
  const content = canonical(await readFile(resolve(repoDir, file)));
  hashes[file] = createHash('sha256').update(content).digest('hex');
  const target = resolve(webDir, file);
  if (check) {
    const bundled = await readFile(target).catch(() => null);
    if (!bundled || !content.equals(canonical(bundled))) throw new Error('Stale mobile bundle: ' + file + '. Run npm run copy:web before platform sync.');
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}
const manifest = JSON.stringify({ appId: 'selah', version: release.version, build: release.build, dataContractVersion: release.dataContractVersion, source: release.canonicalUrl, files: hashes }, null, 2) + '\n';
const target = resolve(webDir, 'SHARED_SOURCE_MANIFEST.json');
if (check) {
  const bundledManifest = await readFile(target, 'utf8').catch(() => null);
  if (bundledManifest === null || bundledManifest.replace(/\r\n/g, '\n') !== manifest) throw new Error('Stale shared source manifest');
} else await writeFile(target, manifest);
console.log(`${check ? 'Verified' : 'Copied'} ${files.length} shared runtime files: ${release.version} / build ${release.build}`);

// Native bundle identity follows the same release descriptor as web/mobile UI.
const projectPath = resolve(mobileDir, 'ios/App/App.xcodeproj/project.pbxproj');
const project = await readFile(projectPath, 'utf8');
const versionedProject = project.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${release.build};`).replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${release.version};`);
if (check) { if (project !== versionedProject) throw new Error('Stale iOS build version; run npm run copy:web.'); }
else if (project !== versionedProject) await writeFile(projectPath, versionedProject);
