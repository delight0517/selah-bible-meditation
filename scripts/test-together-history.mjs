import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/together-history.js', import.meta.url), 'utf8');
class Element {
  constructor() { this.children = []; this.style = {}; this.dataset = {}; this.listeners = new Map(); this.hidden = false; }
  set id(value) { this._id = value; if (this.ownerDocument) this.ownerDocument.ids.set(value, this); }
  get id() { return this._id; }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node); } }
  after(node) { node.parentElement = this.parentElement; this.parentElement.children.splice(this.parentElement.children.indexOf(this) + 1, 0, node); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
}
const ids = new Map();
const document = {
  ids, documentElement: { lang: 'ko' }, listeners: new Map(),
  createElement() { const node = new Element(); node.ownerDocument = document; return node; },
  getElementById(id) { return ids.get(id) || null; },
  addEventListener(name, callback) { this.listeners.set(name, callback); }
};
for (const id of ['friendList', 'signOut', 'languageSelect']) { const node = document.createElement('div'); node.id = id; node.parentElement = document.createElement('div'); node.parentElement.append(node); }
const db = { togetherReads: [] }, persisted = [];
const window = { SelahTogetherBridge: {}, SelahTogether: { current: () => null } };
const context = vm.createContext({ window, document, db, token: '', accountId: '', accountStateReady: false,
  activeBibleBooks: [{ id: 'MAT', name: 'Matthew' }], preferredLocale: () => 'en',
  SelahData: { stable: value => JSON.stringify(value) }, persist: () => persisted.push(structuredClone(db)), scheduleSync() {}, toast() {},
  crypto: webcrypto, TextEncoder, Uint8Array, Date, Map, Promise, Set, console, queueMicrotask, setTimeout });
vm.runInContext(source, context);
const room = { roomId: 'b'.repeat(32), passage: { book: 'MAT', chapter: 4, translation: 'KRV', language: 'ko' }, participantCount: 2 };
await window.SelahTogetherBridge.recordRoom(room);
assert.equal(db.togetherReads.length, 0, 'anonymous visits do not create account history');
context.token = 'account-token'; context.accountId = 'bluecloud|reader'; context.accountStateReady = true;
await window.SelahTogetherBridge.recordRoom(room);
assert.equal(db.togetherReads.length, 1); assert.equal(db.togetherReads[0].participantCount, 2);
assert.equal(db.togetherReads[0].id.length, 32); assert.notEqual(db.togetherReads[0].id, room.roomId, 'raw room ID is not persisted');
const writes = persisted.length; await window.SelahTogetherBridge.recordRoom(room);
assert.equal(db.togetherReads.length, 1); assert.equal(persisted.length, writes, 'unchanged presence is not saved again');
await window.SelahTogetherHistory.saveName(db.togetherReads[0].id, 'Mina');
assert.equal(db.togetherReads[0].friendName, 'Mina');
await window.SelahTogetherBridge.recordRoom({ ...room, passage: { ...room.passage, chapter: 5 }, participantCount: 3, endedAt: 1234 });
assert.equal(db.togetherReads[0].passage.chapter, 5); assert.equal(db.togetherReads[0].participantCount, 3); assert.equal(db.togetherReads[0].endedAt, 1234);
const beforeSwitch = db.togetherReads.length;
const pending = window.SelahTogetherBridge.recordRoom({ ...room, roomId: 'c'.repeat(32) });
context.accountId = 'bluecloud|other-reader'; await pending;
assert.equal(db.togetherReads.length, beforeSwitch, 'an account switch during hashing drops the stale write');
console.log('Private co-reading history PASS: auth gate, hashed room IDs, dedupe, nickname edit, passage/group/end updates, account-switch guard.');
