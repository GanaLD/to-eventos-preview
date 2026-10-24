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
  // HERO V5 gerenciado somente por hero-v5.js. Não criar outro ScrollTrigger aqui.
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
    activeTriggers.forEach(trigger=>trigger?.kill());
    document.documentElement.classList.remove('is-gsap-active');
  },{once:true});
})();