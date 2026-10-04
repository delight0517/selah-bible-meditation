import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

// This DOM harness exercises the production client and its asynchronous API flow.
// It is not a browser or native device test.
const source = await readFile(new URL('../assets/together-reading.js', import.meta.url), 'utf8');
class Element {
  constructor(tag, document) {
    this.tagName = tag.toUpperCase(); this.document = document; this.children = [];
    this.parentElement = null; this.className = ''; this.style = {}; this.dataset = {};
    this.textContent = ''; this.hidden = false; this.scrollTop = 0;
    this.scrollHeight = 800; this.clientHeight = 200;
    this.classList = {
      add: name => { if (!this.className.split(' ').includes(name)) this.className += ' ' + name; },
      remove: name => { this.className = this.className.split(' ').filter(item => item !== name).join(' '); },
      contains: name => this.className.split(' ').includes(name)
    };
  }
  set id(value) { this._id = value; this.document.ids.set(value, this); }
  get id() { return this._id; }
  set innerHTML(value) {
    for (const match of value.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)) {
      const child = this.document.createElement(match[1]); child.id = match[2]; this.append(child);
    }
  }
  setAttribute(name, value) { this[name] = value; }
  removeAttribute(name) { if (name === 'data-together-peer') delete this.dataset.togetherPeer; else delete this[name]; }
  append(...elements) {
    for (const element of elements) {
      element.parentElement?.children.splice(element.parentElement.children.indexOf(element), 1);
      element.parentElement = this; this.children.push(element);
    }
  }
  before(element) {
    assert.ok(this.parentElement, 'insertion target must have a parent');
    element.parentElement = this.parentElement;
    this.parentElement.children.splice(this.parentElement.children.indexOf(this), 0, element);
  }
  after(element) {
    assert.ok(this.parentElement); element.parentElement = this.parentElement;
    this.parentElement.children.splice(this.parentElement.children.indexOf(this) + 1, 0, element);
  }
  replaceChildren(...elements) { this.children = []; this.append(...elements); }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [child, ...child.querySelectorAll('*')])
      .filter(child => selector === '*' || (selector[0] === '.' && child.classList.contains(selector.slice(1))) || (selector[0] === '#' && child.id === selector.slice(1)));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (selector[0] === '.' && node.classList.contains(selector.slice(1))) return node; return null; }
  getBoundingClientRect() { return { top: this.top || 0, bottom: (this.top || 0) + 60 }; }
  focus() {} select() {}
}
class Button extends Element {}
const roomId = 'a'.repeat(32), hostToken = 'b'.repeat(64);
const initialPassage = { book: 'MAT', chapter: 3, translation: 'KRV', language: 'ko' };
let room, calls = [], recordedRooms = [];
async function fetchMock(url, options) {
  const path = new URL(url).pathname, data = options.body ? JSON.parse(options.body) : null;
  calls.push({ path, method: options.method, data, headers: options.headers });
  if (path === '/rooms') {
    room = { roomId, passage: data.passage, timer: data.timer ? { durationMs: data.timer.durationMs, startedAt: Date.now(), endsAt: Date.now() + data.timer.durationMs } : null, participants: [], serverNow: Date.now() };
    return { ok: true, json: async () => ({ roomId, hostToken }) };
  }
  if (path.endsWith('/join')) room.participants.push({ participantId: data.participantId, verse: 1, active: true });
  if (path.endsWith('/presence')) Object.assign(room.participants.find(p => p.participantId === data.participantId), data);
  if (options.method === 'PATCH') {
    assert.equal(options.headers.authorization, 'Bearer ' + hostToken);
    if (data.passage) room.passage = data.passage;
    if (data.timer) room.timer = { durationMs: data.timer.durationMs, startedAt: Date.now(), endsAt: Date.now() + data.timer.durationMs };
  }
  if (path.endsWith('/leave')) room.participants = room.participants.filter(p => p.participantId !== data.participantId);
  room.serverNow = Date.now();
  return { ok: true, json: async () => structuredClone(room) };
}
function client(url = 'https://delight0517.github.io/selah-bible-meditation/?selah_qa=1') {
  const document = { ids: new Map(), visibilityState: 'visible', listeners: new Map() };
  document.createElement = tag => tag === 'button' ? new Button(tag, document) : new Element(tag, document);
  document.body = document.createElement('body');
  document.getElementById = id => document.ids.get(id) || null;
  document.querySelectorAll = selector => document.body.querySelectorAll(selector);
  document.querySelector = selector => document.body.querySelector(selector);
  document.addEventListener = (name, fn) => document.listeners.set(name, fn);
  function add(id, parent = document.body, tag = 'div') { const el = document.createElement(tag); el.id = id; parent.append(el); return el; }
  const library = add('library'); library.className = 'bible-library'; add('sharePassageMenu', library, 'button');
  const readerControls = add('readerControls'); readerControls.className = 'reader-controls passage-picker';
  add('passageBook', readerControls); add('toggleReaderFocus', readerControls, 'button');
  add('toggleMeditationTools', document.body, 'button'); add('shareTogether', document.body, 'button'); add('sharePassageModal');
  for (const id of ['verseText', 'meditationVerse']) {
    const reader = add(id); for (let index = 1; index <= 10; index++) {
      const verse = document.createElement('div'); verse.className = 'bible-verse'; verse.top = index * 60;
      const number = document.createElement('span'); number.className = 'bible-verse-num'; number.textContent = String(index); verse.append(number); reader.append(verse);
    }
  }
  const storage = new Map(), intervals = new Map(), timerCalls = [], opens = [], toasts = [];
  let current = { passage: structuredClone(initialPassage), timer: null, custom: false }, nextInterval = 0;
  const location = new URL(url);
  const bridge = {
    locale: () => 'ko', recordRoom: event => recordedRooms.push(structuredClone(event)), current: () => structuredClone(current), reader: () => document.getElementById('verseText'),
    toast: value => toasts.push(value), open: async passage => { opens.push(passage); current.passage = structuredClone(passage); },
    read: async () => {}, timer: async (...args) => { timerCalls.push(args); current.timer = { endsAt: args[0].endsAt - args[1] }; }
  };
  const window = { SelahTogetherBridge: bridge, addEventListener() {} };
  const context = vm.createContext({ window, document, HTMLButtonElement: Button, URL, URLSearchParams, location, crypto: webcrypto, Uint8Array, AbortSignal,
    fetch: fetchMock, Date, console,
    navigator: { clipboard: { writeText: async value => { window.copied = value; } } },
    sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    history: { replaceState: (_, __, value) => { const next = new URL(value, location); location.href = next.href; } },
    setInterval: fn => { intervals.set(++nextInterval, fn); return nextInterval; }, clearInterval: id => intervals.delete(id)
  });
  vm.runInContext(source, context);
  return { document, window, location, intervals, timerCalls, opens, toasts, recordedRooms, setCurrent: value => { current = value; }, async poll() { await [...intervals.values()][0]?.(); await settle(); } };
}
async function settle() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
const host = client();
const entry = host.document.getElementById('startTogetherReading');
assert.ok(entry, 'reading entry exists');
assert.equal(entry.closest('.bible-library'), null, 'entry must stay visible outside the library hidden in focus reading');
await entry.onclick.call(entry); await settle();
assert.equal(host.toasts.length, 0, 'creation succeeds');
assert.equal(calls.find(call => call.path.endsWith('/join')).data.participantId.length, 32);
assert.deepEqual(Object.keys(calls.find(call => call.path.endsWith('/join')).data), ['participantId'], 'room Worker receives no account identity');
const invite = host.document.getElementById('togetherInviteUrl').value;
assert.equal(new URL(invite).hash, '#selahRoom=' + roomId);
assert.equal(new URL(invite).searchParams.get('selah_qa'), '1');
assert.equal(new URL(invite).searchParams.has('selahFriend'), false, 'invite must not disclose account identity');
assert.ok(!invite.includes(hostToken), 'invitation contains no host token');
await host.document.getElementById('copyTogetherInvite').onclick();
assert.equal(host.window.copied, invite);
const guest = client(invite); await settle();
assert.deepEqual(JSON.parse(JSON.stringify(guest.opens.at(-1))), initialPassage, 'recipient opens exact shared passage');
assert.equal(guest.recordedRooms.at(-1).participantCount, 2, 'joining account records its current group size');
assert.equal(host.recordedRooms[0].passage.book, 'MAT', 'successful join emits a private account-history event');
assert.equal(host.recordedRooms[0].participantCount, 1);
const guestId = calls.filter(call => call.path.endsWith('/join')).at(-1).data.participantId;
room.participants.find(p => p.participantId === guestId).verse = 7;
await host.poll();
assert.equal(host.recordedRooms.at(-1).participantCount, 2, 'another reader joining updates the history');
const savedRecordCount = host.recordedRooms.length; await host.poll();
assert.equal(host.recordedRooms.length, savedRecordCount, 'regular presence polling does not save duplicate history');
const marker = host.document.getElementById('verseText').querySelectorAll('.bible-verse')[6];
assert.ok(marker.classList.contains('together-peer-verse'), 'remote verse receives the faint marker CSS class');
assert.match(marker.dataset.togetherPeer, /읽는 위치/);
const changedPassage = { ...initialPassage, chapter: 4 };
host.setCurrent({ passage: changedPassage, timer: { endsAt: Date.now() + 120000 }, custom: false });
await host.poll(); await guest.poll();
assert.deepEqual(JSON.parse(JSON.stringify(guest.opens.at(-1))), changedPassage, 'host chapter mutation reaches recipient');
assert.equal(host.recordedRooms.at(-1).passage.chapter, 4, 'passage changes update the local history callback');
assert.equal(host.timerCalls.length, 1); assert.equal(guest.timerCalls.length, 1);
await host.window.SelahTogether.leave(); await settle();
assert.ok(host.recordedRooms.at(-1).endedAt, 'leaving stamps a session end in private history');
assert.equal(host.timerCalls[0][0].endsAt, guest.timerCalls[0][0].endsAt, 'both clients apply the same authoritative timer end');
assert.ok(calls.some(call => call.method === 'PATCH' && call.data.passage));
assert.ok(calls.some(call => call.method === 'PATCH' && call.data.timer));
await guest.window.SelahTogether.leave();
assert.equal(guest.intervals.size, 0); assert.equal(guest.location.hash, '');
assert.ok(guest.document.querySelectorAll('.together-bar').every(bar => bar.hidden));
assert.equal(guest.document.querySelectorAll('.together-peer-verse').length, 0);
console.log('Together client integration PASS: focus entry, invitation privacy, copy, passage join, peer marker, host chapter/timer sync, leave cleanup.');
