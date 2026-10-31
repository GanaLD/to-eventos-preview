import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const url = process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const page = await browser.newPage({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});
    await page.route('https://cdnjs.cloudflare.com/ajax/libs/**',route=>{
      const name=new URL(route.request().url()).pathname.split('/').pop();
      if(['gsap.min.js','ScrollTrigger.min.js'].includes(name)) return route.fulfill({path:fileURLToPath(new URL('../site/vendor/'+name,import.meta.url)),contentType:'application/javascript'});
      return route.continue();
    });
    await page.goto(url,{waitUntil:'load',timeout:60000});
    await page.waitForFunction(()=>ScrollTrigger.getById('to-hero-film-and-copy')||ScrollTrigger.getById('to-hero-mobile-film-and-copy'));
    await page.evaluate(()=>document.fonts.ready);
    const sample=async(progress,label)=>{
      await page.evaluate(progress=>{
        const t=ScrollTrigger.getById('to-hero-film-and-copy')||ScrollTrigger.getById('to-hero-mobile-film-and-copy');
        scrollTo({top:t.start+(t.end-t.start)*progress,behavior:'instant'});ScrollTrigger.update();
      },progress);
      await page.waitForFunction(progress=>{
        const t=ScrollTrigger.getById('to-hero-film-and-copy')||ScrollTrigger.getById('to-hero-mobile-film-and-copy');
        return Math.abs(t.progress-progress)<.003;
      },progress,{timeout:10000});
      await page.waitForTimeout(350);
      const state=await page.evaluate(()=>{
        const film=document.querySelector('.hero-film-screen');
        const placeholder=document.querySelector('.hero-visual');
        const video=film.querySelector('video');
        const background=document.querySelector('.to-hero-thaiso-backdrop');
        const t=ScrollTrigger.getById('to-hero-film-and-copy')||ScrollTrigger.getById('to-hero-mobile-film-and-copy');
        const rect=film.getBoundingClientRect();
        return {progress:t.progress,opacity:Number(getComputedStyle(film).opacity),copyOpacity:Number(getComputedStyle(document.querySelector('.hero-copy').children[0]).opacity),placeholderBackground:getComputedStyle(placeholder).backgroundColor,placeholderBorder:getComputedStyle(placeholder).borderColor,backgroundVisible:getComputedStyle(background).visibility,videoTime:video.currentTime,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
      });
      if(process.env.TO_HERO_SCREENSHOTS) await page.screenshot({path:`qa-artifacts/hero-fade-${viewport.width}-${label}.png`});
      return state;
    };
    const before=await sample(.80,'before');
    const entering=await sample(.88,'entering');
    const end=await sample(.99,'end');
    const reverse=await sample(.88,'reverse');
    const restored=await sample(.80,'restored');
    assert(before.opacity>.99,JSON.stringify({before}));
    assert(entering.opacity>0.05&&entering.opacity<.95,JSON.stringify({entering}));
    assert(entering.copyOpacity>0&&entering.backgroundVisible==='visible',JSON.stringify({entering}));
    assert(end.opacity<.01&&end.copyOpacity>.99,JSON.stringify({end}));
    assert(Math.abs(entering.opacity-reverse.opacity)<.03,JSON.stringify({entering,reverse}));
    assert(restored.opacity>.99&&Math.abs(before.opacity-restored.opacity)<.01,JSON.stringify({before,restored}));
    assert(end.placeholderBackground==='rgba(0, 0, 0, 0)'&&end.placeholderBorder==='rgba(0, 0, 0, 0)',JSON.stringify({end}));
    assert(Math.abs(entering.rect.x-reverse.rect.x)<1&&Math.abs(entering.rect.width-reverse.rect.width)<1,JSON.stringify({entering,reverse}));
    console.log('PASS fade reversível, fundo e textos',viewport.width,JSON.stringify({before,entering,end,reverse,restored}));
    await page.close();
  }
} finally { await browser.close(); }
