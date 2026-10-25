/* TO EVENTOS — Accordion Gallery V1
   Adaptação JavaScript/CSS do comportamento Accordion Gallery (React Bits).
   Mantém o GSAP global existente; não cria ScrollTrigger, pin ou dependência React. */
(() => {
  const root = document.querySelector('[data-accordion-gallery]');
  if (!root) return;

  const panels = [...root.querySelectorAll('[data-ag-panel]')];
  if (!panels.length) return;

  const media = panels.map(panel => panel.querySelector('.ag-panel__media'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const ratio = Math.min(.9, Math.max(.2, Number(root.dataset.expandRatio) || .52));
  const duration = .6;
  const parallax = .5;
  const tilt = 8;
  let active = Math.max(0, Math.min(panels.length - 1, Number(root.dataset.defaultIndex) || 0));
  let timeline = null;
  let destroyed = false;

  const vertical = () => window.getComputedStyle(root).flexDirection === 'column';
  const animated = () => Boolean(gsap && !reduced.matches);

  const measure = () => {
    const isVertical = vertical();
    const total = isVertical ? root.clientHeight : root.clientWidth;
    const gap = parseFloat(window.getComputedStyle(root).gap) || 10;
    const usable = Math.max(total - gap * (panels.length - 1), 120);
    const size = Math.max(140, usable * ratio * 1.22);
    root.style.setProperty('--ag-media-size', size + 'px');
    return { isVertical, size };
  };

  const setActive = (index, motion = true) => {
    if (destroyed || index < 0 || index >= panels.length) return;
    active = index;
    const { isVertical, size } = measure();
    const grow = panels.length > 1 ? (ratio * (panels.length - 1)) / (1 - ratio) : 1;

    panels.forEach((panel, i) => {
      const selected = i === active;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-pressed', String(selected));
    });

    timeline?.kill();
    timeline = null;
    root.classList.toggle('ag-has-gsap', animated());

    if (!animated()) {
      panels.forEach((panel, i) => {
        panel.style.flexGrow = i === active ? grow : 1;
        panel.style.transform = '';
        if (media[i]) media[i].style.transform = '';
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { duration: motion ? duration : 0, ease: 'power3.out' } });
    panels.forEach((panel, i) => {
      const selected = i === active;
      const rot = isVertical ? 0 : selected ? 0 : (i < active ? tilt : -tilt);
      tl.to(panel, {
        flexGrow: selected ? grow : 1,
        rotationX: 0,
        rotationY: rot
      }, 0);

      if (media[i]) {
        const drift = Math.max(-1.5, Math.min(1.5, active - i));
        const shift = drift * parallax * size * .06;
        tl.to(media[i], {
          xPercent: -50,
          yPercent: -50,
          x: isVertical ? 0 : selected ? 0 : shift,
          y: isVertical && !selected ? shift : 0
        }, 0);
      }
    });
    timeline = tl;
  };

  panels.forEach((panel, i) => {
    // Hover só para ponteiro preciso. No touch, o clique muda o painel.
    panel.addEventListener('mouseenter', () => {
      if (finePointer.matches && !vertical()) setActive(i);
    });
    panel.addEventListener('click', () => setActive(i));
    panel.addEventListener('focus', () => setActive(i));
    panel.addEventListener('keydown', event => {
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      if (!forward && !backward) return;
      event.preventDefault();
      const next = (i + (forward ? 1 : -1) + panels.length) % panels.length;
      panels[next].focus();
    });
  });

  setActive(active, false);
  const ro = 'ResizeObserver' in window
    ? new ResizeObserver(() => setActive(active, false))
    : null;
  ro?.observe(root);
  const onResize = () => { if (!ro) setActive(active, false); };
  const onReducedChange = () => setActive(active, false);
  window.addEventListener('resize', onResize, { passive: true });
  reduced.addEventListener?.('change', onReducedChange);

  window.addEventListener('pagehide', () => {
    destroyed = true;
    timeline?.kill();
    ro?.disconnect();
    window.removeEventListener('resize', onResize);
    reduced.removeEventListener?.('change', onReducedChange);
  });
  // Restaurar a interatividade quando o navegador retorna pelo back/forward cache.
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !destroyed) return;
    destroyed = false;
    ro?.observe(root);
    window.addEventListener('resize', onResize, { passive: true });
    reduced.addEventListener?.('change', onReducedChange);
    setActive(active, false);
  });
})();
