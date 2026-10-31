import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base=process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const requested=[];
page.on('request',request=>requested.push(request.url()));
await page.route('https://cdnjs.cloudflare.com/ajax/libs/**',route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop();
  if(['gsap.min.js','ScrollTrigger.min.js','pdf.min.js','pdf.worker.min.js'].includes(name))return route.fulfill({path:fileURLToPath(new URL('../site/vendor/'+name,import.meta.url)),contentType:'application/javascript'});
  return route.continue();
});
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.ScrollTrigger?.getAll().some(t=>t.trigger?.id==='projetos'));
  await page.waitForTimeout(2200);
  for(const media of ['connect-web.mp4','papoulas-invisivel-aquarela-v1.mp4','pdf.min.js']){
    assert(!requested.some(url=>url.includes(media)),media+' carregou antes da seção');
  }
  const florals=await page.locator('.solutions-floral').evaluateAll(images=>images.map(image=>image.currentSrc));
  assert(florals.filter(Boolean).every(url=>url.includes('-mobile.webp')),'Imagens mobile dos florais não foram selecionadas: '+florals.join(', '));
  await page.evaluate(()=>{const t=ScrollTrigger.getById('to-v7-sobre-intro');scrollTo(0,t.start+100)});
  await page.waitForFunction(()=>{const v=document.querySelector('.about-floral-video');return v.currentSrc.includes('papoulas-invisivel-aquarela-v1.mp4')&&!v.paused},{},{timeout:30000});
  await page.evaluate(()=>{const t=ScrollTrigger.getById('to-v7-lateral-papoulas');scrollTo(0,t.start+100)});
  await page.waitForFunction(()=>[...document.querySelectorAll('.solutions-floral')].every(image=>image.currentSrc.includes('-mobile.webp')&&image.complete),{},{timeout:30000});
  await page.evaluate(()=>{const t=ScrollTrigger.getAll().find(t=>t.trigger?.id==='projetos');scrollTo(0,t.start+20)});
  await page.waitForFunction(()=>{const v=document.querySelector('[data-role="connect-autoplay"]');return v.currentSrc.includes('connect-web.mp4')&&!v.paused},{},{timeout:30000});
  await page.evaluate(()=>{const t=ScrollTrigger.getAll().find(t=>t.trigger?.id==='projetos');scrollTo(0,t.end-10)});
  await page.locator('#to-pdf-showcase.is-ready').waitFor({timeout:30000});
  assert(requested.some(url=>url.includes('pdf.min.js')),'Leitor de PDF não foi carregado ao chegar à seção');
  console.log('PASS mobile: mídia fora da tela adiada, imagens responsivas, papoulas, Connect e PDF ativos na seção');
}finally{await browser.close();}
