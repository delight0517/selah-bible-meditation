const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function activePassage() {
  return document.querySelector('#meditation.active #meditationVerse') || document.getElementById('verseText');
}

async function run(direction, update) {
  const passage = activePassage();
  if (!passage || reducedMotion.matches) return update();
  const root = document.documentElement;
  root.dataset.selahPageDirection = direction;
  if (document.startViewTransition) {
    passage.style.viewTransitionName = 'selah-page';
    const transition = document.startViewTransition(update);
    try { await transition.finished; }
    catch { /* The chapter update already committed; animation cancellation is harmless. */ }
    finally { passage.style.viewTransitionName = ''; delete root.dataset.selahPageDirection; }
    return;
  }
  const exit = passage.animate([
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: `translateX(${direction === 'next' ? '-12%' : '12%'})` }
  ], { duration: 140, easing: 'ease-in', fill: 'forwards' });
  await exit.finished.catch(() => {});
  await update();
  exit.cancel();
  const enter = passage.animate([
    { opacity: 0, transform: `translateX(${direction === 'next' ? '12%' : '-12%'})` },
    { opacity: 1, transform: 'translateX(0)' }
  ], { duration: 240, easing: 'ease-out' });
  await enter.finished.catch(() => {});
}

window.SelahPageTransition = { run };
