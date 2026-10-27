/* TO EVENTOS V7 — animações editoriais, geometria floral e PDF original.
   Mantém HERO/GSAP horizontal nos módulos existentes e não cria pins extras. */
(() => {
  const gsap=window.gsap, ST=window.ScrollTrigger;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // SOBRE — animar os cinco grupos reais em ordem, após entrada da seção.
  const about=document.getElementById('sobre');
  const copy=about?.querySelector('.about-copy');
  // O vídeo vertical novo entra inteiro quando a seção fica visível.
  const botanicalMedia=about?.querySelector('.floral-reveal');
  const botanicalVideo=about?.querySelector('.about-floral-video');
  if(botanicalVideo){
    botanicalVideo.autoplay=false;
    botanicalVideo.removeAttribute('autoplay');
    botanicalVideo.muted=true;
    botanicalVideo.loop=true;
    botanicalVideo.playsInline=true;
    let aboutVisible=false;
    const playFloral=()=>{
      if(reduce||document.hidden||!aboutVisible||!botanicalVideo.paused)return;
      const playing=botanicalVideo.play();
      if(playing?.catch)playing.catch(()=>{});
    };
    const pauseFloral=()=>{if(!botanicalVideo.paused)botanicalVideo.pause();};
    if('IntersectionObserver' in window){
      const floralObserver=new IntersectionObserver(entries=>{
        aboutVisible=entries.some(entry=>entry.isIntersecting);
        if(aboutVisible)playFloral();
        else pauseFloral();
      },{threshold:.12,rootMargin:'0px'});
      floralObserver.observe(about);
    }else if(ST){
      ST.create({trigger:about,start:'top 88%',end:'bottom 12%',
        onEnter:()=>{aboutVisible=true;playFloral();},
        onEnterBack:()=>{aboutVisible=true;playFloral();},
        onLeave:()=>{aboutVisible=false;pauseFloral();},
        onLeaveBack:()=>{aboutVisible=false;pauseFloral();}
      });
    }
    document.addEventListener('visibilitychange',()=>document.hidden?pauseFloral():playFloral());
    window.addEventListener('pagehide',pauseFloral,{once:true});
  }
  const copyParts=copy?[
    copy.querySelector('.overline'),
    copy.querySelector('#sobre-heading'),
    copy.querySelector('p.intro'),
    [...copy.children].find(n=>n.tagName==='P'&&!n.classList.contains('overline')&&!n.classList.contains('intro')),
    copy.querySelector('.microproof')
  ].filter(Boolean):[];

  let entered=false;
  if(about&&botanicalMedia&&copyParts.length&&!reduce&&gsap&&ST){
    gsap.registerPlugin(ST);
    gsap.set([...copyParts,botanicalMedia],{y:32,autoAlpha:0});
    const enter=()=>{
      if(entered)return;
      entered=true;
      const reveal=gsap.timeline({defaults:{ease:'power2.out'}});
      reveal.to(copyParts,{y:0,autoAlpha:1,
        duration:(index,el)=>el.id==='sobre-heading'?2.1:1.28,
        stagger:.21},0);
      reveal.to(botanicalMedia,{y:0,autoAlpha:1,duration:1.28,ease:'power3.out'},.3);
    };
    ST.create({
      id:'to-v7-sobre-intro',trigger:about,
      start:'top 82%',end:'bottom 15%',invalidateOnRefresh:true,
      onEnter:enter,onEnterBack:enter
    });
    const reconcile=()=>{
      const r=about.getBoundingClientRect();
      if(!entered && r.top<innerHeight*.82 && r.bottom>innerHeight*.15)enter();
    };
    requestAnimationFrame(()=>requestAnimationFrame(reconcile));
    document.fonts?.ready?.then(()=>{ST.refresh();reconcile();});
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
  const fullExit=showcase.querySelector('[data-pdf-action="exit-fullscreen"]');
  const counter=showcase.querySelector('.to-pdf-counter');
  const loading=showcase.querySelector('.to-pdf-loading');
  const pdfjs=window.pdfjsLib;
  let documentPDF=null,pageNumber=1,pageTotal=13,renderTask=null,serial=0;
  let fallbackFullscreen=false;
  let fullscreenPlaceholder=null;

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
  const isFullscreen=()=>
    (document.fullscreenElement||document.webkitFullscreenElement)===showcase || fallbackFullscreen;
  const enterFallbackFullscreen=()=>{
    if(!fullscreenPlaceholder&&showcase.parentNode){
      fullscreenPlaceholder=document.createComment('to-pdf-showcase-position');
      showcase.parentNode.insertBefore(fullscreenPlaceholder,showcase);
      document.body.appendChild(showcase);
    }
    fallbackFullscreen=true;
    showcase.classList.add('is-fullscreen-fallback');
    document.documentElement.classList.add('to-pdf-fallback-active');
    syncFullscreen();
  };
  const exitFallbackFullscreen=()=>{
    fallbackFullscreen=false;
    showcase.classList.remove('is-fullscreen-fallback');
    document.documentElement.classList.remove('to-pdf-fallback-active');
    if(fullscreenPlaceholder?.parentNode){
      fullscreenPlaceholder.parentNode.insertBefore(showcase,fullscreenPlaceholder);
      fullscreenPlaceholder.remove();
      fullscreenPlaceholder=null;
    }
    syncFullscreen();
  };
  const exitFullscreen=()=>{
    if(fallbackFullscreen){exitFallbackFullscreen();return;}
    if(document.exitFullscreen){document.exitFullscreen().catch(()=>{});return;}
    if(document.webkitExitFullscreen)document.webkitExitFullscreen();
  };
  full?.addEventListener('click',event=>{
    event.stopPropagation();
    if(isFullscreen())exitFullscreen();
    else enterFallbackFullscreen();
  });
  fullExit?.addEventListener('click',event=>{
    event.stopPropagation();
    exitFullscreen();
  });
  const syncFullscreen=()=>{
    if(document.fullscreenElement===showcase&&fallbackFullscreen){
      fallbackFullscreen=false;
      showcase.classList.remove('is-fullscreen-fallback');
      document.documentElement.classList.remove('to-pdf-fallback-active');
    }
    const active=isFullscreen();
    full?.setAttribute('aria-pressed',String(active));
    if(full){
      full.textContent=active?'Tela normal':'Tela cheia';
      full.setAttribute('aria-label',active?'Voltar o PDF ao tamanho normal':'Abrir PDF em tela cheia');
    }
    if(fullExit)fullExit.hidden=!active;
    if(documentPDF)requestAnimationFrame(()=>renderPage());
    ST?.refresh();
  };
  document.addEventListener('fullscreenchange',syncFullscreen);
  document.addEventListener('webkitfullscreenchange',syncFullscreen);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&fallbackFullscreen)exitFallbackFullscreen();
  });
  syncFullscreen();
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
