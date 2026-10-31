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
  let fallbackFullscreen=false,fullscreenCopy=null,nativeFullscreen=false,lastFullscreen=false;

  const syncFullscreenCopy=()=>{
    if(!fullscreenCopy)return;
    fullscreenCopy.classList.toggle('is-fallback',showcase.classList.contains('is-fallback'));
    fullscreenCopy.classList.toggle('is-ready',showcase.classList.contains('is-ready'));
    const copyFrame=fullscreenCopy.querySelector('.to-pdf-fallback');
    const frameSrc=fallback.getAttribute('src');
    if(frameSrc&&copyFrame.getAttribute('src')!==frameSrc)copyFrame.setAttribute('src',frameSrc);
    const copyCanvas=fullscreenCopy.querySelector('canvas');
    if(!showcase.classList.contains('is-fallback')&&canvas.width&&canvas.height){
      copyCanvas.width=canvas.width;copyCanvas.height=canvas.height;
      copyCanvas.getContext('2d').drawImage(canvas,0,0);
    }
  };

  const setCounter=()=>{
    counter.textContent=String(pageNumber).padStart(2,'0')+' / '+String(pageTotal).padStart(2,'0');
    previous.disabled=pageNumber<=1;
    next.disabled=pageNumber>=pageTotal;
    if(fullscreenCopy){
      fullscreenCopy.querySelector('.to-pdf-counter').textContent=counter.textContent;
      fullscreenCopy.querySelector('[data-pdf-action="previous"]').disabled=previous.disabled;
      fullscreenCopy.querySelector('[data-pdf-action="next"]').disabled=next.disabled;
    }
  };
  const renderFallback=()=>{
    showcase.classList.add('is-fallback','is-ready');
    fallback.title='Visualizador nativo do portfólio oficial';
    const url=src+'#page='+pageNumber+'&zoom=page-fit';
    if(fallback.getAttribute('src')!==url)fallback.setAttribute('src',url);
    loading.textContent='Abrir portfólio em PDF';
    syncFullscreenCopy();
  };
  const renderPage=async()=>{
    if(!documentPDF){renderFallback();setCounter();return;}
    const mySerial=++serial;
    if(renderTask){
      const previousTask=renderTask;renderTask=null;
      try{previousTask.cancel();await previousTask.promise;}catch(_){}
    }
    if(mySerial!==serial)return;
    let task=null;
    try{
      const page=await documentPDF.getPage(pageNumber);
      if(mySerial!==serial)return;
      const base=page.getViewport({scale:1});
      const visibleStage=fullscreenCopy?.querySelector('.to-pdf-stage')||stage;
      const width=Math.max(160,visibleStage.clientWidth||720);
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const viewport=page.getViewport({scale:width/base.width*ratio});
      // Manter a página anterior visível até a nova renderização terminar.
      const buffer=document.createElement('canvas');
      buffer.width=Math.ceil(viewport.width);buffer.height=Math.ceil(viewport.height);
      canvas.style.width='100%';
      canvas.style.height='auto';
      task=page.render({canvasContext:buffer.getContext('2d',{alpha:false}),viewport});
      renderTask=task;
      await task.promise;
      if(mySerial===serial){
        canvas.width=buffer.width;canvas.height=buffer.height;
        canvas.getContext('2d',{alpha:false}).drawImage(buffer,0,0);
        showcase.classList.add('is-ready');loading.hidden=true;
        syncFullscreenCopy();
      }
    }catch(error){
      if(error?.name==='RenderingCancelledException')return;
      console.warn('TO Eventos PDF: visualizador nativo ativado',error);
      renderFallback();
    }finally{if(renderTask===task)renderTask=null;setCounter();}
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
  const isNativeFullscreen=()=>
    (document.fullscreenElement||document.webkitFullscreenElement)===showcase;
  const isFullscreen=()=>isNativeFullscreen()||fallbackFullscreen;
  const enterFallbackFullscreen=()=>{
    if(fallbackFullscreen)return;
    // A cópia fica na camada superior; o iframe original nunca é removido
    // do documento, pois removê-lo faz o navegador recarregar o PDF.
    fullscreenCopy=showcase.cloneNode(true);
    fullscreenCopy.removeAttribute('id');
    fullscreenCopy.classList.add('is-fullscreen-fallback');
    fullscreenCopy.setAttribute('role','dialog');
    fullscreenCopy.setAttribute('aria-modal','true');
    fullscreenCopy.setAttribute('aria-label','Portfólio em tela cheia');
    fullscreenCopy.querySelector('[data-pdf-action="previous"]').addEventListener('click',()=>selectPage(pageNumber-1));
    fullscreenCopy.querySelector('[data-pdf-action="next"]').addEventListener('click',()=>selectPage(pageNumber+1));
    fullscreenCopy.querySelector('[data-pdf-action="fullscreen"]').hidden=true;
    const close=fullscreenCopy.querySelector('[data-pdf-action="exit-fullscreen"]');
    close.hidden=false;
    close.addEventListener('click',exitFallbackFullscreen);
    document.body.appendChild(fullscreenCopy);
    fallbackFullscreen=true;
    document.documentElement.classList.add('to-pdf-fallback-active');
    setCounter();syncFullscreenCopy();
    syncFullscreen();
    close.focus({preventScroll:true});
  };
  const exitFallbackFullscreen=()=>{
    fallbackFullscreen=false;
    document.documentElement.classList.remove('to-pdf-fallback-active');
    fullscreenCopy?.remove();fullscreenCopy=null;
    syncFullscreen();
    full?.focus({preventScroll:true});
  };
  const exitFullscreen=()=>{
    if(fallbackFullscreen){exitFallbackFullscreen();return;}
    if(document.exitFullscreen){document.exitFullscreen().catch(()=>{});return;}
    if(document.webkitExitFullscreen)document.webkitExitFullscreen();
  };
  full?.addEventListener('click',async event=>{
    event.stopPropagation();
    if(isFullscreen()){exitFullscreen();return;}
    try{
      if(showcase.requestFullscreen){
        await showcase.requestFullscreen({navigationUI:'hide'});
        if(isNativeFullscreen()){nativeFullscreen=true;syncFullscreen();return;}
      }else if(showcase.webkitRequestFullscreen){
        showcase.webkitRequestFullscreen();
        await new Promise(resolve=>setTimeout(resolve,350));
        if(isNativeFullscreen()){nativeFullscreen=true;syncFullscreen();return;}
      }
    }catch(_){}
    enterFallbackFullscreen();
  });
  fullExit?.addEventListener('click',event=>{
    event.stopPropagation();
    exitFullscreen();
  });
  const syncFullscreen=()=>{
    const active=isFullscreen();
    full?.setAttribute('aria-pressed',String(active));
    if(full){
      full.textContent=active?'Tela normal':'Tela cheia';
      full.setAttribute('aria-label',active?'Voltar o PDF ao tamanho normal':'Abrir PDF em tela cheia');
    }
    if(fullExit)fullExit.hidden=!active;
    if(active!==lastFullscreen){
      lastFullscreen=active;
      if(documentPDF)requestAnimationFrame(()=>renderPage());
    }
  };
  const onFullscreenChange=()=>{
    const active=isNativeFullscreen();
    if(active||nativeFullscreen){nativeFullscreen=active;syncFullscreen();}
  };
  document.addEventListener('fullscreenchange',onFullscreenChange);
  document.addEventListener('webkitfullscreenchange',onFullscreenChange);
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
