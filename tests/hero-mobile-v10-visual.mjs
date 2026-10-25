import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const dir='qa-hero-mobile-v10';await fs.mkdir(dir,{recursive:true});
const output=[];
async function gotoProgress(page,p){
 await page.evaluate(p=>{
  const t=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
  window.scrollTo({top:t.start+(t.end-t.start)*p,behavior:'instant'});
 },p);await page.waitForTimeout(1200);
}
try{
for(const [width,height] of [[390,844],[360,800],[768,1024]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy'));
 await page.waitForFunction(()=>document.querySelector('[data-role="hero-film"]')?.readyState>=1,{timeout:25000});
 const initial=await page.evaluate(()=>{
 const v=document.querySelector('[data-role="hero-film"]');
 const r=v.getBoundingClientRect(),film=document.querySelector('.hero-film-screen').getBoundingClientRect();
 return {src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,fit:getComputedStyle(v).objectFit,
        visibleWidth:r.width,visibleHeight:r.height,filmWidth:film.width,filmHeight:film.height};
 });
 assert(initial.src.includes('motion-hero-mobile.mp4'),'Não selecionou fonte vertical: '+JSON.stringify(initial));
 assert(Math.abs(initial.width/initial.height-9/16)<.04,'Fonte não é vertical 9:16: '+JSON.stringify(initial));
 assert.equal(initial.fit,'cover','O vídeo inicial não cobre o HERO');
 assert(Math.abs(initial.visibleHeight-height)<3,'Hero não ocupa altura inteira');
 await page.screenshot({path:`${dir}/${width}-inicio.png`});
 await gotoProgress(page,.55);
 const forward=await page.locator('[data-role="hero-film"]').evaluate(v=>v.currentTime);
 await gotoProgress(page,.20);
 const reverse=await page.locator('[data-role="hero-film"]').evaluate(v=>v.currentTime);
 assert(forward>reverse+.5,'Quadros não retrocedem com scroll: '+JSON.stringify({forward,reverse}));
 await gotoProgress(page,.95);
 const final=await page.evaluate(()=>{
 const a=document.querySelector('.hero-film-screen').getBoundingClientRect();
 const b=document.querySelector('.hero-visual').getBoundingClientRect();
 const v=document.querySelector('[data-role="hero-film"]');
 return {a:{x:a.x,y:a.y,w:a.width,h:a.height},b:{x:b.x,y:b.y,w:b.width,h:b.height},
 fit:getComputedStyle(v).objectFit,alpha:getComputedStyle(document.querySelector('#hero-heading')).opacity};
 });
 assert.equal(final.fit,'contain');
 for(const k of ['x','y','w','h']) assert(Math.abs(final.a[k]-final.b[k])<12,'Frame final desalinhado: '+k+' '+JSON.stringify(final));
 assert(Number(final.alpha)>.7,'Copy não revela');
 await page.screenshot({path:`${dir}/${width}-final.png`});
 assert.deepEqual(errors,[]);
 output.push({width,height,initial,forward,reverse,final});
 await page.close();
}
await fs.writeFile(dir+'/report.json',JSON.stringify(output,null,2));
console.log('PASS REAL HERO MOBILE V10 '+output.map(x=>x.width).join(', '));
}finally{await browser.close();}
