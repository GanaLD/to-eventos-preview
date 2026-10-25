import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome', headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
async function gotoProgress(page,progress){
  for(let attempt=0;attempt<8;attempt++){
    await page.evaluate(p=>{
      const trigger=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
      window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*p,behavior:'instant'});
      ScrollTrigger.update();
    },progress);
    await page.waitForTimeout(400);
    const actual=await page.evaluate(()=>ScrollTrigger.getById('to-hero-mobile-film-and-copy').progress);
    if(Math.abs(actual-progress)<.02)return actual;
  }
  return page.evaluate(()=>ScrollTrigger.getById('to-hero-mobile-film-and-copy').progress);
}
async function borderDiff(page){
 const before=PNG.sync.read(await page.screenshot());
 await page.evaluate(()=>document.getElementById('to-floral-mobile-v15').style.display='none');
 await page.waitForTimeout(130);
 const after=PNG.sync.read(await page.screenshot());
 await page.evaluate(()=>document.getElementById('to-floral-mobile-v15').style.display='');
 let visible=0;
 const w=before.width,h=before.height;
 for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){
   if(!(x<w*.28||x>w*.72||y<h*.19||y>h*.81))continue;
   const n=4*(y*w+x);
   const diff=Math.abs(before.data[n]-after.data[n])+
              Math.abs(before.data[n+1]-after.data[n+1])+
              Math.abs(before.data[n+2]-after.data[n+2]);
   if(diff>65)visible++;
 }
 return visible;
}
try{
  for(const {width,height} of [{width:390,height:844},{width:360,height:800},{width:768,height:1024}]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('to-floral-mobile-v15-video')?.readyState>=2,{timeout:30000});
    const d=await page.evaluate(()=>{
      const v=document.getElementById('to-floral-mobile-v15-video');
      const layer=document.getElementById('to-floral-mobile-v15');
      return {src:v.currentSrc,w:v.videoWidth,h:v.videoHeight,dur:v.duration,blend:getComputedStyle(layer).mixBlendMode,
        visible:getComputedStyle(layer).display!=='none',canvas:!!document.getElementById('to-floral-intro-v10'),
        bgHero:document.querySelector('[data-role="hero-film"] source:last-child')?.getAttribute('src')};
    });
    assert(d.src.includes('floral-mobile-v14.mp4'),'Mídia mobile errada: '+JSON.stringify(d));
    assert.equal(d.blend,'screen');
    assert(!d.canvas,'Mobile ainda está usando o canvas desktop');
    assert.equal(d.bgHero,'assets/media/motion-hero.mp4');
    await page.evaluate(async()=>{
      const v=document.getElementById('to-floral-mobile-v15-video');v.pause();
      v.currentTime=Math.max(0,v.duration-.25);
      await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));
    });
    await page.waitForTimeout(160);
    const visible=await borderDiff(page);
    assert(visible>1000,'Flores não estão VISÍVEIS no screenshot; pixels diferentes na borda: '+visible);
    await page.waitForFunction(()=>!!window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy'),{timeout:30000});
    const p=await gotoProgress(page,.21);
    await page.waitForTimeout(250);
    const opacity=await page.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('to-floral-mobile-v15')).opacity));
    assert(Math.abs(p-.21)<.04,'Scroll do Hero fora da posição: '+p);
    assert(opacity>.3&&opacity<.7,'Moldura não desaparece proporcionalmente: '+opacity);
    await page.evaluate(()=>document.fonts?.ready);
    console.log('PASS MOBILE '+width+'x'+height+': pixels visiveis='+visible+', fade='+opacity+', progress='+p);
    assert.deepEqual(errors,[]);
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.to-floral-v10-video-decoder')?.readyState>=2,{timeout:30000});
  const desktop=await page.evaluate(()=>({
    desktopSrc:document.querySelector('.to-floral-v10-video-decoder').currentSrc,
    canvas:!!document.getElementById('to-floral-intro-v10'),
    mobileLayer:!!document.getElementById('to-floral-mobile-v15')
  }));
  assert(desktop.desktopSrc.includes('moldura-v13-screen.mp4'),'Desktop V13 foi alterado');
  assert(desktop.canvas&&!desktop.mobileLayer,'Desktop deve manter canvas original e nenhuma camada mobile');
  console.log('PASS DESKTOP: V13 original intacta');
  await page.close();
}finally{await browser.close();}
