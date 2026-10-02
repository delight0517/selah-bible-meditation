/* One data contract for the hosted UI and its desktop/mobile shells. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const collections = ['reflections', 'cards', 'qtLibrary', 'bibleChats', 'meditationFeedback', 'meditationPlaces', 'drafts'];
  const registers = ['selectedQt', 'gptContext', 'language', 'customPassage', 'customPassageActive', 'readerPrefs.desktop', 'readerPrefs.mobile', 'appearance'];
  const privateFields = new Set(['owner', 'draft', '_rev', 'token', 'authToken', 'authorization', '__proto__', 'constructor', 'prototype']);
  const liveFields = ['computerReadingRequest', 'computerReadingResult', 'computerReadingSession', 'readingState', 'meditationSession'];
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function stable(value) {
    if (value === undefined) return 'undefined';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    return '{' + Object.keys(value).filter(key => !['__proto__', 'constructor', 'prototype'].includes(key)).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  }
  function hash(value) {
    let n = 2166136261;
    for (const char of stable(value)) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
    return (n >>> 0).toString(36);
  }
  const get = (state, path) => path.split('.').reduce((value, key) => value?.[key], state);
  function set(state, path, value) {
    const parts = path.split('.');
    if (value === undefined) return;
    if (parts.length === 1) state[path] = clone(value);
    else { state[parts[0]] = { ...(state[parts[0]] || {}), [parts[1]]: clone(value) }; }
  }
  function metadata(state) {
    const old = state?._selahSync || {};
    if (Number(old.version) > VERSION) throw new Error('This account needs a newer Selah app. Local records are preserved.');
    return { version: VERSION, counter: Number(old.counter) || 0, fields: clone(old.fields || {}), records: clone(old.records || {}), deleted: clone(old.deleted || {}), recovery: clone(old.recovery || {}) };
  }
  const legacy = value => ({ at: Math.max(0, Number(value?.updatedAt || value?.createdAt) || 0), n: 0, device: 'legacy' });
  function compare(a = {}, b = {}) {
    return (Number(a.at) || 0) - (Number(b.at) || 0) || (Number(a.n) || 0) - (Number(b.n) || 0) || String(a.device || '').localeCompare(String(b.device || ''), 'en');
  }
  function choose(a, b, ca, cb) {
    if (a === undefined) return b;
    if (b === undefined) return a;
    const order = compare(ca, cb);
    return order > 0 || (order === 0 && stable(a) >= stable(b)) ? a : b;
  }
  function clockFor(meta, kind, key, value) { const old = meta[kind][key], fallback = legacy(value); return old && compare(old, fallback) >= 0 ? old : fallback; }
  function stamp(meta, device, now) {
    const seen = [...Object.values(meta.fields), ...Object.values(meta.records), ...Object.values(meta.deleted)];
    return { at: Math.max(Number(now) || 0, ...seen.map(c => Number(c.at) || 0)), n: ++meta.counter, device };
  }
  function observe(previous, next, device, now = Date.now(), platform = 'Web') {
    const meta = metadata(next);
    if (stable(previous.draft) !== stable(next.draft) || (next.draft?.text || next.draft?.prayer) && !(next.drafts || []).some(d => d.id === device)) {
      next.drafts = (next.drafts || []).filter(d => d.id !== device);
      if (next.draft?.text || next.draft?.prayer) next.drafts.push({ ...clone(next.draft), id: device, platform, updatedAt: now });
    }
    for (const name of collections) {
      const before = new Map((previous[name] || []).map(value => [value.id, value]));
      const after = new Map((next[name] || []).map(value => [value.id, value]));
      for (const [id, value] of after) {
        if (!id) throw new Error('Selah records must have stable IDs before saving.');
        const key = name + ':' + id;
        if (stable(before.get(id)) !== stable(value)) {
          meta.records[key] = stamp(meta, device, now);
          delete meta.deleted[key];
        }
      }
      for (const [id] of before) if (!after.has(id)) meta.deleted[name + ':' + id] = stamp(meta, device, now);
    }
    for (const path of registers) if (stable(get(previous, path)) !== stable(get(next, path))) meta.fields[path] = stamp(meta, device, now);
    next._selahSync = meta;
    return next;
  }
  function remember(meta, collection, id, value) {
    if (!value) return;
    const base = collection + ':' + id + ':' + hash(value);
    let key = base;
    // Do not lose two different values in the unlikely case of a hash collision.
    while (meta.recovery[key] && stable(meta.recovery[key].value) !== stable(value)) key += '~';
    meta.recovery[key] = { collection, id, value: clone(value) };
  }
  function mergeExtension(a, b) {
    if (a === undefined) return clone(b);
    if (b === undefined) return clone(a);
    if (Array.isArray(a) && Array.isArray(b)) return [...new Map([...a, ...b].map(value => [stable(value), clone(value)])).entries()].sort(([x], [y]) => x.localeCompare(y, 'en')).map(([, value]) => value);
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !['__proto__', 'constructor', 'prototype'].includes(key)).map(key => [key, mergeExtension(a[key], b[key])]));
    return clone(choose(a, b, legacy(a), legacy(b)));
  }
  function merge(local = {}, remote = {}) {
    const a = metadata(local), b = metadata(remote), meta = metadata({});
    meta.counter = Math.max(a.counter, b.counter);
    for (const kind of ['fields', 'records', 'deleted']) for (const key of new Set([...Object.keys(a[kind]), ...Object.keys(b[kind])])) meta[kind][key] = clone(compare(a[kind][key], b[kind][key]) >= 0 ? a[kind][key] : b[kind][key]);
    for (const source of [a.recovery, b.recovery]) for (const value of Object.values(source)) remember(meta, value.collection, value.id, value.value);
    const out = {};
    const modeled = new Set([...collections, ...registers.map(path => path.split('.')[0]), ...liveFields, 'firstUsedAt', 'attendanceDays', 'feedbackPrompt', 'customFontData', 'bibleContentLanguage', '_selahSync']);
    for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) if (!privateFields.has(key) && !modeled.has(key)) out[key] = mergeExtension(local[key], remote[key]);
    for (const name of collections) {
      const aa = new Map((local[name] || []).map(value => [value.id || name + '-' + hash(value), value]));
      const bb = new Map((remote[name] || []).map(value => [value.id || name + '-' + hash(value), value]));
      out[name] = [];
      for (const id of new Set([...aa.keys(), ...bb.keys()])) {
        const key = name + ':' + id, av = aa.get(id), bv = bb.get(id);
        const ac = clockFor(a, 'records', key, av), bc = clockFor(b, 'records', key, bv);
        const winner = choose(av, bv, ac, bc), wc = winner === av ? ac : bc;
        // Draft IDs identify a single writer; autosaves replace its earlier draft.
        // Different writers always retain separate draft IDs.
        if (name !== 'drafts' && av && bv && stable(av) !== stable(bv)) remember(meta, name, id, winner === av ? bv : av);
        if (meta.deleted[key] && compare(meta.deleted[key], wc) >= 0) { remember(meta, name, id, winner); continue; }
        if (winner) { out[name].push({ ...clone(winner), id }); meta.records[key] = clone(wc); }
      }
      out[name].sort((x, y) => (Number(x.createdAt || x.updatedAt) || 0) - (Number(y.createdAt || y.updatedAt) || 0) || x.id.localeCompare(y.id, 'en'));
    }
    for (const path of registers) {
      const av = get(local, path), bv = get(remote, path);
      set(out, path, choose(av, bv, clockFor(a, 'fields', path, av), clockFor(b, 'fields', path, bv)));
    }
    for (const key of ['readingState', 'meditationSession', 'computerReadingSession', 'feedbackPrompt', 'customFontData', 'bibleContentLanguage']) out[key] = clone(choose(local[key], remote[key], legacy(local[key]), legacy(remote[key]))) ?? null;
    if (local.bibleContentLanguage && remote.bibleContentLanguage && compare(legacy(local.bibleContentLanguage), legacy(remote.bibleContentLanguage)) === 0) out.bibleContentLanguage = clone(local.bibleContentLanguage.code <= remote.bibleContentLanguage.code ? local.bibleContentLanguage : remote.bibleContentLanguage);
    out.computerReadingRequest = clone(choose(local.computerReadingRequest, remote.computerReadingRequest, { at: local.computerReadingRequest?.createdAt }, { at: remote.computerReadingRequest?.createdAt })) ?? null;
    const requestId = out.computerReadingRequest?.id;
    const ar = local.computerReadingResult?.id === requestId ? local.computerReadingResult : undefined, br = remote.computerReadingResult?.id === requestId ? remote.computerReadingResult : undefined;
    out.computerReadingResult = clone(choose(ar, br, { at: ar?.completedAt }, { at: br?.completedAt })) ?? null;
    out.firstUsedAt = Math.min(...[local.firstUsedAt, remote.firstUsedAt].map(Number).filter(n => n > 0)) || Date.now();
    if (!Number.isFinite(out.firstUsedAt)) out.firstUsedAt = Date.now();
    out.attendanceDays = [...new Set([...(local.attendanceDays || []), ...(remote.attendanceDays || [])])].sort();
    out._selahSync = meta;
    out._rev = Number(remote._rev) || 0;
    return out;
  }
  function payload(state) {
    return Object.fromEntries(Object.entries(clone(state)).filter(([key]) => !privateFields.has(key)).concat([['_rev', Number(state._rev) || 0]]));
  }
  function portable(state) {
    const out = payload(state);
    delete out._rev;
    for (const field of liveFields.filter(field => field !== 'readingState')) delete out[field];
    // Importing a file is an explicit additive operation, not replay of old deletions.
    delete out._selahSync;
    out.recoveryArchive = clone(state._selahSync?.recovery || {});
    if (state.draft) out.draft = clone(state.draft);
    return { appId: 'selah', backupVersion: 1, exportedAt: new Date().toISOString(), state: out };
  }
  function importState(current, file) {
    if (file?.appId && file.appId !== 'selah' || file?.appId === 'selah' && file.backupVersion !== 1) throw new Error('Unsupported Selah backup');
    const source = clone(file?.appId === 'selah' ? file.state : file);
    if (!source || !Array.isArray(source.reflections) || !Array.isArray(source.cards)) throw new Error('Invalid Selah backup');
    for (const key of privateFields) delete source[key];
    delete source._selahSync;
    for (const key of liveFields) delete source[key];
    const importedDraft = file?.appId === 'selah' ? file.state?.draft : file?.draft;
    if (importedDraft?.text || importedDraft?.prayer) source.drafts = [...(source.drafts || []), { ...clone(importedDraft), id: 'imported-draft-' + hash(importedDraft), platform: 'Backup', updatedAt: 0 }];
    for (const name of collections) source[name] = (source[name] || []).map(value => current._selahSync?.deleted?.[name + ':' + value.id] ? { ...value, id: 'imported-' + hash(value) } : value);
    const archive = source.recoveryArchive || {};
    delete source.recoveryArchive;
    const combined = merge(current, source);
    for (const record of Object.values(archive)) if (collections.includes(record.collection)) remember(combined._selahSync, record.collection, record.id, record.value);
    return { ...current, ...combined, owner: current.owner, _rev: current._rev, draft: clone(current.draft || {}) };
  }
  root.SelahData = { VERSION, collections, registers, clone, stable, observe, merge, payload, portable, importState };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SelahData;
})(typeof globalThis !== 'undefined' ? globalThis : window);
