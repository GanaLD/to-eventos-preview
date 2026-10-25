/* TO Eventos — Sobre: introdução lateral, duas elevações e narrativa horizontal.
 * ScrollTrigger controla o tempo do movimento; nenhum wheel preventDefault.
 * Toda seção permanece no fluxo HTML se GSAP não carregar.
 */
(() => {
  'use strict';
  const root = document.querySelector('.sobre-page');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!root || !gsap || !ScrollTrigger || !gsap.matchMedia) return;

  const entrance = root.querySelector('[data-sobre-slide-right]');
  const services = root.querySelector('[data-sobre-services]');
  const heading = root.querySelector('[data-sobre-rise-heading]');
  const details = root.querySelector('[data-sobre-rise-details]');
  const horizontal = root.querySelector('[data-sobre-horizontal]');
  const track = root.querySelector('[data-sobre-track]');
  if (!entrance || !services || !heading || !details || !horizontal || !track) return;
  if (track.querySelectorAll('.sobre-horizontal-panel').length !== 4) return;

  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  media.add('(min-width: 1180px) and (min-height: 780px) and (prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('sobre-motion-ready');

    // Após o Hero: a página institucional completa desliza da direita.
    gsap.fromTo(entrance, { xPercent: 100 }, {
      xPercent: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: entrance,
        start: 'top bottom',
        end: 'top top',
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    // Cena seguinte: duas entradas de baixo para cima, no mesmo painel fixado.
    gsap.set([heading, details], { autoAlpha: 0, y: () => Math.min(window.innerHeight * .58, 420) });
    const rise = gsap.timeline({
      scrollTrigger: {
        trigger: services,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 2.65),
        pin: true,
        scrub: 1.25,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
    rise.to(heading, { autoAlpha: 1, y: 0, duration: 1, ease: 'none' })
        .to({}, { duration: .35 })
        .to(details, { autoAlpha: 1, y: 0, duration: 1, ease: 'none' })
        .to({}, { duration: .45 });

    // Continuação: a rolagem vertical percorre quatro painéis laterais.
    // A distância é calculada a partir do conteúdo real, sem valores fixos.
    const distance = () => Math.max(0, track.scrollWidth - horizontal.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: horizontal,
        start: 'top top',
        end: () => '+=' + Math.round(distance() * 1.15 + window.innerHeight * .35),
        pin: true,
        scrub: 1.3,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });

    // Não há pin nem ScrollTrigger na FAQ, no CTA ou no rodapé:
    // após o último painel, o scroll nativo retoma o controle.
    return () => document.documentElement.classList.remove('sobre-motion-ready');
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready?.then(refresh).catch(() => {});
  window.addEventListener('pagehide', () => media.revert(), { once: true });
})();
