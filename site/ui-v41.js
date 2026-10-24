/* TO EVENTOS V4.1 — passagem editorial vertical Sobre → Soluções.
   O HERO e o trilho horizontal de Projetos continuam sob responsabilidade de main.js. */
(() => {
  const about = document.getElementById('sobre');
  const solutions = document.getElementById('solucoes');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!about || !solutions || !gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const responsive = gsap.matchMedia();

  // A variante com pin é restrita ao desktop e desativada para movimento reduzido.
  responsive.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const updateCover = (trigger) => {
      const progress = Math.max(0, Math.min(1, trigger.progress));
      // Em repouso, transform = 0. Sem degrau visual nos extremos.
      // O painel também sobe naturalmente com o scroll, enquanto Sobre fica pinned.
      const lift = Math.min(64, window.innerHeight * 0.065);
      gsap.set(solutions, {
        y: -Math.sin(progress * Math.PI) * lift,
        force3D: true
      });
    };

    const transition = ScrollTrigger.create({
      id: 'to-papoulas-competencias',
      trigger: about,
      start: 'bottom bottom',
      end: () => '+=' + Math.round(window.innerHeight),
      pin: about,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: updateCover,
      onRefresh: updateCover,
      onLeave: () => gsap.set(solutions, {y: 0}),
      onLeaveBack: () => gsap.set(solutions, {y: 0})
    });

    const refreshAfterFonts = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refreshAfterFonts).catch(() => {});

    // gsap.matchMedia chama a limpeza ao sair do breakpoint.
    return () => {
      transition.kill();
      gsap.set(solutions, {clearProps: 'transform'});
    };
  });
})();
