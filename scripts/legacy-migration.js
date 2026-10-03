/* Additive migration of the original standalone readers. Original stores are retained. */
(function (root) {
  'use strict';
  const sources = [
    { key: 'selah.reader.es.v1', locale: 'es', edition: 'Reina-Valera 1909' },
    { key: 'selah.reader.pt-br.v1', locale: 'pt-br', edition: 'Bíblia Livre 2018' },
    { key: 'selah.fil.reader.v1', locale: 'fil', edition: 'Ang Biblia' }
  ];
  const clean = value => {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['__proto__', 'constructor', 'prototype', 'token', 'authToken', 'authorization', 'password', 'cookies'].includes(key)).map(([key, item]) => [key, clean(item)]));
    return value;
  };
  function fingerprint(value) {
    const text = root.SelahData.stable(value);
    let a = 2166136261, b = 5381;
    for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
    return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0') + '-' + text.length;
  }
  function identify(file, sourceKey) {
    if (sourceKey) return sources.find(source => source.key === sourceKey);
    const edition = String(file?.edition || '');
    return sources.find(source => edition.includes(source.edition));
  }
  function convert(file, sourceKey, now = Date.now()) {
    const source = identify(file, sourceKey);
    if (!source || !file || typeof file !== 'object' || Array.isArray(file)) throw new Error('Unsupported legacy Selah reader');
    const raw = clean(file), digest = fingerprint(raw), reflections = [], readerMarks = [];
    for (const [ref, text] of Object.entries(raw.notes || {})) {
      if (!/^[A-Z0-9]{3}:\d+$/.test(ref) || typeof text !== 'string' || !text.trim()) continue;
      reflections.push({ id: 'legacy-' + source.locale + '-' + ref + '-' + fingerprint(text), ref, text, prayer: '', tags: ['imported', source.locale], date: '', createdAt: 0, updatedAt: 0, legacySource: source.key, legacyEdition: source.edition, legacyRef: ref });
    }
    for (const [name, kind] of [['bookmarks', 'bookmark'], ['highlights', 'highlight']]) {
      for (const ref of new Set(Array.isArray(raw[name]) ? raw[name] : [])) {
        if (typeof ref !== 'string' || !/^[A-Z0-9]{3}:\d+:\d+$/.test(ref)) continue;
        readerMarks.push({ id: 'legacy-' + source.locale + '-' + kind + '-' + ref, ref, kind, locale: source.locale, legacySource: source.key, createdAt: 0, updatedAt: 0 });
      }
    }
    // Preserve fields not understood by this release in a versioned source archive.
    const archive = { id: source.key + ':' + digest, sourceKey: source.key, locale: source.locale, digest, importedAt: now, value: raw };
    return { source, digest, state: { reflections, cards: [], readerMarks, legacyReaderArchives: [archive] }, counts: { notes: reflections.length, bookmarks: readerMarks.filter(item => item.kind === 'bookmark').length, highlights: readerMarks.filter(item => item.kind === 'highlight').length } };
  }
  function importFile(current, file, sourceKey, now) {
    if (file?.appId === 'selah-migration') {
      if (file.version !== 1 || !file.current || !Array.isArray(file.originals)) throw new Error('Unsupported migration backup');
      let combined = root.SelahData.importState(current, file.current);
      for (const original of file.originals) {
        if (!sources.some(source => source.key === original.key)) throw new Error('Unsupported original reader');
        combined = importFile(combined, JSON.parse(original.raw), original.key, now);
      }
      return combined;
    }
    if (identify(file, sourceKey)) return root.SelahData.importState(current, convert(file, sourceKey, now).state);
    return root.SelahData.importState(current, file);
  }
  function plan(current, storage, now = Date.now()) {
    const claims = JSON.parse(storage.getItem('selah.migration.claims.v1') || '{}'), owner = current.owner || '@local';
    const report = { imported: [], skipped: [], errors: [], notes: 0, bookmarks: 0, highlights: 0 }, originals = [];
    let state = root.SelahData.clone(current);
    for (const source of sources) {
      const raw = storage.getItem(source.key);
      if (!raw) continue;
      originals.push({ key: source.key, raw });
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid reader store');
        if (!Object.keys(parsed).length) continue;
        const converted = convert(parsed, source.key, now), claim = claims[source.key];
        const alreadyHere = (current.legacyReaderArchives || []).some(item => item.sourceKey === source.key && item.digest === converted.digest);
        if (claim && claim.owner !== owner && !(claim.owner === '@local' && alreadyHere)) { report.skipped.push(source.key); continue; }
        if (alreadyHere) { claims[source.key] = { owner, digest: converted.digest }; continue; }
        // Background migration must not resurrect a record deliberately deleted in the shared app.
        // Explicit backup import still restores such records as new copies.
        for (const name of ['reflections', 'readerMarks']) converted.state[name] = converted.state[name].filter(item => !current._selahSync?.deleted?.[name + ':' + item.id]);
        state = root.SelahData.importState(state, converted.state);
        claims[source.key] = { owner, digest: converted.digest };
        report.imported.push(source.key);
        for (const name of ['notes', 'bookmarks', 'highlights']) report[name] += converted.counts[name];
      } catch (error) { report.errors.push({ key: source.key, error: error.message }); }
    }
    return { state, report, claims, backup: { appId: 'selah-migration', version: 1, createdAt: now, current: root.SelahData.portable(current), originals } };
  }
  root.SelahMigration = { sources, clean, fingerprint, convert, importFile, plan };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SelahMigration;
})(typeof globalThis !== 'undefined' ? globalThis : window);
