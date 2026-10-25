import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const target=process.env.TO_PREVIEW_URL || 'https://ganald.github.io/to-eventos-preview/?v=7-qa';
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
 const visualHero=await page.evaluate(()=>{
   const cue=document.querySelector('.to-hero-scroll-cue');
   const film=document.querySelector('.hero-film-screen');
   const video=document.querySelector('.hero-film-screen video');
   const c=cue?getComputedStyle(cue):null;
   return {cueBackground:c?.backgroundColor,cueBorder:c?.borderTopWidth,cueShadow:c?.boxShadow,filmBackground:film?getComputedStyle(film).backgroundColor:null,videoBackground:video?getComputedStyle(video).backgroundColor:null,fit:video?getComputedStyle(video).objectFit:null,filmWidth:film?.getBoundingClientRect().width,innerWidth:innerWidth,edgeCanvas:!!film?.querySelector('.hero-edge-canvas')};
 });
 assert.equal(visualHero.cueBackground,'rgba(0, 0, 0, 0)','A caixa do mouse deve ser totalmente transparente');
 assert.equal(visualHero.cueBorder,'0px','Mouse scroll sem borda de cartão');
 assert.equal(visualHero.cueShadow,'none','Mouse scroll sem sombra de cartão');
 assert.equal(visualHero.filmBackground,'rgb(255, 97, 8)','Bordas laterais devem ter a cor do vídeo');
 assert.equal(visualHero.videoBackground,'rgb(255, 97, 8)','HERO usa apenas MP4 e ambiente da identidade TO');
 assert.equal(visualHero.edgeCanvas,false,'HERO não deve voltar a duplicar imagem em canvas');
 assert.equal(visualHero.fit,item.tag==='mobile'?'contain':'cover','Modo de mídia do HERO não pode mudar involuntariamente');
 assert(Math.abs(visualHero.filmWidth-item.width)<2,'Vídeo precisa preencher toda a largura da viewport');
 const cuePosition=await page.evaluate(()=>{
   const r=document.querySelector('.to-hero-scroll-cue').getBoundingClientRect();
   return {centerX:r.left+r.width/2,centerY:r.top+r.height/2,width:innerWidth,height:innerHeight};
 });
 assert(Math.abs(cuePosition.centerX-cuePosition.width/2)<2, 'Mouse precisa estar centralizado horizontalmente: '+JSON.stringify(cuePosition));
 assert(Math.abs(cuePosition.centerY-cuePosition.height/2)<3, 'Mouse precisa estar centralizado verticalmente: '+JSON.stringify(cuePosition));

 await page.screenshot({path:out+'/hero-'+item.tag+'.png'});
 const heroTriggerId=item.tag==='mobile'?'to-hero-mobile-film-and-copy':'to-hero-film-and-copy';
 await locate(page,heroTriggerId,.55);
 await page.waitForTimeout(1800);
 await page.screenshot({path:out+'/hero-mid-'+item.tag+'.png'});
 await locate(page,heroTriggerId,.92);
 await page.waitForTimeout(2100);
 const heroDebug=await page.evaluate(()=>({gsap:!!window.gsap,ST:!!window.ScrollTrigger,triggers:window.ScrollTrigger?.getAll().map(t=>({id:t.vars.id,start:t.start,end:t.end,progress:t.progress})),scrollY:scrollY,body:document.body.scrollHeight,ready:document.readyState}));
 console.log('QA HERO DEBUG '+item.tag,JSON.stringify(heroDebug),'pageErrors',JSON.stringify(errors));
 const heroMedia=await page.locator('[data-role="hero-film"]').evaluate(v=>({readyState:v.readyState,currentTime:v.currentTime,duration:v.duration,networkState:v.networkState,seeking:v.seeking,src:v.currentSrc,error:v.error?.message||null}));
 const seekable=await page.locator('[data-role="hero-film"]').evaluate(v=>v.seekable.length?{start:v.seekable.start(0),end:v.seekable.end(0)}:null);
 assert(seekable && seekable.end>=9,'QA server must support byte-range playback: '+JSON.stringify(seekable));
 assert(heroMedia.readyState>=2 && heroMedia.duration>=9 && heroMedia.currentTime>=8,'Vídeo do HERO não decodificou/avançou no scroll: '+JSON.stringify(heroMedia));
 await page.screenshot({path:out+'/hero-copy-'+item.tag+'.png'});
 await page.locator('#sobre').scrollIntoViewIfNeeded();
 await page.waitForTimeout(4700);
 const aboutMedia=await page.locator('.about-floral-video').evaluate(v=>({readyState:v.readyState,currentTime:v.currentTime,duration:v.duration,paused:v.paused,networkState:v.networkState,error:v.error?.message||null}));
 assert(aboutMedia.readyState>=2 && aboutMedia.duration>=5 && aboutMedia.currentTime>=2,'Vídeo das papoulas não tocou ao entrar na seção: '+JSON.stringify(aboutMedia));
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
   assert.equal(heroVisual.fit,'cover','Paisagem mantém HERO full bleed atual');
 }
 await page.locator('#projetos').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1100);
 await page.screenshot({path:out+'/connect-'+item.tag+'.png'});
 const connect=await page.locator('.case-featured video').count();
 assert.equal(connect,1,'Vídeo Connect deveria substituir o frame');
 const mediaSrc=await page.locator('.case-featured video source').first().getAttribute('src');
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
for (const item of [
  {width:1920,height:1080,tag:'fullhd'},
  {width:1890,height:900,tag:'referencia'},
  {width:1024,height:768,tag:'tablet-horizontal'},
  {width:768,height:1024,tag:'tablet-vertical'},
  {width:360,height:800,tag:'mobile-360'}
]){
  const page=await browser.newPage({viewport:{width:item.width,height:item.height}});
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForTimeout(600);
  const box=await page.locator('#hero').boundingBox();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(box&&Math.abs(box.height-item.height)<=2,'HERO deve ocupar viewport '+item.tag);
  if(overflow>2){const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:(typeof e.className==='string'?e.className:'').slice(0,110),text:(e.textContent||'').trim().slice(0,65),rect:e.getBoundingClientRect().toJSON()})).filter(e=>e.rect.right>innerWidth+2 && e.rect.width>0).sort((a,b)=>b.rect.right-a.rect.right).slice(0,25));console.log('QA MOBILE OVERFLOW',item.tag,overflow,JSON.stringify(offenders));}
  const horizontalPan=await page.evaluate(async()=>{const y=window.scrollY;window.scrollTo({left:250,top:y,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(resolve));const x=window.scrollX;window.scrollTo({left:0,top:y,behavior:'instant'});return x;});
  assert(horizontalPan<=1,'Página permite deslocamento horizontal em '+item.tag+': '+horizontalPan);
  if(overflow>2){
    const clipping=await page.evaluate(()=>({html:getComputedStyle(document.documentElement).overflowX,body:getComputedStyle(document.body).overflowX}));
    assert(clipping.html==='clip' && clipping.body==='clip','Overflow decorativo sem contenção em '+item.tag+': '+JSON.stringify(clipping));
  }
  if(item.tag==='referencia'){
    const source=await page.locator('#hero video').first().evaluate(v=>({
      naturalWidth:v.videoWidth,naturalHeight:v.videoHeight,fit:getComputedStyle(v).objectFit
    }));
    assert(source.naturalWidth>0&&source.naturalHeight>0&&source.fit==='cover',
      'HERO deve usar o vídeo atual sem reintroduzir emendas espelhadas: '+JSON.stringify(source));
  }
 await page.screenshot({path:out+'/hero-'+item.tag+'.png'});
 results.push({viewport:item.tag,hero:box,overflow});
  await page.close();
}
await fs.writeFile(out+'/resultados.json',JSON.stringify(results,null,2));
await browser.close();
console.log(JSON.stringify(results,null,2));
