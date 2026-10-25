import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const BASE=process.env.TO_SITE_URL || 'http://127.0.0.1:8765/';
const dir='qa-mobile-scroll-v9';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];

async function touchDrag(page,x,startY,endY) {
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:startY}]});
  for(let i=1;i<=14;i++){
    const y=startY+(endY-startY)*i/14;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
    await page.waitForTimeout(25);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.detach();
  await page.waitForTimeout(850);
}
async function jumpToProgress(page,id,p){
  const exists=await page.evaluate(({id,p})=>{
    const t=window.ScrollTrigger?.getById(id);
    if(!t)return false;
    window.scrollTo({top:t.start+(t.end-t.start)*p,behavior:'instant'});
    return true;
  },{id,p});
  assert(exists,'ScrollTrigger não encontrado: '+id);
  // Após um touch anterior, o compositor ainda pode carregar inércia por
  // alguns frames. O teste só compara o slot quando a timeline estabilizou.
  await page.waitForTimeout(400);
  for(let i=0;i<4;i++){
    const current=await page.evaluate(id=>window.ScrollTrigger?.getById(id)?.progress,id);
    if(Number.isFinite(current)&&Math.abs(current-p)<.015)break;
    await page.evaluate(({id,p})=>{
      const t=window.ScrollTrigger.getById(id);
      window.scrollTo({top:t.start+(t.end-t.start)*p,behavior:'instant'});
      window.ScrollTrigger.update();
    },{id,p});
    await page.waitForTimeout(380);
  }
  const resolved=await page.evaluate(id=>{
    const t=window.ScrollTrigger?.getById(id);
    return {progress:t?.progress,scrollY:scrollY,start:t?.start,end:t?.end};
  },id);
  assert(Math.abs(resolved.progress-p)<.025,'Timeline não estabilizou: '+JSON.stringify({id,p,resolved}));
  await page.waitForTimeout(400);
}

try {
  for (const view of [
    {width:390,height:844,tag:'mobile-390'},
    {width:360,height:800,tag:'mobile-360'},
    {width:768,height:1024,tag:'tablet-768'}
  ]) {
    const page=await browser.newPage({viewport:{width:view.width,height:view.height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy') && !!window.ScrollTrigger?.getAll().find(t=>t.trigger?.id==='projetos'),{timeout:25000});
    await page.screenshot({path:`${dir}/${view.tag}-01-inicio.png`});
    const getHero=()=>page.evaluate(()=>{
      const t=window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy');
      const v=document.querySelector('[data-role=hero-film]');
      return {progress:t?.progress,currentTime:v?.currentTime,duration:v?.duration,readyState:v?.readyState};
    });
    const before=await getHero();
    await touchDrag(page,view.width/2,view.height*.78,view.height*.18);
    const after=await getHero();
    assert(after.progress>before.progress+.03,'Arraste touch NÃO avançou HeroScroll: '+JSON.stringify({before,after,view}));
    await page.screenshot({path:`${dir}/${view.tag}-02-touch-scroll.png`});
    await touchDrag(page,view.width/2,view.height*.2,view.height*.77);
    const reverse=await getHero();
    assert(reverse.progress<after.progress-.015,'Arraste reverso não voltou frames: '+JSON.stringify({after,reverse,view}));

    await jumpToProgress(page,'to-hero-mobile-film-and-copy',.96);
    const ending=await page.evaluate(()=>{
      const video=document.querySelector('[data-role=hero-film]');
      const film=document.querySelector('.hero-film-screen').getBoundingClientRect();
      const target=document.querySelector('.hero-visual').getBoundingClientRect();
      const rect=r=>({x:r.x,y:r.y,w:r.width,h:r.height});
      const heroTrigger=window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy');
      return {
        progress:heroTrigger?.progress,scrollY:scrollY,
        film:rect(film),slot:rect(target),fit:getComputedStyle(video).objectFit,
        time:video.currentTime,duration:video.duration,ready:video.readyState,
        opacity:parseFloat(getComputedStyle(document.querySelector('#hero-heading')).opacity)
      };
    });
    for(const k of ['x','y','w','h'])
      assert(Math.abs(ending.film[k]-ending.slot[k])<11,'Vídeo final não encaixou '+k+' '+JSON.stringify(ending));
    assert(ending.fit==='contain','Vídeo final deve preservar o original');
    assert(ending.opacity>.7,'Copy do HeroScroll mobile não apareceu');
    assert(ending.ready>=2&&ending.time>=Math.max(1,ending.duration*.8),'Vídeo não seguiu a progressão do scroll');
    await page.screenshot({path:`${dir}/${view.tag}-03-hero-final.png`});
    const gallery=await page.evaluate(()=>{
      const trigger=window.ScrollTrigger?.getAll().find(t=>t.trigger?.id==='projetos');
      const track=document.getElementById('projects-track');
      return {start:trigger?.start,end:trigger?.end,width:track?.scrollWidth,direction:getComputedStyle(track).flexDirection};
    });
    assert(gallery.end>gallery.start,'GSAP de projetos não existe no mobile '+view.tag);
    assert.equal(gallery.direction,'row','Os três painéis devem ficar lado a lado');
    await page.evaluate(y=>window.scrollTo({top:y+20,behavior:'instant'}),gallery.start);
    await page.waitForTimeout(1000);
    const debugScroll=()=>page.evaluate(()=>{
      const trigger=window.ScrollTrigger?.getAll().find(t=>t.trigger?.id==='projetos');
      const at=document.elementFromPoint(innerWidth*.5,innerHeight*.75);
      const pin=document.querySelector('.projects-pin');
      const panel=document.querySelector('.project-panel-inner');
      return {y:scrollY,max:document.scrollingElement.scrollHeight-innerHeight,p:trigger?.progress,
        active:trigger?.isActive,start:trigger?.start,end:trigger?.end,
        pinOverflow:getComputedStyle(pin).overflowY,
        pinOverscroll:getComputedStyle(pin).overscrollBehaviorY,
        panelOverflow:getComputedStyle(panel).overflowY,
        panelOverscroll:getComputedStyle(panel).overscrollBehaviorY,
        panelScroll:panel.scrollTop,panelScrollMax:panel.scrollHeight-panel.clientHeight,
        hit:at?.tagName+'.'+at?.className};
    });
    const debugBefore=await debugScroll();
    const x0=await page.locator('#projects-track').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
    await touchDrag(page,view.width/2,view.height*.75,view.height*.23);
    const x1=await page.locator('#projects-track').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
    const debugAfter=await debugScroll();
    console.log('DEBUG TOUCH PIN',JSON.stringify({view,debugBefore,debugAfter,x0,x1}));
    assert(x1<x0-20,'Gesto vertical NÃO moveu projetos na horizontal: '+JSON.stringify({x0,x1,view}));
    await page.screenshot({path:`${dir}/${view.tag}-04-projetos-touch.png`});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert(overflow<=2,'Overflow horizontal da página '+view.tag+': '+overflow);
    assert.deepEqual(errors,[],'Erros JS '+view.tag+': '+errors.join(' | '));
    results.push({viewport:view.tag,before,after,reverse,ending,projects:{x0,x1},overflow});
    await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await reduced.goto(BASE,{waitUntil:'domcontentloaded'});
  assert.equal(await reduced.locator('.hero-visual video[controls]').count(),1,'Redução de movimento precisa dar controle real ao vídeo');
  assert.equal(await reduced.locator('#projects-track').evaluate(el=>getComputedStyle(el).flexDirection),'column','Sem GSAP, preservar alternativa vertical');
  await reduced.close();
  await fs.writeFile(dir+'/results.json',JSON.stringify(results,null,2));
  console.log('PASS MOBILE V9: touch real HERO + reverso + vídeo + GSAP projetos em '+results.map(x=>x.viewport).join(', '));
}finally{
  await browser.close();
}
