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
  for (const {link, element} of sections) {
    link.addEventListener('click', event => {
      event.preventDefault();
      window.ScrollTrigger?.refresh();
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({top, behavior: reduceMotion ? 'instant' : 'smooth'});
      history.replaceState(null, '', '#' + element.id);
      scheduleUpdate();
    });
  }
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate, {passive:true});
  window.addEventListener('hashchange', scheduleUpdate);
  window.ScrollTrigger?.addEventListener('refresh', scheduleUpdate);
  document.fonts?.ready?.then(scheduleUpdate);
  scheduleUpdate();
})();
