import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.TO_SITE_URL || 'http://127.0.0.1:4173/';
await fs.mkdir('qa-mobile-v8',{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
const approx=(a,b,tol=8)=>Math.abs(a-b)<=tol;
const scrollToTrigger=async(page,triggerId,p)=>{
  const found=await page.evaluate(({triggerId,p})=>{
    const t=window.ScrollTrigger?.getById(triggerId);
    if(!t)return false;
    window.scrollTo({top:t.start+(t.end-t.start)*p,behavior:'instant'});
    return true;
  },{triggerId,p});
  assert(found,'ScrollTrigger ausente: '+triggerId);
  await page.waitForTimeout(850);
};

try{
for(const {width,height,tag} of [
  {width:360,height:800,tag:'mobile360'},
  {width:390,height:844,tag:'mobile390'},
  {width:768,height:1024,tag:'tablet768'}
]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>Boolean(window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy')),{timeout:20000});
  await page.screenshot({path:`qa-mobile-v8/${tag}-hero-inicio.png`});
  await scrollToTrigger(page,'to-hero-mobile-film-and-copy',.95);

  const hero=await page.evaluate(()=>{
    const a=document.querySelector('.hero-film-screen').getBoundingClientRect();
    const b=document.querySelector('.hero-visual').getBoundingClientRect();
    const v=document.querySelector('.hero-film-screen video');
    const title=document.querySelector('#hero-heading');
    return {film:{x:a.x,y:a.y,w:a.width,h:a.height},
      slot:{x:b.x,y:b.y,w:b.width,h:b.height},
      titleOpacity:parseFloat(getComputedStyle(title).opacity),
      videoFit:getComputedStyle(v).objectFit,videoVisibility:getComputedStyle(v).visibility};
  });
  assert(approx(hero.film.x,hero.slot.x)&&approx(hero.film.y,hero.slot.y),'Hero mobile perdeu alinhamento final: '+JSON.stringify(hero));
  assert(approx(hero.film.w,hero.slot.w)&&approx(hero.film.h,hero.slot.h),'Hero mobile distorceu proporção: '+JSON.stringify(hero));
  assert.equal(hero.videoFit,'contain','Não recortar enquadramento final');
  assert(hero.titleOpacity>.55,'Texto deve aparecer somente após fase do vídeo');
  await page.screenshot({path:`qa-mobile-v8/${tag}-hero-final.png`});

  const gallery=await page.evaluate(()=>{
    const el=document.getElementById('projetos');
    const t=window.ScrollTrigger?.getAll().find(t=>t.trigger===el);
    const track=document.getElementById('projects-track');
    const pin=document.getElementById('projects-pin');
    return {start:t?.start,end:t?.end,travel:track.scrollWidth-pin.clientWidth,
      direction:getComputedStyle(track).flexDirection,
      pinHeight:pin.getBoundingClientRect().height};
  });
  assert(Number.isFinite(gallery.start)&&gallery.end>gallery.start,'Galeria não está sob GSAP no mobile');
  assert(gallery.travel>width,'Os três painéis devem formar trilho horizontal');
  assert.equal(gallery.direction,'row','Galeria não pode virar coluna com GSAP ativo');
  await page.evaluate(v=>window.scrollTo({top:v,behavior:'instant'}),gallery.start+(gallery.end-gallery.start)*.56);
  await page.waitForTimeout(850);
  const position=await page.locator('#projects-track').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  assert(position<-(width*.4),'Galeria não deslocou para direita ao rolar: '+position);
  assert.equal(await page.locator('.case-featured video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
  await page.screenshot({path:`qa-mobile-v8/${tag}-galeria-meio.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(overflow<=2,'Overflow horizontal indesejado: '+overflow);
  assert.deepEqual(errors,[],'Erros JS: '+errors.join(' | '));
  results.push({tag,hero,gallery,trackOffset:position,overflow,pageErrors:errors});
  await page.close();
}
const accessible=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await accessible.goto(base,{waitUntil:'domcontentloaded'});
await accessible.waitForTimeout(300);
assert.equal(await accessible.locator('.hero-visual video[controls]').count(),1,'Sem motion, o vídeo deve ser navegável com controles');
assert.equal(await accessible.locator('.hero-film-screen').count(),0,'Fallback não deve deixar tela duplicada');
assert.equal(await accessible.locator('#projects-track').evaluate(el=>getComputedStyle(el).flexDirection),'column','Movimento reduzido deve manter fallback vertical');
await accessible.close();
await fs.writeFile('qa-mobile-v8/resultados.json',JSON.stringify(results,null,2));
console.log('TO V8: desktop preservado; mobile e reduced motion verificados. '+JSON.stringify(results.map(x=>({tag:x.tag,overflow:x.overflow,offset:x.trackOffset}))));
} finally {await browser.close();}
