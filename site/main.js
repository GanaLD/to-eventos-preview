(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir menu');
  };
  toggle?.addEventListener('click', () => {
    const open = !nav?.classList.contains('is-open');
    nav?.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  });
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown', event=>{if(event.key==='Escape')closeMenu();});

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const desktop = window.matchMedia?.('(min-width: 900px)').matches ?? false;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  // Sem GSAP ou com movimento reduzido, todo o conteúdo permanece navegável e legível.
  if (reduceMotion || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const activeTriggers = [];
  const heroStage = document.querySelector('.hero-scroll-stage');
  const heroVideo = document.querySelector('[data-role="hero-film"]');
  let scrubFrame = 0;
  const scrubHeroMedia = progress => {
    if (!heroVideo || heroVideo.hidden || !heroVideo.currentSrc || !Number.isFinite(heroVideo.duration) || heroVideo.duration<=0) return;
    cancelAnimationFrame(scrubFrame);
    scrubFrame = requestAnimationFrame(() => {
      const time = Math.min(heroVideo.duration - 0.04, Math.max(0, progress*heroVideo.duration));
      if (Math.abs(heroVideo.currentTime-time)>0.035) heroVideo.currentTime=time;
    });
  };
  if (heroStage && desktop) {
    const intro = gsap.timeline({scrollTrigger:{
      trigger:heroStage, start:'top top', end:()=>'+='+Math.round(window.innerHeight*.88),
      scrub:1, pin:true, invalidateOnRefresh:true, anticipatePin:1,
      onUpdate:self=>scrubHeroMedia(self.progress)
    }});
    intro.to('.hero-copy',{y:-28,opacity:.82,ease:'none'},0)
      .to('.hero-visual',{y:-12,ease:'none'},0);
    activeTriggers.push(intro.scrollTrigger);
  }
  const track = document.getElementById('projects-track');
  const pin = document.getElementById('projects-pin');
  const area = document.getElementById('projetos');
  const progress = document.querySelector('.projects-progress-fill');
  if (track && pin && area && desktop) {
    const travel = () => Math.max(0,track.scrollWidth-pin.clientWidth);
    document.documentElement.classList.add('is-gsap-active');
    const gallery = gsap.to(track,{
      x:()=>-travel(),ease:'none',
      scrollTrigger:{trigger:area,start:'top top',end:()=>'+='+travel(),
        pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1,
        onUpdate:self=>{if(progress)progress.style.transform=`scaleX(${self.progress})`;}
      }
    });
    activeTriggers.push(gallery.scrollTrigger);
  }
  // Limpa listeners/pins em navegações; não altera a execução do vídeo institucional.
  window.addEventListener('pagehide',()=>{
    cancelAnimationFrame(scrubFrame);
    activeTriggers.forEach(trigger=>trigger?.kill());
    document.documentElement.classList.remove('is-gsap-active');
  },{once:true});
})();