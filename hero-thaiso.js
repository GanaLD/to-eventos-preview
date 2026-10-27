/* TO Eventos — mídia de fundo do HERO final.
   Só observa a classe gerada pelo HERO V5; não cria pin nem ScrollTrigger. */
(() => {
  const stage=document.querySelector('.hero-scroll-stage');
  const video=stage?.querySelector('.to-hero-thaiso-backdrop video');
  const source=video?.querySelector('source[data-src]');
  if(!stage||!video||!source)return;
  // Keep the full take visible while a second, soft cover layer fills any
  // unused viewport area without cropping the sharp original.
  const fill=document.createElement('video');
  fill.className='to-hero-thaiso-fill';
  fill.setAttribute('aria-hidden','true');
  fill.setAttribute('playsinline','');
  fill.muted=true;fill.defaultMuted=true;fill.loop=true;fill.playsInline=true;
  fill.preload='none';fill.disablePictureInPicture=true;
  const fillSource=document.createElement('source');
  fillSource.type=source.type||'video/mp4';
  fill.appendChild(fillSource);
  video.before(fill);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let initialized=false;
  function sync(){
    const active=stage.classList.contains('is-hero-framed')&&!document.hidden&&!reduce.matches;
    if(!active){
      if(!video.paused)video.pause();
      if(!fill.paused)fill.pause();
      return;
    }
    if(!initialized){
      source.src=source.dataset.src;
      fillSource.src=source.dataset.src;
      initialized=true;
      video.load();
      fill.load();
    }
    if(video.paused){
      const started=video.play();
      if(started&&typeof started.catch==='function')started.catch(()=>{});
    }
    if(fill.paused){
      if(fill.readyState>=1&&video.currentTime>0){
        try{fill.currentTime=video.currentTime;}catch{}
      }
      const started=fill.play();
      if(started&&typeof started.catch==='function')started.catch(()=>{});
    }
  }
  const syncFillTime=()=>{
    if(!initialized||video.seeking||fill.seeking||fill.readyState<1)return;
    const drift=video.currentTime-fill.currentTime;
    if(Math.abs(drift)>.12){try{fill.currentTime=video.currentTime;}catch{}}
  };
  video.addEventListener('timeupdate',syncFillTime);
  video.addEventListener('seeked',syncFillTime);
  fill.addEventListener('loadedmetadata',syncFillTime);
  new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  if(typeof reduce.addEventListener==='function')reduce.addEventListener('change',sync);
  else if(typeof reduce.addListener==='function')reduce.addListener(sync);
  sync();
})();
