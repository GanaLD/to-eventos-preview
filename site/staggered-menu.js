/* TO Eventos — StaggeredMenu React Bits, adaptado para vanilla JS + GSAP já existente no projeto. */
(() => {
  'use strict';
  const root = document.querySelector('[data-to-menu]');
  if (!root) return;

  const toggle = root.querySelector('.to-sm-toggle');
  const panel = root.querySelector('.to-sm-panel');
  const scrim = root.querySelector('.to-sm-scrim');
  const layers = Array.from(root.querySelectorAll('.to-sm-layer'));
  const labels = Array.from(root.querySelectorAll('.to-sm-item-label'));
  const home = root.querySelector('[data-to-menu-item="HOME"]');
  const toggleLabel = root.querySelector('.to-sm-toggle-label');
  const icon = root.querySelector('.to-sm-icon');
  if (!toggle || !panel || !scrim || layers.length !== 2 || !home || !icon) return;

  let open = false;
  let timeline = null;
  const gsap = window.gsap;
  const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  // Fonte única de transformação: o GSAP controla xPercent e não acumula
  // o translateX(105%) que anteriormente deixava o painel fora da tela.
  if (gsap && !reducedMotion()) {
    root.classList.add('has-gsap');
    gsap.set([panel, ...layers], { xPercent: 105, force3D: true });
  }
  const focusToggle = () => toggle.focus({ preventScroll: true });
  const focusHome = () => { if (open) home.focus({ preventScroll: true }); };

  // HTML continua interativo mesmo quando o CDN de GSAP está indisponível.
  function setInstantly(isOpen) {
    [panel, ...layers].forEach(el => {
      el.style.transform = isOpen ? 'translateX(0)' : 'translateX(105%)';
    });
    icon.style.transform = isOpen ? 'rotate(225deg)' : 'rotate(0deg)';
    if (!isOpen) root.classList.remove('is-visible');
    else focusHome();
  }

  function setOpen(next, restoreFocus = false) {
    if (next === open) return;
    open = next;
    root.classList.add('is-visible');
    root.classList.toggle('is-open', next);
    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
    toggleLabel.textContent = next ? 'FECHAR' : 'MENU';
    panel.inert = !next;
    panel.setAttribute('aria-hidden', String(!next));

    timeline?.kill();
    if (!gsap || reducedMotion()) {
      setInstantly(next);
      if (!next && restoreFocus) focusToggle();
      return;
    }

    gsap.killTweensOf([panel, ...layers, ...labels, icon]);
    timeline = gsap.timeline({
      onComplete: () => {
        if (next) focusHome();
        else root.classList.remove('is-visible');
      }
    });
    timeline.to(icon, { rotate: next ? 225 : 0, duration: next ? .7 : .34, ease: 'power3.out' }, 0);

    if (next) {
      gsap.set(layers, { xPercent: 105 });
      gsap.set(panel, { xPercent: 105 });
      gsap.set(labels, { yPercent: 115, rotate: 8, opacity: 0 });
      layers.forEach((layer, index) => {
        timeline.to(layer, { xPercent: 0, duration: .54, ease: 'power4.out' }, index * .075);
      });
      timeline.to(panel, { xPercent: 0, duration: .68, ease: 'power4.out' }, .15);
      timeline.to(labels, { yPercent: 0, rotate: 0, opacity: 1,
        duration: .7, ease: 'power4.out', stagger: .12 }, .27);
    } else {
      timeline.to(panel, { xPercent: 105, duration: .34, ease: 'power3.in' }, 0);
      layers.slice().reverse().forEach((layer, index) => {
        timeline.to(layer, { xPercent: 105, duration: .38, ease: 'power3.in' }, .06 + index * .055);
      });
      if (restoreFocus) focusToggle();
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));
  scrim.addEventListener('click', () => setOpen(false, true));
  home.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false, true);
    } else if (event.key === 'Tab') {
      // Enquanto o painel está aberto, o teclado circula pelos dois controles ativos.
      if (event.shiftKey && document.activeElement === home) {
        event.preventDefault(); focusToggle();
      } else if (!event.shiftKey && document.activeElement === toggle) {
        event.preventDefault(); focusHome();
      } else if (!event.shiftKey && document.activeElement === home) {
        event.preventDefault(); focusToggle();
      } else if (event.shiftKey && document.activeElement === toggle) {
        event.preventDefault(); focusHome();
      }
    }
  });
  window.addEventListener('pagehide', () => timeline?.kill(), { once: true });
})();
