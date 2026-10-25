import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base='http://127.0.0.1:8765/';
const measure=()=>{const v=document.querySelector('[data-role="hero-film"]');return {src:v.currentSrc,w:v.videoWidth,h:v.videoHeight,forced:v.hasAttribute('src'),hero:document.getElementById('hero').getBoundingClientRect().toJSON(),media:matchMedia('(max-width: 899px) and (orientation: portrait)').matches};};
async function check(page,mode){
 await page.waitForFunction(mode==='portrait'?
  ()=>{const v=document.querySelector('[data-role="hero-film"]');return v?.readyState>=1&&v.videoHeight>v.videoWidth;}:
  ()=>{const v=document.querySelector('[data-role="hero-film"]');return v?.readyState>=1&&v.videoWidth>v.videoHeight;},{timeout:30000});
 const d=await page.evaluate(measure);
 if(mode==='portrait'){
  assert(d.src.includes('motion-hero-vertical-v11.mp4'),'Source horizontal ainda carregada no mobile '+JSON.stringify(d));
  assert(Math.abs(d.w/d.h-9/16)<.02,'Proporção precisa ser 9:16 '+JSON.stringify(d));
  assert(d.forced,'Deve forcar atributo src no mobile');
 } else {
  assert(d.src.includes('motion-hero.mp4'),'Desktop perdeu mídia original '+JSON.stringify(d));
  assert(d.w/d.h>1.7&&d.w/d.h<1.85,'Desktop precisa ser 16:9 '+JSON.stringify(d));
  assert(!d.forced,'Desktop nao pode receber src forçado');
 }
 return d;
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 console.log('PASS desktop inicial',JSON.stringify(await check(page,'landscape')));
 await page.setViewportSize({width:390,height:844});
 console.log('PASS resize desktop→mobile',JSON.stringify(await check(page,'portrait')));
 await page.setViewportSize({width:360,height:800});
 console.log('PASS mobile 360px',JSON.stringify(await check(page,'portrait')));
 await page.setViewportSize({width:1440,height:900});
 console.log('PASS resize mobile→desktop',JSON.stringify(await check(page,'landscape')));
 await page.close();
 for(const [width,height] of [[390,844],[360,800],[768,1024]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
  await p.goto(base,{waitUntil:'domcontentloaded'});
  const d=await check(p,'portrait');
  await p.waitForFunction(()=>!!document.getElementById('to-floral-mobile-v15'),{timeout:30000});
  const flora=await p.evaluate(()=>{
   const e=document.getElementById('to-floral-mobile-v15');
   return {video:document.getElementById('to-floral-mobile-v15-video')?.currentSrc,
           visible:getComputedStyle(e).display,opacity:getComputedStyle(e).opacity,blend:getComputedStyle(e).mixBlendMode};
  });
  assert(flora.video.includes('floral-mobile-v14.mp4'),'Moldura vertical foi alterada');
  console.log('PASS touch portrait',width,height,d.src,flora);
  await p.close();
 }
}finally{await browser.close()}
