import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const source = new URL('./work-hub.mjs', import.meta.url);
const repo = 'https://github.com/example/app';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'selah-hub-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'docs'));
  const script = path.join(root, 'scripts/work-hub.mjs');
  const file = path.join(root, 'docs/work-hub.json');
  fs.copyFileSync(source, script);
  const initial = { schemaVersion: 2, scopeCatalog: [
    { id: 'test.one', resources: ['shared-resource'] },
    { id: 'test.two', resources: ['shared-resource'] },
    { id: 'test.three', resources: ['independent-resource'] },
  ], tasks: [], dataSources: [] };
  const read = () => JSON.parse(fs.readFileSync(file, 'utf8'));
  const write = (data) => fs.writeFileSync(file, JSON.stringify(data));
  write(initial);
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  const ok = (...args) => {
    const result = run(...args);
    assert.equal(result.status, 0, result.stderr);
    return read();
  };
  const reject = (...args) => {
    const before = fs.readFileSync(file, 'utf8');
    const result = run(...args);
    assert.notEqual(result.status, 0, `Unexpected success: ${args.join(' ')}`);
    assert.equal(fs.readFileSync(file, 'utf8'), before, 'Rejected operation changed the ledger');
    return result;
  };
  const claim = (id, scope = 'test.one', files = 'src/a.js', repoUrl = repo) => ['claim', '--id', id, '--owner', 'windows', '--scopes', scope, '--branch', `codex/${id}`, '--summary', 'test task', '--repo', repoUrl, '--thread', 'test-thread', '--base', '1234567', '--files', files];
  return { read, write, run, ok, reject, claim };
}

test('valid claim and evidence-backed completion persist', (t) => {
  const f = fixture(t);
  assert.equal(f.ok(...f.claim('task-a')).tasks[0].status, 'in_progress');
  f.reject('set', 'task-a', 'completed');
  assert.equal(f.ok('set', 'task-a', 'completed', '--evidence', 'verified deployment').tasks[0].status, 'completed');
  f.ok('check');
});

test('duplicate ID and scope are rejected without writing', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  f.reject(...f.claim('task-a'));
  f.reject(...f.claim('task-b', 'test.one', 'src/b.js'));
});

test('different scopes sharing a resource cannot be claimed', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  f.reject(...f.claim('task-b', 'test.two', 'src/b.js'));
});

test('exact file and ancestor-directory overlaps are rejected', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a', 'test.one', 'src'));
  f.reject(...f.claim('task-b', 'test.three', 'src/a.js'));
  f.reject(...f.claim('task-b', 'test.three', 'src'));
  f.ok(...f.claim('task-b', 'test.three', 'other/a.js'));
});

test('same paths in different repositories remain independent', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  f.ok(...f.claim('task-b', 'test.three', 'src/a.js', 'https://github.com/example/other'));
  f.ok('check');
});

test('repo URL aliases cannot bypass file conflicts', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  f.reject(...f.claim('task-b', 'test.three', 'src/a.js', `${repo}.git/`));
});

test('reactivating a completed task cannot duplicate a live scope', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  f.ok('set', 'task-a', 'completed', '--evidence', 'verified');
  f.ok(...f.claim('task-b'));
  f.reject('set', 'task-a', 'in_progress');
});

test('invalid paths and missing claim metadata are rejected', (t) => {
  const f = fixture(t);
  for (const files of ['../private', '/absolute', 'C:\\absolute', 'src/*.js']) f.reject(...f.claim('task-a', 'test.one', files));
  f.reject('claim', '--id', 'task-a');
});

test('overlapping paths within one owner are not cross-task conflicts', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a', 'test.one', 'src,src/a.js'));
  f.ok('check');
});

test('handoff enforces receipt, response, and resolution order', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  const h = f.ok('handoff', 'task-a', '--to', 'mac', '--text', 'review').tasks[0].handoffs[0].id;
  f.reject('respond', 'task-a', '--handoff', h, '--text', 'reviewed');
  f.reject('resolve', 'task-a', '--handoff', h, '--decision', 'accepted');
  f.ok('ack', 'task-a', '--handoff', h, '--receipt', 'verified receipt');
  f.ok('respond', 'task-a', '--handoff', h, '--text', 'reviewed');
  const result = f.ok('resolve', 'task-a', '--handoff', h, '--decision', 'accepted').tasks[0].handoffs[0];
  assert.equal(result.status, 'accepted');
  assert.ok(result.receivedAt && result.respondedAt && result.resolvedAt);
  f.reject('ack', 'task-a', '--handoff', h, '--receipt', 'duplicate');
  f.ok('check');
});

test('validator detects conflicting hand-edited ledger claims', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  const data = f.read();
  data.tasks.push({ ...data.tasks[0], id: 'task-b', scopes: ['test.three'] });
  f.write(data);
  assert.notEqual(f.run('check').status, 0);
});

test('validator rejects new active records without metadata', (t) => {
  const f = fixture(t);
  const data = f.read();
  data.tasks.push({ id: 'task-a', owner: 'windows', status: 'in_progress', scopes: ['test.one'] });
  f.write(data);
  assert.notEqual(f.run('check').status, 0);
});

test('validator rejects corrupt handoff status and missing receipts', (t) => {
  const f = fixture(t);
  f.ok(...f.claim('task-a'));
  const data = f.read();
  data.tasks[0].handoffs = [{ id: 'bad', from: 'windows', to: 'mac', status: 'accepted' }];
  f.write(data);
  assert.notEqual(f.run('check').status, 0);
});
