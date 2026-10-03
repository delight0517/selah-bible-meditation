const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf('async function sync(){');
const end = html.indexOf('function hideDeveloperControls()', start);
assert(start > 0 && end > start);
const statuses = [], requests = [], storage = new Map();
const context = {
  SelahData: require('./unified-data.js'),
  selectUnifiedAccount: async () => {}, mergeSharedProgress: () => ({}), applyUnifiedAppearance() {},
  unifiedBaseline: {}, unifiedLastSyncAt: 0, window: {dispatchEvent() {}}, Event: class {},
  clearTimeout() {},
  token: 'test', accountId: 'test-account', username: 'test', accountStateReady: false,
  cloudRetryAttempts: 0, cloudRetryAt: 0, cloudRetryTimer: 0,
  db: { owner: 'test-account', _rev: 0, reflections: [], cards: [], qtLibrary: [], meditationFeedback: [], attendanceDays: [], meditationPlaces: [], bibleChats: [] },
  $: id => id === 'guideStart' ? null : { hidden: true },
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  guidePanel: { hidden: true }, guideExpired: () => true,
  setStatus: value => statuses.push(value),
  recoverCloud() {},
  request: async (path, options) => { requests.push(options?.method || 'GET'); return options?.method === 'PUT' ? { rev: 1 } : { state: null }; },
  normalize() {}, persist() {}, applyReaderPrefs() {}, applyLocale() {},
  loadBibleForLanguage: async () => {}, bibleContentLanguage: () => 'en',
  renderPassage() {}, renderNotes() {}, renderQtLibrary() {}, renderQuiz() {}, renderExperience() {}, applySharedProgress() {},
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);
(async () => {
  await context.sync();
  assert.deepEqual(requests, ['GET', 'PUT']);
  assert.equal(statuses.at(-1), 'synced');
  assert.equal(context.accountStateReady, true);
  assert.equal(context.db._rev, 1);
  console.log('PASS: cloud sync reaches Synced when optional guideStart is absent');
})().catch(error => { console.error(error); process.exitCode = 1; });
