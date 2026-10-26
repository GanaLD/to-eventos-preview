/* TO Eventos — títulos em escrita progressiva e textos com entrada suave. */
(() => {
  'use strict';
  const gsap = window.gsap;
  if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const titleSelectors = [
    '#sobre-heading', '#solucoes-heading', '#projetos-heading',
    '.project-panel-video .full-video-block h3', '#ag-heading', '#contato-heading'
  ];
  const titles = [...new Set(titleSelectors.flatMap(selector =>
    [...document.querySelectorAll(selector)]
  ))];
  const epicHeading = document.getElementById('contato-heading');

  if ('IntersectionObserver' in window) {
    const observedHeadings = new Map();
    const titleObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const heading = observedHeadings.get(entry.target);
        if (!heading) continue;
        titleObserver.unobserve(entry.target);
        observedHeadings.delete(entry.target);
        const epic = heading === epicHeading;
        const length = [...heading.textContent.trim()].length;
        const steps = Math.max(12, Math.min(44, length));
        gsap.to(heading, {
          clipPath: 'inset(0 0% 0 0)',
          duration: epic ? 2.15 : Math.min(1.8, Math.max(1.05, length * .035)),
          ease: 'steps(' + steps + ')',
          overwrite: 'auto',
          onComplete: () => { heading.style.willChange = 'auto'; }
        });
        if (epic) {
          gsap.to(heading.closest('.contact-section'), {
            '--contact-glow': .18,
            '--contact-line': 1,
            duration: 1.7,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      }
    }, {threshold: .08, rootMargin: '0px 0px -5% 0px'});

    for (const heading of titles) {
      heading.classList.add('to-handwrite');
      heading.style.willChange = 'clip-path';
      gsap.set(heading, {clipPath: 'inset(0 100% 0 0)'});
      const target=heading.parentElement||heading;
      observedHeadings.set(target,heading);
      titleObserver.observe(target);
    }

    const extras = [...new Set([
      ...document.querySelectorAll('#galeria-editorial .ag-kicker, #galeria-editorial .ag-heading p, #galeria-editorial .ag-foot'),
      ...document.querySelectorAll('.project-panel-video .full-video-block > div > p')
    ])];
    const copyObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        copyObserver.unobserve(entry.target);
        gsap.to(entry.target, {
          y: 0, autoAlpha: 1, duration: .95, ease: 'power2.out', overwrite: 'auto'
        });
      }
    }, {threshold: .1});
    for (const node of extras) {
      gsap.set(node, {y: 24, autoAlpha: 0});
      copyObserver.observe(node);
    }
    window.addEventListener('pagehide', () => {
      titleObserver.disconnect();
      copyObserver.disconnect();
    }, {once: true});
  } else {
    for (const heading of titles) heading.style.clipPath = 'none';
  }
})();
