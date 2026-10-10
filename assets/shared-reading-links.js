(() => {
  const base = 'https://delight0517.github.io/selah-bible-meditation/';
  const roomPattern = /^[a-f0-9]{32}$/;
  function parse(raw) {
    const link = new URL(raw, base);
    const native = link.protocol === 'selah:' && link.hostname === 'read' && !link.pathname;
    const web = link.origin === new URL(base).origin && link.pathname === new URL(base).pathname;
    if (!native && !web) return null;
    const room = link.searchParams.get('selahRoom') || new URLSearchParams(link.hash.slice(1)).get('selahRoom');
    if (room !== null && !roomPattern.test(room)) return null;
    const book = link.searchParams.get('selahBook'), chapter = Number(link.searchParams.get('selahPassage'));
    const verse = Number(link.searchParams.get('selahVerse') || 1);
    if (!/^[A-Z0-9]{3}$/.test(book || '') || !Number.isInteger(chapter) || chapter < 1 || chapter > 150 || !Number.isInteger(verse) || verse < 1 || verse > 200) return null;
    const language = link.searchParams.get('bibleLang') || 'ko';
    const translation = link.searchParams.get('selahTranslation');
    if (!/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(language) || (translation && !/^[A-Za-z0-9._-]{1,80}$/.test(translation))) return null;
    return { book, chapter, verse, language, translation, room };
  }
  function web(passage, room, verse = 1) {
    const link = new URL(base);
    for (const [name, value] of Object.entries({ homeAction: 'read', selahBook: passage.book, selahPassage: passage.chapter, selahVerse: verse, bibleLang: passage.language, selahTranslation: passage.translation })) {
      if (value != null) link.searchParams.set(name, String(value));
    }
    if (room) link.hash = 'selahRoom=' + room;
    if (!parse(link.href)) throw Error('Invalid shared Scripture link');
    return link.href;
  }
  function native(raw) {
    if (!parse(raw)) return null;
    const link = new URL(raw), target = new URL('selah://read');
    target.search = link.search; target.hash = link.hash;
    return target.href;
  }
  function route(raw, current) {
    const passage = parse(raw); if (!passage) return null;
    const target = new URL(current); target.search = new URL(web(passage, passage.room, passage.verse)).search;
    target.hash = passage.room ? 'selahRoom=' + passage.room : '';
    return target;
  }
  window.SelahReadingLinks = { parse, web, native, route };
})();
