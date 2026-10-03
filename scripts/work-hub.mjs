#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(repoRoot, 'docs', 'work-hub.json');
const liveStatuses = new Set(['claimed', 'in_progress', 'waiting_external', 'review']);
const statuses = new Set(['planned', ...liveStatuses, 'completed', 'canceled']);

function fail(message) {
  console.error(`Work Hub: ${message}`);
  process.exitCode = 1;
}

function readLedger() {
  return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
}

function writeLedger(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(ledgerPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseFlags(args) {
  const result = { _: [] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      result._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
    result[key] = args[++i];
  }
  return result;
}

function validate(data) {
  const issues = [];
  if (data.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (!Array.isArray(data.scopeCatalog) || !Array.isArray(data.tasks) || !Array.isArray(data.dataSources)) {
    issues.push('scopeCatalog, tasks, and dataSources must be arrays');
    return issues;
  }
  const scopes = new Set();
  for (const scope of data.scopeCatalog) {
    if (!scope?.id || !/^[-a-z0-9.]+$/.test(scope.id)) issues.push(`invalid scope id: ${scope?.id ?? '(missing)'}`);
    else if (scopes.has(scope.id)) issues.push(`duplicate scope catalog entry: ${scope.id}`);
    scopes.add(scope.id);
  }
  const ids = new Set();
  const activeScopeOwner = new Map();
  for (const task of data.tasks) {
    if (!task?.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id)) issues.push(`invalid task id: ${task?.id ?? '(missing)'}`);
    else if (ids.has(task.id)) issues.push(`duplicate task id: ${task.id}`);
    ids.add(task.id);
    if (!statuses.has(task.status)) issues.push(`${task.id}: invalid status ${task.status}`);
    if (!['mac', 'windows', 'shared'].includes(task.owner)) issues.push(`${task.id}: invalid owner ${task.owner}`);
    if (!Array.isArray(task.scopes) || task.scopes.length === 0) issues.push(`${task.id}: at least one scope is required`);
    for (const scopeId of task.scopes ?? []) {
      if (!scopes.has(scopeId)) issues.push(`${task.id}: unregistered scope ${scopeId}`);
      if (liveStatuses.has(task.status)) {
        const previous = activeScopeOwner.get(scopeId);
        if (previous) issues.push(`scope collision ${scopeId}: ${previous} and ${task.id} are both live`);
        else activeScopeOwner.set(scopeId, task.id);
      }
    }
  }
  const sourceIds = new Set();
  for (const source of data.dataSources) {
    if (!source?.id || sourceIds.has(source.id)) issues.push(`missing or duplicate data source id: ${source?.id ?? '(missing)'}`);
    sourceIds.add(source.id);
    if (!source.systemOfRecord || !Array.isArray(source.datasets) || !Array.isArray(source.limitations)) {
      issues.push(`${source.id}: systemOfRecord, datasets, and limitations are required`);
    }
  }
  return issues;
}

function usage() {
  console.log(`Selah Work Hub\n\n  node scripts/work-hub.mjs list\n  node scripts/work-hub.mjs check\n  node scripts/work-hub.mjs claim --id <id> --owner <mac|windows|shared> --scopes <scope,...> --branch <branch> --summary <text>\n  node scripts/work-hub.mjs set <id> <status> [--evidence <text>] [--next-action <text>]\n  node scripts/work-hub.mjs feedback <id> --from <mac|windows> --text <text>`);
}

function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help') return usage();
  const data = readLedger();
  if (command === 'check') {
    const issues = validate(data);
    if (issues.length) return fail(issues.join('\n'));
    console.log(`Work Hub valid: ${data.tasks.length} tasks, ${data.scopeCatalog.length} scopes, ${data.dataSources.length} data sources.`);
    return;
  }
  if (command === 'list') {
    for (const task of data.tasks) console.log(`${task.status.padEnd(16)} ${task.owner.padEnd(8)} ${task.id}  [${task.scopes.join(', ')}]`);
    return;
  }
  const flags = parseFlags(rawArgs);
  if (command === 'claim') {
    const required = ['id', 'owner', 'scopes', 'branch', 'summary'];
    for (const key of required) if (!flags[key]) throw new Error(`claim requires --${key}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flags.id)) throw new Error('--id must be a stable lowercase slug');
    if (!['mac', 'windows', 'shared'].includes(flags.owner)) throw new Error('--owner must be mac, windows, or shared');
    const scopeIds = [...new Set(flags.scopes.split(',').map((item) => item.trim()).filter(Boolean))];
    if (scopeIds.length === 0) throw new Error('--scopes must contain at least one registered scope ID');
    const unknown = scopeIds.filter((scopeId) => !data.scopeCatalog.some((scope) => scope.id === scopeId));
    if (unknown.length) throw new Error(`Register scope IDs in docs/work-hub.json first: ${unknown.join(', ')}`);
    if (data.tasks.some((task) => task.id === flags.id)) throw new Error(`Task ID already exists: ${flags.id}`);
    for (const scopeId of scopeIds) {
      const owner = data.tasks.find((task) => liveStatuses.has(task.status) && task.scopes.includes(scopeId));
      if (owner) throw new Error(`Scope ${scopeId} is already ${owner.status} under ${owner.id} (${owner.owner}). Add feedback or request a handoff instead.`);
    }
    data.tasks.push({ id: flags.id, summary: flags.summary, owner: flags.owner, status: 'in_progress', scopes: scopeIds, branch: flags.branch, evidence: [], nextAction: 'Update this record before handoff or completion.', feedback: [] });
    writeLedger(data);
    console.log(`Claimed ${flags.id}; commit and merge this hub record before editing the claimed source scope.`);
    return;
  }
  const id = flags._[0];
  const task = data.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Unknown task ID: ${id ?? '(missing)'}`);
  if (command === 'set') {
    const nextStatus = flags._[1];
    if (!statuses.has(nextStatus)) throw new Error(`Unknown status: ${nextStatus}`);
    task.status = nextStatus;
    if (flags.evidence) task.evidence.push(flags.evidence);
    if (flags['next-action']) task.nextAction = flags['next-action'];
    writeLedger(data);
    console.log(`Updated ${id}: ${nextStatus}`);
    return;
  }
  if (command === 'feedback') {
    if (!['mac', 'windows'].includes(flags.from) || !flags.text) throw new Error('feedback requires --from mac|windows and --text');
    task.feedback ??= [];
    task.feedback.push({ from: flags.from, at: new Date().toISOString(), text: flags.text });
    writeLedger(data);
    console.log(`Feedback appended to ${id}.`);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  fail(error.message);
}
