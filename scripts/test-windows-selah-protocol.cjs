'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform !== 'win32') {
  throw new Error('This protocol test requires Windows Script Host on Windows.');
}

const launcher = path.resolve(__dirname, '..', 'windows', 'Launch-Selah-App.vbs');
const isolatedLocalAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'selah-protocol-'));
const baseUrl = 'https://delight0517.github.io/selah-bible-meditation/?windowsShell=1';

function runLauncher(...args) {
  return spawnSync('cscript.exe', ['//nologo', launcher, '--dry-run', ...args], {
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, LOCALAPPDATA: isolatedLocalAppData }
  });
}

try {
  const defaultRun = runLauncher();
  assert.equal(defaultRun.status, 0, defaultRun.stderr || defaultRun.stdout);
  assert.ok(defaultRun.stdout.includes(`--app="${baseUrl}"`), defaultRun.stdout);

  const requestId = 'req_20261003-abc.9';
  const deepLinkRun = runLauncher(`selah://read?request=${requestId}`);
  assert.equal(deepLinkRun.status, 0, deepLinkRun.stderr || deepLinkRun.stdout);
  assert.ok(deepLinkRun.stdout.includes(`--app="${baseUrl}&homeAction=read&requestId=${requestId}"`), deepLinkRun.stdout);

  const invalidLinks = [
    'selah://open?request=req-1',
    'selah://read?request=',
    'selah://read?request=req-1&target=windows',
    'selah://read?request=req-1#fragment',
    'selah://read?request=req%2F1',
    'https://example.com/?request=req-1'
  ];
  for (const invalidLink of invalidLinks) {
    const rejected = runLauncher(invalidLink);
    assert.notEqual(rejected.status, 0, `Expected rejection: ${invalidLink}`);
    assert.match(rejected.stderr, /ERROR:/, `Missing rejection reason for ${invalidLink}`);
    assert.ok(!rejected.stdout.includes('--app='), `Rejected link was still launchable: ${invalidLink}`);
  }

  const duplicate = runLauncher('selah://read?request=one', 'selah://read?request=two');
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /Only one Selah reading link/);
  console.log('Windows Selah protocol checks passed.');
} finally {
  fs.rmSync(isolatedLocalAppData, { recursive: true, force: true });
}