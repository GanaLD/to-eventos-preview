/* TO EVENTOS V4 — menu lateral sincronizado sem modificar o GSAP existente. */
(() => {
  const nav = document.getElementById('to-section-nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[data-section]')];
  const sections = links.map(link => ({ link, element: document.getElementById(link.dataset.section) })).filter(s => s.element);
  const progress = document.getElementById('to-section-progress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let requestedFrame = false;
  function updateNavigation() {
    requestedFrame = false;
    const anchor = Math.min(window.innerHeight * 0.4, 350);
    let current = sections[0];
    for (const section of sections) {
      const rect = section.element.getBoundingClientRect();
      if (rect.top <= anchor) current = section;
      if (rect.top <= anchor && rect.bottom > anchor) { current = section; break; }
    }
    for (const section of sections) {
      const active = section === current;
      section.link.classList.toggle('is-active', active);
      if (active) section.link.setAttribute('aria-current', 'location');
      else section.link.removeAttribute('aria-current');
    }
    const onLight = current?.element.classList.contains('section-light') || current?.element.classList.contains('projects-horizontal');
    nav.classList.toggle('is-on-light', Boolean(onLight));
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.transform = 'scaleY(' + ratio + ')';
  }
  function scheduleUpdate() {
    if (requestedFrame) return;
    requestedFrame = true;
    requestAnimationFrame(updateNavigation);
  }
  function sectionTop(element) {
    const st = window.ScrollTrigger;
    const pinned = element.id === 'hero'
      ? st?.getById('to-hero-film-and-copy') || st?.getById('to-hero-mobile-film-and-copy')
      : st?.getAll().find(trigger => trigger.trigger === element && trigger.pin);
    // Um elemento fixado não informa a posição original pelo seu retângulo.
    return Math.max(0, pinned ? pinned.start : element.getBoundingClientRect().top + window.scrollY);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const section = sections.find(item => '#' + item.element.id === url.hash);
    if (!section) return;
    event.preventDefault();
    // refresh() durante o toque cancela o smooth scroll no Chrome mobile.
    // Os pins já são atualizados nos eventos de carregamento e resize.
    window.scrollTo({top: sectionTop(section.element), behavior: reduceMotion ? 'instant' : 'smooth'});
    history.replaceState(null, '', url.hash);
    scheduleUpdate();
  });
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate, {passive:true});
  window.addEventListener('hashchange', scheduleUpdate);
  window.ScrollTrigger?.addEventListener('refresh', scheduleUpdate);
  document.fonts?.ready?.then(scheduleUpdate);
  scheduleUpdate();
})();
