import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const dir='qa-mobile-scroll-v74';
await fs.mkdir(dir,{recursive:true});
const result=[];
try {
  for(const {width,height,tag} of [
    {width:390,height:844,tag:'mobile390'},
    {width:360,height:800,tag:'mobile360'},
    {width:768,height:1024,tag:'tablet768'}
  ]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>{
      const st=window.ScrollTrigger;
      return Boolean(st?.getById('to-hero-mobile-film-and-copy')&&st?.getAll().some(t=>t.trigger?.id==='projetos'&&t.pin));
    },{timeout:25000});
    const heroMeta=await page.evaluate(()=>{
      const t=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
      return {start:t.start,end:t.end,pin:!!t.pin};
    });
    assert(heroMeta.pin && heroMeta.end>heroMeta.start,'HERO deve estar pinned e controlar scrubbing');
    await page.evaluate(meta=>scrollTo({top:meta.start+(meta.end-meta.start)*.45,behavior:'instant'}),heroMeta);
    await page.waitForTimeout(1800);
    const hero=await page.locator('[data-role="hero-film"]').evaluate(v=>({
      time:v.currentTime,duration:v.duration,src:v.currentSrc,ready:v.readyState,error:v.error?.message||null
    }));
    assert(hero.ready>=2 && hero.time>0.5,'Dedo precisa controlar frames do vídeo no HERO: '+JSON.stringify(hero));
    assert(hero.src.includes('motion-hero-mobile.mp4'),'Mobile retrato deve receber fonte 9:16 sem bordas duplicadas');
    await page.screenshot({path:`${dir}/${tag}-hero-progress.png`});

    const gallery=await page.evaluate(()=>{
      const panel=document.getElementById('projetos');
      const pin=document.getElementById('projects-pin');
      const track=document.getElementById('projects-track');
      const t=ScrollTrigger.getAll().find(x=>x.trigger===panel&&x.pin);
      return {
        start:t?.start,end:t?.end,pin:!!t?.pin,
        direction:getComputedStyle(track).flexDirection,
        totalWidth:track.scrollWidth,
        pinWidth:pin.clientWidth,
        snap:getComputedStyle(pin).scrollSnapType,
        overflow:getComputedStyle(pin).overflowX
      };
    });
    assert(gallery.pin && gallery.end>gallery.start,'PROJETOS devem ser pinned GSAP no touch');
    assert.equal(gallery.direction,'row','Os cases não podem virar coluna vertical');
    assert(gallery.totalWidth>=width*2.8,'Mídias/cases devem permanecer três painéis horizontais');
    await page.evaluate(top=>scrollTo({top,behavior:'instant'}),gallery.start+100);
    await page.waitForTimeout(1500);
    const before=await page.locator('#projects-track').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
    const yBefore=await page.evaluate(()=>scrollY);
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture',{
      x:width-8,y:Math.floor(height*.59),yDistance:-460,
      gestureSourceType:'touch',speed:700
    });
    await page.waitForTimeout(1800);
    const after=await page.locator('#projects-track').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
    const yAfter=await page.evaluate(()=>scrollY);
    assert(yAfter>yBefore+40,'Touch scroll real não avançou no pin: '+JSON.stringify({before,after,yBefore,yAfter}));
    assert(after<before-35,'O trilho não acompanhou gesto touch: '+JSON.stringify({before,after}));
    assert.equal(await page.locator('.case-featured video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
    await page.screenshot({path:`${dir}/${tag}-projects-touch.png`});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert(overflow<=2,'Site sofreu overflow horizontal '+overflow);
    assert.deepEqual(errors,[],'Erros JavaScript '+tag+': '+errors.join(','));
    result.push({tag,hero,gallery,touch:{yBefore,yAfter,trackBefore:before,trackAfter:after},overflow});
    await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  assert.equal(await reduced.locator('.hero-visual video[controls]').count(),1,'Movimento reduzido mantém vídeo acessível');
  assert.equal(await reduced.locator('#projects-track').evaluate(e=>getComputedStyle(e).flexDirection),'column','Reduced motion mantém fallback vertical');
  await reduced.close();
  await fs.writeFile(dir+'/resultados.json',JSON.stringify(result,null,2));
  console.log('PASS MOBILE TOUCH: '+JSON.stringify(result.map(x=>({screen:x.tag,yMovement:x.touch.yAfter-x.touch.yBefore,trackMovement:x.touch.trackAfter-x.touch.trackBefore,videoTime:x.hero.time,overflow:x.overflow}))));
}finally{await browser.close();}
