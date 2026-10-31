import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const url=process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
for(const viewport of [{width:1705,height:867},{width:1440,height:900},{width:1280,height:600},{width:390,height:844}]){
 if(process.env.TO_LAYOUT_WIDTH&&viewport.width!==Number(process.env.TO_LAYOUT_WIDTH))continue;
 const page=await browser.newPage({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/**',route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop();
  if(['gsap.min.js','ScrollTrigger.min.js','pdf.min.js','pdf.worker.min.js'].includes(name))return route.fulfill({path:fileURLToPath(new URL('../site/vendor/'+name,import.meta.url)),contentType:'application/javascript'});
  return route.continue();
 });
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ScrollTrigger?.getAll().some(t=>t.trigger?.id==='projetos'));
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1600);
 await page.evaluate(()=>{const t=ScrollTrigger.getAll().find(t=>t.trigger?.id==='projetos');scrollTo(0,t.start+1)});
 await page.waitForTimeout(2200);
 const geometry=await page.evaluate(()=>{
  const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
  return {header:rect('.project-panel-summit .projects-top'),video:rect('.case-featured .case-image'),caption:rect('.project-panel-summit .case-caption'),title:rect('#projetos-heading'),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 await page.screenshot({path:`qa-artifacts/connect-layout-${viewport.width}.png`});
 assert(Math.abs(geometry.header.x-geometry.video.x)<2&&Math.abs(geometry.header.width-geometry.video.width)<2,JSON.stringify(geometry));
 assert(geometry.video.bottom<viewport.height-48,JSON.stringify(geometry));
 assert(geometry.overflow<=2,JSON.stringify(geometry));
 if(viewport.width>=900)assert(Math.abs(geometry.caption.y-geometry.title.y)<2,JSON.stringify(geometry));
 console.log('LAYOUT',viewport.width,JSON.stringify(geometry));
 await page.evaluate(()=>{window.__nativeRequestFS=Element.prototype.requestFullscreen});
 for(const mode of ['allowed','denied','pending']){
  await page.evaluate(mode=>{Element.prototype.requestFullscreen=mode==='allowed'?window.__nativeRequestFS:mode==='denied'?()=>Promise.reject(new Error('not allowed')):()=>new Promise(()=>{});},mode);
  await page.locator('.case-featured [data-connect-fullscreen]').click();
  const dialog=page.locator('dialog.to-media-dialog[open]');await dialog.waitFor();
  assert(await dialog.evaluate(el=>el.matches(':modal')),'Expanded video must be in the top layer');
  const box=await dialog.boundingBox();assert(box.width>=viewport.width-2&&box.height>=viewport.height-2);
  const closeBox=await dialog.locator('[data-connect-fullscreen]').boundingBox();
  assert(closeBox.y>=0&&closeBox.y+closeBox.height<=viewport.height,'Connect close button is outside the viewport: '+JSON.stringify(closeBox));
  await page.screenshot({path:`qa-artifacts/connect-expanded-${mode}-${viewport.width}.png`});
  if(mode!=='pending')await dialog.locator('[data-connect-fullscreen]').click();else await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
 }
 await page.evaluate(()=>{const t=ScrollTrigger.getAll().find(t=>t.trigger?.id==='projetos');scrollTo(0,t.end-10)});
 await page.locator('#to-pdf-showcase.is-ready').waitFor({timeout:30000});
 await page.evaluate(()=>{window.__originalPdfFrame=document.querySelector('#to-pdf-showcase iframe')});
 const before=await page.evaluate(()=>({y:scrollY,counter:document.querySelector('#to-pdf-showcase output').textContent}));
 for(const mode of ['allowed','denied','pending']){
  await page.evaluate(mode=>{Element.prototype.requestFullscreen=mode==='allowed'?window.__nativeRequestFS:mode==='denied'?()=>Promise.reject(new Error('not allowed')):()=>new Promise(()=>{});},mode);
  await page.locator('#to-pdf-showcase [data-pdf-action="fullscreen"]').click();
  const dialog=page.locator('dialog.to-pdf-dialog[open]');await dialog.waitFor();
  assert(await dialog.evaluate(el=>el.matches(':modal')),'Expanded PDF must be in the top layer');
  const box=await dialog.boundingBox();assert(box.width>=viewport.width-2&&box.height>=viewport.height-2);
  const closeBox=await dialog.locator('[data-pdf-action="exit-fullscreen"]').boundingBox();
  console.log('PDF CLOSE',viewport.width,mode,JSON.stringify(closeBox));
  assert(closeBox.y>=0&&closeBox.y+closeBox.height<=viewport.height,'PDF close button is outside the viewport: '+JSON.stringify(closeBox));
  assert(await dialog.evaluate(el=>el.scrollHeight<=el.clientHeight+2),'PDF dialog must not hide controls below its viewport');
  await page.screenshot({path:`qa-artifacts/pdf-expanded-${mode}-${viewport.width}.png`});
  if(mode!=='pending')await dialog.locator('[data-pdf-action="exit-fullscreen"]').click();else await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  const after=await page.evaluate(()=>({y:scrollY,counter:document.querySelector('#to-pdf-showcase output').textContent,sameFrame:document.querySelector('#to-pdf-showcase iframe')===window.__originalPdfFrame}));
  assert(Math.abs(before.y-after.y)<5&&before.counter===after.counter&&after.sameFrame,JSON.stringify({before,after}));
 }
 assert.deepEqual(errors,[]);await page.close();
}
await browser.close();
