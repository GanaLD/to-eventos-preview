/* TO Eventos — Sobre / Scroll cinematográfico alinhado.
   Intro: Hero e Sobre são sobrepostos no mesmo contêiner fixado.
   Serviços: duas elevações curtas.
   Capítulos: só há pin lateral quando TODOS cabem inteiros na viewport.
   FAQ, contato e rodapé permanecem em fluxo vertical normal.
 */
(() => {
  'use strict';

  const root = document.querySelector('body.sobre-page');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!root || !gsap || !ScrollTrigger || typeof gsap.matchMedia !== 'function') return;

  const stage = document.querySelector('[data-sobre-intro]');
  const pin = document.querySelector('[data-sobre-intro-pin]');
  const hero = stage?.querySelector('.sobre-hero');
  const entrance = stage?.querySelector('[data-sobre-slide-right]');
  const services = document.querySelector('[data-sobre-services]');
  const heading = services?.querySelector('[data-sobre-rise-heading]');
  const details = services?.querySelector('[data-sobre-rise-details]');
  const horizontal = document.querySelector('[data-sobre-horizontal]');
  const track = horizontal?.querySelector('[data-sobre-track]');
  const panels = Array.from(track?.querySelectorAll('.sobre-horizontal-panel') || []);
  if (!stage || !pin || !hero || !entrance || !services ||
      !heading || !details || !horizontal || !track || panels.length !== 4) return;

  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const layoutFits = element => element.scrollHeight <= element.clientHeight + 4;
  const viewport = () => window.innerHeight;

  media.add('(min-width: 1220px) and (min-height: 850px) and (prefers-reduced-motion: no-preference)', () => {
    // O estado inicial é aplicado no mesmo frame antes de fixar a cena.
    gsap.set(entrance, { xPercent: 100 });
    root.classList.add('sobre-intro-active');
    if (layoutFits(hero) && layoutFits(entrance)) {
      const intro = gsap.timeline({
        scrollTrigger: {
          // Fixar o contêiner externo para a spacer reservar altura real no documento.
          trigger: stage,
          start: 'top top',
          end: () => '+=' + Math.round(viewport() * 1.1),
          pin: stage,
          scrub: 1.05,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      intro.to(entrance, { xPercent: 0, duration: 1, ease: 'none' })
           .to({}, { duration: .26 });
    } else {
      root.classList.remove('sobre-intro-active');
      gsap.set(entrance, { clearProps: 'transform' });
    }

    // Duas elevações distintas, mas curtas; não expor uma tela vazia por várias voltas.
    root.classList.add('sobre-service-active');
    if (layoutFits(services)) {
      gsap.set(heading, { autoAlpha: 0.25, y: 60 });
      gsap.set(details, { autoAlpha: 0.25, y: 65 });
      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: services,
          start: 'top top',
          end: () => '+=' + Math.round(viewport() * 1.3),
          scrub: .95,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      reveal.to(heading, { autoAlpha: 1, y: 0, duration: 1, ease: 'none' })
            .to(details, { autoAlpha: 1, y: 0, duration: 1, ease: 'none' }, '>')
            .to({}, { duration: .18 });
    } else {
      root.classList.remove('sobre-service-active');
    }

    // Preserva leitura: se houver corte por altura/largura, usa o fluxo vertical.
    root.classList.add('sobre-horizontal-active');
    if (panels.every(layoutFits)) {
      const distance = () => Math.max(0, track.scrollWidth - horizontal.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: horizontal,
          start: 'top top',
          end: () => '+=' + Math.round(distance() * 1.05 + viewport() * .18),
          pin: true,
          scrub: 1.05,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    } else {
      root.classList.remove('sobre-horizontal-active');
    }

    return () => {
      root.classList.remove('sobre-intro-active','sobre-service-active','sobre-horizontal-active');
      gsap.set([entrance, heading, details, track], { clearProps: 'all' });
    };
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready?.then(refresh).catch(() => {});
  window.addEventListener('pagehide', () => media.revert(), { once: true });
})();
