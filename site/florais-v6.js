/* TO Eventos V6 — reprodução do vídeo e GSAP das papoulas, sem alterar HERO. */
(() => {
  const about=document.getElementById('sobre'), solutions=document.getElementById('solucoes');
  const video=about?.querySelector('.about-floral-video');
  const copy=[...(about?.querySelectorAll('.about-copy > *')||[])];
  const left=solutions?.querySelector('.solutions-floral-left');
  const right=solutions?.querySelector('.solutions-floral-right');
  if(!video||!left||!right) return;
  video.muted=true;video.playsInline=true;video.loop=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playFlower=()=>{
    try{
      video.pause(); video.currentTime = 0;
      video.play()?.catch(()=>{});
    }catch(e){ /* Media may not yet be ready. */ }
  };
  const stopFlower=()=>video.pause();
  if(reduced){
    const last=()=>{ if(video.duration>0)video.currentTime=Math.max(0,video.duration-.06); };
    video.addEventListener('loadedmetadata',last,{once:true});
    if(video.readyState>=1)last();
    return;
  }
  if(!window.gsap||!window.ScrollTrigger){
    const obs=new IntersectionObserver(entries=>{
      for(const e of entries){if(e.isIntersecting)playFlower();else stopFlower();}
    },{threshold:.2});obs.observe(about);return;
  }
  const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('florals-enhanced');
  gsap.set(left,{xPercent:-105,autoAlpha:0});
  gsap.set(right,{xPercent:105,autoAlpha:0});
  let intro;
  const enterAbout=()=>{
    playFlower();
    intro?.kill();
    gsap.killTweensOf([...copy,video]);
    intro=gsap.timeline({defaults:{ease:'power2.out',overwrite:true}});
    intro.fromTo(copy,{y:40,autoAlpha:0},{y:0,autoAlpha:1,duration:.82,stagger:.13},0);
    intro.fromTo(video,{y:35,autoAlpha:0},{y:0,autoAlpha:1,duration:1.05},.22);
  };
  const aboutTrigger=ScrollTrigger.create({
    trigger:about,start:'top 72%',end:'bottom 8%',invalidateOnRefresh:true,
    onEnter:enterAbout,onEnterBack:enterAbout,onLeave:stopFlower,
    onLeaveBack:()=>{stopFlower();video.currentTime = 0;intro?.kill();}
  });
  const pair=[left,right];
  const enterFlorals=()=>{
    gsap.killTweensOf(pair);
    gsap.fromTo(left,{xPercent:-105,autoAlpha:0},{
      xPercent:0,autoAlpha:1,duration:1.05,ease:'power3.out',overwrite:true
    });
    gsap.fromTo(right,{xPercent:105,autoAlpha:0},{
      xPercent:0,autoAlpha:1,duration:1.1,delay:.08,ease:'power3.out',overwrite:true
    });
  };
  const leaveFlorals=()=>{
    gsap.killTweensOf(pair);
    gsap.to(left,{xPercent:-105,autoAlpha:0,duration:.62,ease:'power2.inOut'});
    gsap.to(right,{xPercent:105,autoAlpha:0,duration:.62,ease:'power2.inOut'});
  };
  const floralTrigger=ScrollTrigger.create({
    trigger:solutions,start:'top 78%',end:'bottom 18%',
    invalidateOnRefresh:true,onEnter:enterFlorals,onEnterBack:enterFlorals,
    onLeave:leaveFlorals,onLeaveBack:leaveFlorals
  });
  document.fonts?.ready?.then(()=>ScrollTrigger.refresh());
  video.addEventListener('loadedmetadata',()=>ScrollTrigger.refresh(),{once:true});
  addEventListener('pagehide',()=>{
    aboutTrigger.kill();floralTrigger.kill();stopFlower();intro?.kill();
  },{once:true});
})();