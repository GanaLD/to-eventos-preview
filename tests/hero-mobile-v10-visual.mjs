import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
const dir='qa-mobile-hero-v10';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];

async function drag(page,start,end){
 const cdp=await page.context().newCDPSession(page);
 const x=page.viewportSize().width*.5;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
 for(let i=1;i<=16;i++){
   const y=start+(end-start)*i/16;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
   await page.waitForTimeout(35);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.detach();
 await page.waitForTimeout(1050);
}
async function progress(page,p){
 const exists=await page.evaluate(p=>{
  const t=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
  if(!t)return false;
  window.scrollTo({top:t.start+(t.end-t.start)*p,behavior:'instant'});
  return true;
 },p);
 assert(exists,'Trigger do HeroScroll mobile não existe');
 await page.waitForTimeout(1600);
}
async function sample(page){
 return page.evaluate(()=>{
  const video=document.querySelector('#hero [data-role="hero-film"]');
  const t=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
  const screen=document.querySelector('#hero .hero-film-screen');
  const slot=document.querySelector('#hero .hero-visual');
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
  let pixels=[];
  if(video.readyState>=2){
   const c=document.createElement('canvas');c.width=36;c.height=64;
   const ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(video,0,0,36,64);
   const a=ctx.getImageData(0,0,36,64).data;
   for(let i=0;i<a.length;i+=32)pixels.push(a[i]+a[i+1]+a[i+2]);
  }
  return {scrollProgress:t?.progress,videoTime:video.currentTime,duration:video.duration,
   ready:video.readyState,videoWidth:video.videoWidth,videoHeight:video.videoHeight,
   src:video.currentSrc.split('/').at(-1),paused:video.paused,
   fit:getComputedStyle(video).objectFit,mask:getComputedStyle(video).maskImage,
   visibility:getComputedStyle(video).visibility,film:rect(screen),slot:rect(slot),pixels};
 });
}
function pixelDifference(a,b) {
 return Math.round(a.pixels.reduce((sum,v,i)=>sum+Math.abs(v-(b.pixels[i]||0)),0)/Math.max(1,a.pixels.length));
}

try{
 for(const v of [
  {width:390,height:844,tag:'390x844'},
  {width:360,height:800,tag:'360x800'},
  {width:768,height:1024,tag:'768x1024'}]){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const failed=[];page.on('response',r=>{if(r.url().includes('motion-hero')&&r.status()>=400)failed.push([r.status(),r.url()])});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>Boolean(window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy')),{timeout:20000});
  await page.waitForFunction(()=>document.querySelector('[data-role=hero-film]')?.readyState>=2,{timeout:25000});
  const first=await sample(page);
  assert.equal(first.src,'motion-hero-mobile.mp4','Ainda carrega vídeo horizontal em viewport vertical');
  assert(Math.abs(first.videoWidth/first.videoHeight-9/16)<.03,'O vídeo DEVE ser 9:16 real');
  assert.equal(first.fit,'cover','Vídeo inicial deve ser full-bleed');
  assert.equal(first.mask,'none','Abertura não pode ter máscara/letterboxing');
  assert(Math.abs(first.film.w-v.width)<2 && Math.abs(first.film.h-v.height)<3,'Vídeo precisa ocupar tela inteira');
  await page.screenshot({path:`${dir}/${v.tag}-00-abertura.jpg`,type:'jpeg',quality:65});
  await progress(page,.22);const early=await sample(page);
  await page.screenshot({path:`${dir}/${v.tag}-22.jpg`,type:'jpeg',quality:65});
  await progress(page,.64);const later=await sample(page);
  await page.screenshot({path:`${dir}/${v.tag}-64.jpg`,type:'jpeg',quality:65});
  assert(later.videoTime>early.videoTime+1,'Tempo do vídeo não acompanha scroll');
  assert(pixelDifference(early,later)>15,'Frames visuais praticamente iguais: não parece HeroScroll');
  await drag(page,v.height*.25,v.height*.76);
  const reverse=await sample(page);
  assert(reverse.videoTime<later.videoTime-.25,'Arraste físico reverso não diminuiu o tempo do vídeo');
  await progress(page,.96);
  const ending=await sample(page);
  await page.screenshot({path:`${dir}/${v.tag}-96-final.jpg`,type:'jpeg',quality:65});
  assert.equal(ending.fit,'contain','Fim precisa mostrar mídia sem corte');
  assert.equal(ending.mask,'none','Vídeo final sem máscara');
  assert(Math.abs(ending.slot.w-ending.film.w)<10 && Math.abs(ending.slot.h-ending.film.h)<10,'Frame não se encaixa no slot');
  assert(Math.abs(ending.slot.w/ending.slot.h-9/16)<.03,'Card final precisa respeitar mídia retrato');
  assert.deepEqual(failed,[],'Erro ao carregar vídeos');
  assert.deepEqual(errors,[],'Erro JS na página');
  results.push({v,first:{...first,pixels:undefined},earlyTime:early.videoTime,laterTime:later.videoTime,
   reverseTime:reverse.videoTime,pixelDelta:pixelDifference(early,later),
   ending:{...ending,pixels:undefined},failed,errors});
  await page.close();
 }
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.goto(base,{waitUntil:'domcontentloaded'});
 await desktop.waitForFunction(()=>document.querySelector('[data-role=hero-film]')?.readyState>=2);
 const desk=await desktop.locator('[data-role=hero-film]').evaluate(v=>({src:v.currentSrc,ratio:v.videoWidth/v.videoHeight}));
 assert(desk.src.includes('motion-hero.mp4'),'Desktop mantém mídia autoral horizontal');
 assert(Math.abs(desk.ratio-16/9)<.03,'Desktop continua em 16:9');
 await desktop.close();
 await fs.writeFile(dir+'/results.json',JSON.stringify(results,null,2));
 console.log('PASS: HeroScroll MOBILE 9:16 full-bleed, frames distintos, gesto reversível e card final '+results.map(x=>x.v.tag+' delta='+x.pixelDelta).join(', '));
}finally{await browser.close();}
