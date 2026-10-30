/* TO Eventos — mídia de fundo do HERO final.
   Só observa a classe gerada pelo HERO V5; não cria pin nem ScrollTrigger. */
(() => {
  const stage=document.querySelector('.hero-scroll-stage');
  const video=stage?.querySelector('.to-hero-thaiso-backdrop video');
  const source=video?.querySelector('source[data-src]');
  if(!stage||!video||!source)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let initialized=false;
  function sync(){
    const active=stage.classList.contains('is-hero-framed')&&!document.hidden&&!reduce.matches;
    if(!active){
      if(!video.paused)video.pause();
      return;
    }
    if(!initialized){
      source.src=source.dataset.src;
      initialized=true;
      video.load();
    }
    if(video.paused){
      const started=video.play();
      if(started&&typeof started.catch==='function')started.catch(()=>{});
    }
  }
  new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  if(typeof reduce.addEventListener==='function')reduce.addEventListener('change',sync);
  else if(typeof reduce.addListener==='function')reduce.addListener(sync);
  sync();
})();
