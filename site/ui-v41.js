/* TO EVENTOS V4.1.1 — exclusivo papoulas → competências.
   NÃO pinçar #sobre com pinSpacing:false: isso deslocava a seção para dentro do HERO.
   A geometria normal das seções é preservada, com sticky limitado ao wrapper. */
(() => {
  const stage = document.getElementById('to-page-turn');
  const about = document.getElementById('sobre');
  const solutions = document.getElementById('solucoes');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!stage || !about || !solutions || !gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const responsive = gsap.matchMedia();

  responsive.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    let lastAboutHeight = 0;
    const measure = () => {
      const height = Math.ceil(about.offsetHeight);
      if (Math.abs(height - lastAboutHeight) > 1) {
        lastAboutHeight = height;
        about.style.setProperty('--to-about-height', height + 'px');
      }
    };

    measure();
    // Não existe pin GSAP: o documento preserva a altura das duas seções.
    // O painel preto só começa a entrar quando seu topo chega ao rodapé da viewport.
    const rise = gsap.fromTo(solutions,
      { y: () => Math.min(96, window.innerHeight * .12) },
      {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          id: 'to-solucoes-rise-only',
          trigger: solutions,
          start: 'top bottom',
          end: 'top top',
          scrub: .85,
          invalidateOnRefresh: true,
          onRefresh: measure
        }
      }
    );

    const observer = new ResizeObserver(() => {
      const current = Math.ceil(about.offsetHeight);
      if (Math.abs(current - lastAboutHeight) > 1) {
        measure();
        ScrollTrigger.refresh();
      }
    });
    observer.observe(about);

    return () => {
      observer.disconnect();
      rise.scrollTrigger?.kill();
      rise.kill();
      about.style.removeProperty('--to-about-height');
      gsap.set(solutions, { clearProps: 'transform' });
    };
  });
})();