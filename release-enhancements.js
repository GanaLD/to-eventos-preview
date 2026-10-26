/* Mídias complementares da publicação. Não cria outro controle para o heroscroll. */
(() => {
  'use strict';
  const backdrop=document.querySelector('.hero-backdrop-video');
  const connect=document.querySelector('.project-panel-summit .case-image video');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safePlay=video=>video?.play()?.catch(()=>{});

  if(backdrop){
    backdrop.muted=true;
    backdrop.loop=true;
    backdrop.playsInline=true;
    if(!reduced && !document.hidden)safePlay(backdrop);
    const syncBackdrop=()=>{
      if(document.hidden || reduced)backdrop.pause();
      else safePlay(backdrop);
    };
    backdrop.addEventListener('canplay',syncBackdrop,{once:true});
    document.addEventListener('visibilitychange',syncBackdrop);
    window.addEventListener('pageshow',syncBackdrop);
  }

  if(connect){
    connect.muted=true;
    connect.loop=true;
    connect.playsInline=true;
    const pause=()=>connect.pause();
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.isIntersecting && !document.hidden && !reduced)safePlay(connect);
          else pause();
        }
      },{threshold:.4});
      observer.observe(connect);
      window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    }else{
      connect.addEventListener('mouseenter',()=>{if(!reduced)safePlay(connect);});
      connect.addEventListener('mouseleave',pause);
    }
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)pause();
      else if(!reduced){
        const r=connect.getBoundingClientRect();
        if(r.width>0 && r.height>0 && r.left<innerWidth && r.right>0 && r.top<innerHeight && r.bottom>0)safePlay(connect);
      }
    });
  }
})();
