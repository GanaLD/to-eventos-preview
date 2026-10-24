import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const target='https://ganald.github.io/to-eventos-preview/?v=7-qa';
const out='qa-artifacts';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
let results=[];
async function locate(page,id,at){
  await page.evaluate(({id,at})=>{
    const trigger=window.ScrollTrigger?.getById(id);
    if(trigger){
      const top=trigger.start+(trigger.end-trigger.start)*at;
      window.scrollTo({top,behavior:'instant'});
    }
  },{id,at});
  await page.waitForTimeout(1200);
}
for (const item of [{width:1440,height:900,tag:'desktop'},{width:390,height:844,tag:'mobile'}]){
 const page=await browser.newPage({viewport:{width:item.width,height:item.height},deviceScaleFactor:1,hasTouch:item.tag==='mobile'});
 const errors=[];const mediaResponses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',response=>{if(response.url().includes('motion-hero.mp4'))mediaResponses.push({status:response.status(),url:response.url()})});
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForTimeout(1500);
 const hero=await page.locator('#hero').boundingBox();
 assert(hero,'HERO deve existir');
 const cue=await page.locator('.to-hero-scroll-cue').count();
 assert(cue===1,'Mouse laranja de orientação precisa existir');
 await page.screenshot({path:out+'/hero-'+item.tag+'.png'});
 const heroTriggerId=item.tag==='mobile'?'to-hero-mobile-film-and-copy':'to-hero-film-and-copy';
 await locate(page,heroTriggerId,.55);
 await page.waitForTimeout(1800);
 await page.screenshot({path:out+'/hero-mid-'+item.tag+'.png'});
 await locate(page,heroTriggerId,.92);
 await page.waitForTimeout(2100);
 const heroMedia=await page.locator('[data-role="hero-film"]').evaluate(v=>({readyState:v.readyState,currentTime:v.currentTime,duration:v.duration,networkState:v.networkState,seeking:v.seeking,src:v.currentSrc,error:v.error?.message||null}));
 await page.screenshot({path:out+'/hero-copy-'+item.tag+'.png'});
 await page.locator('#sobre').scrollIntoViewIfNeeded();
 await page.waitForTimeout(4700);
 const aboutMedia=await page.locator('.about-floral-video').evaluate(v=>({readyState:v.readyState,currentTime:v.currentTime,duration:v.duration,paused:v.paused,networkState:v.networkState,error:v.error?.message||null}));
 await page.screenshot({path:out+'/sobre-'+item.tag+'.png'});
 await page.locator('#solucoes').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1400);
 await page.screenshot({path:out+'/competencias-'+item.tag+'.png'});
 const floral=await page.evaluate(()=>{
   const ids=['.solutions-floral-left','.solutions-floral-right'];
   return ids.map(sel=>{const e=document.querySelector(sel);const r=e?.getBoundingClientRect();return {sel,src:e?.getAttribute('src'),width:r?.width,left:r?.left,right:r?.right,opacity:e?parseFloat(getComputedStyle(e).opacity):null};});
 });
 if(item.tag==='desktop'){
   const heroVisual=await page.evaluate(()=>{
     const film=document.querySelector('.hero-film-screen video');return {fit:film?getComputedStyle(film).objectFit:null,w:film?.videoWidth,h:film?.videoHeight};
   });
   assert.equal(heroVisual.fit,'contain','Vídeo de HERO integral sem corte');
 }
 await page.locator('#projetos').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1100);
 await page.screenshot({path:out+'/connect-'+item.tag+'.png'});
 const connect=await page.locator('.case-featured video').count();
 assert.equal(connect,1,'Vídeo Connect deveria substituir o frame');
 const mediaSrc=await page.locator('.case-featured video source').getAttribute('src');
 assert.equal(mediaSrc,'assets/media/connect-web.webm');
 assert.equal(await page.locator('.case-featured video source[type="video/mp4"]').getAttribute('src'),'assets/media/connect-web.mp4');
 if(item.tag==='desktop'){
   await locate(page,'to-v7-lateral-papoulas',.5);
   // O showcase ocupa o último painel do GSAP, acessado pelo final do pin.
   const traveled=await page.evaluate(()=>{
     const trigger=window.ScrollTrigger?.getAll().find(t=>t.trigger?.id==='projetos');
     return trigger?{start:trigger.start,end:trigger.end}:null;
   });
   if(traveled){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),traveled.end-80);await page.waitForTimeout(1800);}
 }else{
   await page.locator('#to-pdf-showcase').scrollIntoViewIfNeeded();
   await page.waitForTimeout(1500);
 }
 await page.screenshot({path:out+'/pdf-showcase-'+item.tag+'.png'});
 const pdf=page.locator('#to-pdf-showcase');
 const count=await pdf.locator('.to-pdf-counter').textContent();
 const viewer=await pdf.count();
 assert.equal(viewer,1,'Showcase PDF ausente');
 assert.equal(count?.trim(),'01 / 13','PDF deve abrir na primeira página');
 await pdf.locator('[data-pdf-action=next]').click({timeout:12000});
 await page.waitForTimeout(500);
 assert.equal((await pdf.locator('.to-pdf-counter').textContent())?.trim(),'02 / 13','PDF deve permitir avançar');
 await pdf.locator('[data-pdf-action=previous]').click();
 assert.equal((await pdf.locator('.to-pdf-counter').textContent())?.trim(),'01 / 13','PDF deve permitir voltar');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(overflow<=2,'Overflow horizontal de '+overflow+'px no '+item.tag);
 results.push({viewport:item.tag,hero,heroMedia,aboutMedia,mediaResponses,floral,mediaSrc,overflow,pdf:'01/13 -> 02/13 -> 01/13',pageErrors:errors});
 await page.close();
}
await fs.writeFile(out+'/resultados.json',JSON.stringify(results,null,2));
await browser.close();
console.log(JSON.stringify(results,null,2));
