/* TO EVENTOS / Accordion Gallery V2 — implementação JS/CSS fiel aos parâmetros do React Bits.
   Não modifica as timelines GSAP/ScrollTrigger existentes. */
(() => {
  const root = document.querySelector('[data-accordion-gallery]');
  if (!root) return;
  const panels = [...root.querySelectorAll('[data-ag-panel]')];
  if (panels.length !== 5) return;
  const medias = panels.map(p => p.querySelector('.ag-panel__media'));
  const images = panels.map(p => p.querySelector('img[data-ag-fallback]'));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const count = panels.length;
  const ratio = Math.min(.9, Math.max(.2, Number(root.dataset.expandRatio) || .52));
  const grow = ratio * (count - 1) / (1 - ratio);
  const duration = .6, ease = 'power3.out', parallax = .5, tilt = 8, stagger = .06;
  let active = Math.min(count - 1, Math.max(0, Number(root.dataset.defaultIndex) || 2));
  let timeline = null, resizeObserver = null, isDisposed = false, lastSize = '';

  root.style.setProperty('--ag-grow', String(grow));
  const isVertical = () => getComputedStyle(root).flexDirection === 'column';
  const hasMotion = () => Boolean(gsap && !motion.matches);

  // Se o CDN não responder, cada painel mantém imagem local existente.
  images.forEach(image => {
    image.addEventListener('error', () => {
      const fallback = image.dataset.agFallback;
      if (!fallback || image.dataset.agFallbackUsed === 'true') return;
      image.dataset.agFallbackUsed = 'true';
      image.src = fallback;
    });
  });

  const measure = () => {
    const vertical = isVertical();
    const gap = parseFloat(getComputedStyle(root).gap) || 10;
    const total = vertical ? root.clientHeight : root.clientWidth;
    const usable = Math.max(total - gap * (count - 1), 120);
    const mediaSize = Math.max(140, usable * ratio * 1.22);
    root.style.setProperty('--ag-media-size', mediaSize + 'px');
    return { vertical, mediaSize };
  };

  const activate = (nextIndex, animate = true) => {
    if (isDisposed || nextIndex < 0 || nextIndex >= count) return;
    active = nextIndex;
    const { vertical, mediaSize } = measure();
    const usingGSAP = hasMotion();
    root.classList.toggle('ag-has-gsap', usingGSAP);
    timeline?.kill();
    timeline = null;

    panels.forEach((panel, i) => {
      const selected = i === active;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-pressed', String(selected));
    });

    if (!usingGSAP) {
      panels.forEach((panel, i) => {
        panel.style.flexGrow = i === active ? grow : 1;
        panel.style.transform = '';
        if (medias[i]) medias[i].style.transform = '';
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { duration: animate ? duration : 0, ease } });
    panels.forEach((panel, i) => {
      const selected = i === active;
      const rot = vertical || selected ? 0 : i < active ? tilt : -tilt;
      tl.to(panel, { flexGrow: selected ? grow : 1,
        rotationX: 0, rotationY: rot }, 0);
      if (medias[i]) {
        const drift = Math.max(-1.5, Math.min(1.5, active - i));
        const shift = drift * parallax * mediaSize * .06;
        tl.to(medias[i], {
          xPercent: -50, yPercent: -50,
          x: vertical ? 0 : selected ? 0 : shift,
          y: vertical && !selected ? shift : 0
        }, 0);
      }
      // Stagger leve entre a barra e o conteúdo, como no componente original.
      if (selected && animate) {
        const bar = panel.querySelector('.ag-panel__bar');
        const copy = panel.querySelector('.ag-panel__copy');
        if (bar && copy) tl.fromTo([bar, copy], { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: duration * .65, stagger, ease }, .06);
      }
    });
    timeline = tl;
  };

  panels.forEach((panel, i) => {
    panel.addEventListener('mouseenter', () => {
      if (precisePointer.matches && !isVertical()) activate(i);
    });
    panel.addEventListener('click', () => activate(i));
    panel.addEventListener('focus', () => activate(i));
    panel.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % count;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i - 1 + count) % count;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;
      else return;
      event.preventDefault();
      panels[next].focus();
    });
  });

  const onResize = () => {
    const next = root.clientWidth + ':' + root.clientHeight + ':' + isVertical();
    if (next === lastSize) return;
    lastSize = next;
    activate(active, false);
  };
  const onReducedChange = () => activate(active, false);
  activate(active, false);
  lastSize = root.clientWidth + ':' + root.clientHeight + ':' + isVertical();
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);
  }
  window.addEventListener('resize', onResize, { passive: true });
  motion.addEventListener?.('change', onReducedChange);
  const onHide = () => {
    isDisposed = true;
    timeline?.kill();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', onResize);
    motion.removeEventListener?.('change', onReducedChange);
  };
  window.addEventListener('pagehide', onHide);
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !isDisposed) return;
    isDisposed = false;
    resizeObserver?.observe(root);
    window.addEventListener('resize', onResize, { passive: true });
    motion.addEventListener?.('change', onReducedChange);
    lastSize = '';
    onResize();
  });
})();
