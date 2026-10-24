/* TO EVENTOS V7 — animações editoriais, geometria floral e PDF original.
   Mantém HERO/GSAP horizontal nos módulos existentes e não cria pins extras. */
(() => {
  const gsap=window.gsap, ST=window.ScrollTrigger;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // CUE DO HERO: apenas instrução visual; sem controlador paralelo do vídeo.
  const cue=document.querySelector('.to-hero-scroll-cue');
  if(cue){
    const updateCue=()=>{
      const trigger=ST?.getById('to-hero-film-and-copy')||ST?.getById('to-hero-mobile-film-and-copy');
      const p=trigger?.progress || 0;
      cue.style.opacity=String(Math.max(0,Math.min(1,1-p/.075)));
      cue.style.visibility=p>.075?'hidden':'visible';
    };
    window.addEventListener('scroll',updateCue,{passive:true});
    window.addEventListener('resize',updateCue,{passive:true});
    updateCue();
  }

  // SOBRE — animar os cinco grupos reais em ordem, após entrada da seção.
  const about=document.getElementById('sobre');
  const copy=about?.querySelector('.about-copy');
  const botanicalVideo=about?.querySelector('.about-floral-video');
  const copyParts=copy?[
    copy.querySelector('.overline'),
    copy.querySelector('#sobre-heading'),
    copy.querySelector('p.intro'),
    [...copy.children].find(n=>n.tagName==='P'&&!n.classList.contains('overline')&&!n.classList.contains('intro')),
    copy.querySelector('.microproof')
  ].filter(Boolean):[];

  const playFlower=()=>{
    if(!botanicalVideo)return;
    botanicalVideo.pause();
    try{botanicalVideo.currentTime=0;}catch(_){}
    const promise=botanicalVideo.play();
    promise?.catch?.(()=>{});
  };
  if(about&&botanicalVideo&&copyParts.length && !reduce && gsap&&ST){
    gsap.registerPlugin(ST);
    gsap.set(copyParts,{y:40,autoAlpha:0});
    gsap.set(botanicalVideo,{y:32,autoAlpha:0});
    let reveal;
    const enter=()=>{
      reveal?.kill();
      gsap.set(copyParts,{y:40,autoAlpha:0});
      gsap.set(botanicalVideo,{y:32,autoAlpha:0});
      reveal=gsap.timeline({defaults:{ease:'power2.out'}});
      reveal.to(copyParts,{y:0,autoAlpha:1,duration:.8,stagger:.135},0);
      reveal.to(botanicalVideo,{y:0,autoAlpha:1,duration:.9},.25);
      playFlower();
    };
    const exitTop=()=>{
      botanicalVideo.pause();
      reveal?.kill();
      gsap.set(copyParts,{y:40,autoAlpha:0});
      gsap.set(botanicalVideo,{y:32,autoAlpha:0});
      try{botanicalVideo.currentTime=0;}catch(_){}
    };
    const trigger=ST.create({
      id:'to-v7-sobre-intro',
      trigger:about,
      start:'top 82%',
      end:'bottom 15%',
      invalidateOnRefresh:true,
      onEnter:enter,
      onEnterBack:enter,
      onLeave:()=>botanicalVideo.pause(),
      onLeaveBack:exitTop
    });
    // Abertura por #sobre, histórico ou recarga não pode deixar o texto oculto.
    const reconcile=()=>{
      const r=about.getBoundingClientRect();
      if(r.top<innerHeight*.82&&r.bottom>innerHeight*.15&&(!reveal||reveal.progress()===0))enter();
    };
    requestAnimationFrame(()=>requestAnimationFrame(reconcile));
    document.fonts?.ready?.then(()=>{ST.refresh();reconcile();});
    botanicalVideo.addEventListener('loadedmetadata',()=>ST.refresh(),{once:true});
  }else if(botanicalVideo){
    // Sem GSAP / movimento reduzido: texto visível e vídeo livre de animações agressivas.
    botanicalVideo.addEventListener('loadedmetadata',()=>{
      if(reduce&&botanicalVideo.duration>0){
        try{botanicalVideo.currentTime=Math.max(0,botanicalVideo.duration-.08);}catch(_){}
      }
    },{once:true});
    if(!reduce&&'IntersectionObserver' in window){
      new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?playFlower():botanicalVideo.pause()),{threshold:.15}).observe(about);
    }
  }

  // COMPETÊNCIAS — imagens já recortadas pelos limites ALFA reais.
  const solutions=document.getElementById('solucoes');
  const left=solutions?.querySelector('.solutions-floral-left');
  const right=solutions?.querySelector('.solutions-floral-right');
  if(solutions&&left&&right&&!reduce&&gsap&&ST){
    const florals=[left,right];
    document.documentElement.classList.add('florals-enhanced');
    gsap.set(left,{x:-200,autoAlpha:0});
    gsap.set(right,{x:200,autoAlpha:0});
    const show=()=>{
      gsap.killTweensOf(florals);
      gsap.to(left,{x:0,autoAlpha:1,duration:1,ease:'power2.out',overwrite:true});
      gsap.to(right,{x:0,autoAlpha:1,duration:1.08,ease:'power2.out',overwrite:true});
    };
    const hide=()=>{
      gsap.killTweensOf(florals);
      gsap.to(left,{x:-200,autoAlpha:0,duration:.58,ease:'power2.inOut',overwrite:true});
      gsap.to(right,{x:200,autoAlpha:0,duration:.58,ease:'power2.inOut',overwrite:true});
    };
    ST.create({
      id:'to-v7-lateral-papoulas',trigger:solutions,
      start:'top 80%',end:'bottom 16%',
      invalidateOnRefresh:true,
      onEnter:show,onEnterBack:show,onLeave:hide,onLeaveBack:hide
    });
    requestAnimationFrame(()=>{
      const r=solutions.getBoundingClientRect();
      if(r.top<innerHeight*.80 && r.bottom>innerHeight*.16)show();
    });
  }

  // PDF SHOWCASE — 13 páginas no documento oficial, controles acessíveis.
  const showcase=document.getElementById('to-pdf-showcase');
  if(!showcase)return;
  const src=showcase.dataset.pdf;
  const stage=showcase.querySelector('.to-pdf-stage');
  const canvas=showcase.querySelector('canvas');
  const fallback=showcase.querySelector('.to-pdf-fallback');
  const previous=showcase.querySelector('[data-pdf-action="previous"]');
  const next=showcase.querySelector('[data-pdf-action="next"]');
  const full=showcase.querySelector('[data-pdf-action="fullscreen"]');
  const counter=showcase.querySelector('.to-pdf-counter');
  const loading=showcase.querySelector('.to-pdf-loading');
  const pdfjs=window.pdfjsLib;
  let documentPDF=null,pageNumber=1,pageTotal=13,renderTask=null,serial=0;

  const setCounter=()=>{
    counter.textContent=String(pageNumber).padStart(2,'0')+' / '+String(pageTotal).padStart(2,'0');
    previous.disabled=pageNumber<=1;
    next.disabled=pageNumber>=pageTotal;
  };
  const renderFallback=()=>{
    showcase.classList.add('is-fallback','is-ready');
    fallback.title='Visualizador nativo do portfólio oficial';
    fallback.src=src+'#page='+pageNumber+'&zoom=page-fit';
    loading.textContent='Abrir portfólio em PDF';
  };
  const renderPage=async()=>{
    if(!documentPDF){renderFallback();setCounter();return;}
    const mySerial=++serial;
    if(renderTask){
      try{renderTask.cancel();await renderTask.promise;}catch(_){}
      renderTask=null;
    }
    try{
      const page=await documentPDF.getPage(pageNumber);
      if(mySerial!==serial)return;
      const base=page.getViewport({scale:1});
      const width=Math.max(160,stage.clientWidth||720);
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const viewport=page.getViewport({scale:width/base.width*ratio});
      canvas.width=Math.ceil(viewport.width);
      canvas.height=Math.ceil(viewport.height);
      canvas.style.width='100%';
      canvas.style.height='auto';
      const ctx=canvas.getContext('2d',{alpha:false});
      renderTask=page.render({canvasContext:ctx,viewport});
      await renderTask.promise;
      if(mySerial===serial){showcase.classList.add('is-ready');loading.hidden=true;}
    }catch(error){
      if(error?.name==='RenderingCancelledException')return;
      console.warn('TO Eventos PDF: visualizador nativo ativado',error);
      renderFallback();
    }finally{setCounter();}
  };
  const selectPage=p=>{
    const target=Math.max(1,Math.min(pageTotal,p));
    if(target===pageNumber)return;
    pageNumber=target;
    setCounter();
    renderPage();
  };
  previous?.addEventListener('click',event=>{event.stopPropagation();selectPage(pageNumber-1);});
  next?.addEventListener('click',event=>{event.stopPropagation();selectPage(pageNumber+1);});
  full?.addEventListener('click',async event=>{
    event.stopPropagation();
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(showcase.requestFullscreen)await showcase.requestFullscreen();
      else window.open(src,'_blank','noopener');
    }catch(_){window.open(src,'_blank','noopener');}
  });
  document.addEventListener('fullscreenchange',()=>{
    if(documentPDF)requestAnimationFrame(()=>renderPage());
    ST?.refresh();
  });
  setCounter();
  if(!pdfjs){renderFallback();return;}
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  // Começa carregamento do PDF somente ao aproximar-se, economizando memória no HERO.
  let started=false;
  const start=async()=>{
    if(started)return;started=true;
    try{
      const loadingTask=pdfjs.getDocument({url:src});
      documentPDF=await loadingTask.promise;
      pageTotal=documentPDF.numPages;
      setCounter();
      await renderPage();
      if('ResizeObserver' in window){
        let debounce=0;
        new ResizeObserver(()=>{clearTimeout(debounce);debounce=setTimeout(()=>{if(documentPDF)renderPage()},170)}).observe(stage);
      }
    }catch(error){
      console.warn('TO Eventos PDF: fallback nativo',error);
      renderFallback();
    }
  };
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){io.disconnect();start();}
    },{rootMargin:'650px 0px'});
    io.observe(showcase);
  }else start();
})();