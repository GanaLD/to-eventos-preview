import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const root='qa-artifacts/v74';
await fs.mkdir(root,{recursive:true});
const url=process.env.TO_PREVIEW_URL||'https://ganald.github.io/to-eventos-preview/?v=74';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const metrics=page=>page.evaluate(()=>{
 const o=s=>{const e=document.querySelector(s);return e?+getComputedStyle(e).opacity:null};
 const c=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).clipPath:null};
 return {
   about:o('#sobre-heading'),
   proof:o('#sobre .microproof'),
   overline:c('#sobre .overline'),
   flower:o('.about-floral-video'),
   flowerDuration:document.querySelector('.about-floral-video')?.duration,
   headingLines:document.querySelectorAll('#solucoes-heading .to-v74-type-line').length,
   serviceLines:document.querySelectorAll('#solucoes .solution h3 .to-v74-type-line').length,
   projectsLines:document.querySelectorAll('#projetos-heading .to-v74-type-line').length,
   greyLines:document.querySelectorAll('.project-panel-cases .to-v72-type-line').length,
   contactLines:document.querySelectorAll('#contato-heading .to-v74-type-line').length,
   triggers:window.ScrollTrigger?.getAll().map(t=>t.vars.id).filter(Boolean),
   overflow:document.documentElement.scrollWidth-innerWidth
 };
});
async function panelProgress(page, progress){
 const exists=await page.evaluate(progress=>{
  const projects=document.querySelector('#projetos');
  const st=window.ScrollTrigger?.getAll().find(x=>x.trigger===projects&&x.animation);
  if(!st)return false;
  window.scrollTo({top:st.start+(st.end-st.start)*progress,behavior:'instant'});
  return true;
 },progress);
 await sleep(300);
 return exists;
}
try{
for (const v of [{w:1440,h:900,k:'desktop'},{w:390,h:844,k:'mobile'}]){
 const page=await browser.newPage({viewport:{width:v.w,height:v.h},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await sleep(1200);
 const initial=await metrics(page);
 assert.equal(initial.headingLines,2,'Título de Competências deve digitar nas duas linhas');
 assert.equal(initial.serviceLines,3,'As três frentes estratégicas recebem digitação');
 assert.equal(initial.projectsLines,2,'Título de Experiência em Ação recebe digitação');
 assert.equal(initial.greyLines,2,'Título do card cinza permanece digitado');
 assert.equal(initial.contactLines,2,'Headline de Contato recebe digitação');
 assert(!initial.triggers.includes('to-v71-solutions'),'Controlador antigo não pode reiniciar textos');
 assert(!initial.triggers.includes('to-v7-sobre-intro'),'Sobre só pode ter uma timeline');
 assert(!initial.triggers.includes('to-v71-cases'),'Card cinza não pode ter animação duplicada');

 await page.locator('#sobre').scrollIntoViewIfNeeded();
 await sleep(1100);
 const midway=await metrics(page);
 assert(midway.about!==null&&midway.about>0&&midway.about<.99,
   'Texto de Sobre deve estar VISIVEL em andamento e não aparecer instantaneamente: '+JSON.stringify(midway));
 await page.screenshot({path:root+'/sobre-em-entrada-'+v.k+'.png'});
 await sleep(4900);
 const done=await metrics(page);
 assert(done.about>.99&&done.proof>.99&&done.flower>.99,'Texto da seção Sobre deve terminar legível: '+JSON.stringify(done));
 assert(done.flowerDuration>8&&done.flowerDuration<9,'Nova pintura precisa permanecer suave por 8.4s');
 const frame=await page.locator('.about-floral-video').evaluate(x=>({
   fit:getComputedStyle(x).objectFit,background:getComputedStyle(x).backgroundColor,
   ratio:x.getBoundingClientRect().width/x.getBoundingClientRect().height
 }));
 assert(frame.fit==='contain'&&Math.abs(frame.ratio-9/16)<.015,'Video 9:16 sem distorção');
 await page.screenshot({path:root+'/sobre-floral-final-'+v.k+'.png'});

 await page.locator('#solucoes').scrollIntoViewIfNeeded();
 await sleep(750);
 await page.locator('#sobre').scrollIntoViewIfNeeded();
 await sleep(220);
 const back=await metrics(page);
 assert(back.about>.99&&back.proof>.99,'Texto de Sobre não pode PISCAR quando voltar ao scroll');
 await page.locator('#solucoes').scrollIntoViewIfNeeded();
 await sleep(4700);
 await page.screenshot({path:root+'/competencias-digitacao-'+v.k+'.png'});
 const skillClip=await page.locator('#solucoes-heading .to-v74-type-line').last().evaluate(e=>getComputedStyle(e).clipPath);
 assert(!skillClip.includes('100%'),'Digitação da seção Competências deve concluir: '+skillClip);

 if(v.k==='desktop'){
   assert(await panelProgress(page,.12),'Galeria horizontal deve funcionar no desktop');
   await sleep(3900);
   const offscreenCase=await page.locator('.project-panel-cases').evaluate(e=>({left:e.getBoundingClientRect().left,played:e.dataset.toV74Revealed}));
   if (offscreenCase.left>v.w) assert(!offscreenCase.played,'A digitação do card cinza não pode acontecer antes de chegar ao painel');
   await page.screenshot({path:root+'/experiencia-digitacao-'+v.k+'.png'});
   const proj=await page.locator('#projetos-heading .to-v74-type-line').last().evaluate(e=>getComputedStyle(e).clipPath);
   assert(!proj.includes('100%'),'Experiência em Ação deve revelar o título: '+proj);
   await panelProgress(page,.52);
   await sleep(4400);
   const caseClip=await page.locator('.project-panel-cases .to-v72-type-line').last().evaluate(e=>getComputedStyle(e).clipPath);
   assert(!caseClip.includes('100%'),'Card cinza deve concluir digitação: '+caseClip);
   await page.screenshot({path:root+'/convenções-digitacao-'+v.k+'.png'});
 }else{
   await page.locator('.project-panel-cases').scrollIntoViewIfNeeded();
   await sleep(4300);
   const cases=await page.locator('.project-panel-cases .to-v72-type-line').last().evaluate(e=>getComputedStyle(e).clipPath);
   assert(!cases.includes('100%'),'Mobile deve mostrar digitação do card cinza: '+cases);
   await page.screenshot({path:root+'/convenções-digitacao-'+v.k+'.png'});
 }
 await page.locator('#contato').scrollIntoViewIfNeeded();
 await sleep(4900);
 const contactClip=await page.locator('#contato-heading .to-v74-type-line').last().evaluate(e=>getComputedStyle(e).clipPath);
 assert(!contactClip.includes('100%'),'Rodapé deve revelar título sem apagar contatos');
 const opacity=await page.locator('#contato .button-accent').evaluate(e=>+getComputedStyle(e).opacity);
 assert(opacity>.99,'Botão contato visível');
 await page.screenshot({path:root+'/contato-'+v.k+'.png'});
 assert(errors.length===0,'Sem erros de Javascript: '+errors.join(';'));
 report.push({viewport:v.k,initial,midway,done,frame,contactClip,errors});
 await page.close();
}
for(const v of [{w:1920,h:1080},{w:1890,h:900},{w:1024,h:768},{w:768,h:1024},{w:360,h:800}]){
 const page=await browser.newPage({viewport:{width:v.w,height:v.h}});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 assert.equal(await page.locator('.about-floral-video source').first().getAttribute('src'),'assets/media/papoulas-seamless-v74.mp4');
 assert(await page.locator('.to-v74-type-line').count()>=8,'Digitação responsiva visível no DOM');
 await page.close();
}
await fs.writeFile(root+'/report.json',JSON.stringify(report,null,2));
console.log('V74 VISUAL QA PASS',JSON.stringify(report.map(x=>({viewport:x.viewport,aboutEntry:x.midway.about,aboutFinal:x.done.about,flowerDuration:x.done.flowerDuration}))));
}finally{await browser.close()}
