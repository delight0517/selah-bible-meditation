(() => {
  if (globalThis.__selahGestureNavigation) return;
  globalThis.__selahGestureNavigation = true;
  const webext = globalThis.browser || globalThis.chrome;
  const labels = {
    next: /\b(next|continue|forward|next\s+(?:page|chapter|section))\b|다음|다음 장|다음 페이지|넘기기/i,
    previous: /\b(previous|prev|back|go back|previous\s+(?:page|chapter|section))\b|이전|이전 장|이전 페이지|뒤로/i
  };
  const visible = element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };
  function pageButton(direction) {
    const candidates = [...document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')]
      .filter(element => !element.disabled && visible(element))
      .map(element => {
        const label = [element.getAttribute('aria-label'), element.title, element.innerText, element.value, element.rel].filter(Boolean).join(' ');
        const rel = direction === 'previous' ? /^(prev|previous)$/i.test(element.rel) : element.rel === direction;
        const semantic = rel || labels[direction].test(label);
        return { element, semantic, rel };
      }).filter(candidate => candidate.semantic)
      .sort((a, b) => Number(b.rel) - Number(a.rel));
    return candidates[0]?.element || null;
  }
  function scrollTarget(dx, dy) {
    const candidates = [...document.elementsFromPoint(innerWidth / 2, innerHeight / 2), document.scrollingElement];
    return candidates.find(element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const vertical = dy && element.scrollHeight > element.clientHeight && /auto|scroll|overlay/.test(style.overflowY);
      const horizontal = dx && element.scrollWidth > element.clientWidth && /auto|scroll|overlay/.test(style.overflowX);
      return vertical || horizontal;
    }) || document.scrollingElement;
  }
  function navigate(action, mode) {
    if (action === 'scrollUp' || action === 'scrollDown') {
      const element = scrollTarget(0, 1);
      element.scrollBy({ top: (action === 'scrollUp' ? -1 : 1) * Math.max(180, element.clientHeight * 0.65), behavior: 'smooth' });
      return action === 'scrollUp' ? '본문을 위로 넘겼어요.' : '본문을 아래로 넘겼어요.';
    }
    if (action !== 'next' && action !== 'previous') return '읽기 이동 동작이 아니에요.';
    const button = pageButton(action);
    if (button) { button.click(); return action === 'next' ? '다음 페이지로 이동했어요.' : '이전 페이지로 이동했어요.'; }
    if (mode === 'horizontal') {
      const element = scrollTarget(1, 0);
      element.scrollBy({ left: (action === 'next' ? 1 : -1) * Math.max(180, element.clientWidth * 0.65), behavior: 'smooth' });
      return action === 'next' ? '가로로 다음 내용을 열었어요.' : '가로로 이전 내용을 열었어요.';
    }
    return '이 사이트에서 다음/이전 버튼을 찾지 못했어요. 가로 스크롤 모드로 바꿔 보세요.';
  }
  webext.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== 'selah-gesture') return;
    try { respond({ ok: true, status: navigate(message.action, message.mode) }); }
    catch { respond({ ok: false, status: '이 페이지가 제스처 이동을 허용하지 않아요.' }); }
  });
})();
