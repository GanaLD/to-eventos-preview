import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const URL=process.env.TO_PREVIEW_URL||'https://ganald.github.io/to-eventos-preview/?v=8';
const OUT='qa-artifacts/v8';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
const screens=[
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function fullyRevealed(clip){return clip==='none'||/inset\\?\(0(px)? 0(%|px)? 0(px)? 0(px)?\)/.test(clip)||!clip.includes('100%');}
const results=[];
try{
  for(const size of screens){
    const page=await browser.newPage({viewport:size,deviceScaleFactor:1,hasTouch:size.name==='mobile'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('#sobre .about-floral-video source').getAttribute('src'),'assets/media/papoulas-completas-v8.mp4');
    assert.equal(await page.locator('#solucoes .to-v8-type-competence').count(),3,'Três títulos de competências devem receber digitação');
    assert.equal(await page.locator('.case-text:not(.case-text-contrast) .to-v72-type-line').count(),2,'Título cinza recebe digitação em duas linhas');
    assert.equal(await page.locator('.case-text-contrast .to-v72-type-line').count(),0,'Não digitar no card grafite');
    await page.locator('#sobre').scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);
    const intermediate=await page.evaluate(()=>{
      const h=document.querySelector('#sobre-heading');
      const p=document.querySelector('#sobre .about-copy .microproof');
      return {headline:parseFloat(getComputedStyle(h).opacity),microproof:parseFloat(getComputedStyle(p).opacity)};
    });
    assert(intermediate.microproof<.97,'Entradas de Sobre devem ser lentas e sequenciadas, não instantâneas: '+JSON.stringify(intermediate));
    await page.screenshot({path:OUT+'/sobre-inicio-'+size.name+'.png'});
    await page.waitForTimeout(4800);
    const completed=await page.evaluate(()=>{
      const h=document.querySelector('#sobre-heading');
      const m=document.querySelector('#sobre .microproof');
      const v=document.querySelector('#sobre .about-floral-video');
      return {headline:parseFloat(getComputedStyle(h).opacity),
        microproof:parseFloat(getComputedStyle(m).opacity),
        video:parseFloat(getComputedStyle(v).opacity),
        width:v.videoWidth,height:v.videoHeight,duration:v.duration,
        fit:getComputedStyle(v).objectFit,
        rect:v.getBoundingClientRect().toJSON()};
    });
    assert(completed.headline>.98&&completed.microproof>.98&&completed.video>.98,'Todos os textos de Sobre devem terminar visíveis: '+JSON.stringify(completed));
    assert.equal(completed.fit,'contain');
    assert(Math.abs(completed.width/completed.height-9/16)<.005,'Vídeo floral mantém aspecto original sem deformação');
    assert(completed.duration>=7&&completed.duration<=8,'Novo crescimento lento de cerca de 7,5 segundos');
    await page.locator('#sobre .about-floral-video').evaluate(async v=>{
      if(v.readyState<2)await new Promise(resolve=>v.addEventListener('loadeddata',resolve,{once:true}));
      v.pause();v.currentTime=Math.min(7.1,v.duration-.1);
      await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));
    });
    const pixel=await page.locator('#sobre .about-floral-video').evaluate(v=>{
      const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
      const ctx=c.getContext('2d');ctx.drawImage(v,0,0);
      let coloredEdges=0;
      const data=ctx.getImageData(0,0,c.width,c.height).data;
      const testPixel=(x,y)=>{
        const i=(y*c.width+x)*4;
        const [r,g,b]=[data[i],data[i+1],data[i+2]];
        return r>150&&r-g>45&&r-b>75;
      };
      for(let y=0;y<c.height;y+=5){
        for(let x=0;x<26;x+=5)coloredEdges+=testPixel(x,y)?1:0;
        for(let x=c.width-26;x<c.width;x+=5)coloredEdges+=testPixel(x,y)?1:0;
      }
      return {coloredEdges,totalSample:Math.round(c.height/5)*12};
    });
    assert(pixel.coloredEdges===0,'Nenhuma pétala pode tocar as bordas do vídeo: '+JSON.stringify(pixel));
    await page.screenshot({path:OUT+'/sobre-completo-'+size.name+'.png'});
    await page.locator('#solucoes').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const competencePartial=await page.evaluate(()=>[...document.querySelectorAll('.to-v8-type-competence')].map(e=>getComputedStyle(e).clipPath));
    assert(competencePartial.some(c=>c.includes('100%')),'Títulos devem ser digitados em sequência, não aparecer de uma vez: '+JSON.stringify(competencePartial));
    await page.screenshot({path:OUT+'/competencias-digitando-'+size.name+'.png'});
    await page.waitForTimeout(5700);
    const competenceDone=await page.evaluate(()=>[...document.querySelectorAll('.to-v8-type-competence')].map(e=>getComputedStyle(e).clipPath));
    assert(competenceDone.every(fullyRevealed),'As três competências devem terminar totalmente legíveis: '+JSON.stringify(competenceDone));
    await page.screenshot({path:OUT+'/competencias-completas-'+size.name+'.png'});
    await page.locator('#sobre').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const comeback=await page.locator('#sobre-heading').evaluate(e=>parseFloat(getComputedStyle(e).opacity));
    assert(comeback>.98,'Retorno ao Sobre sem piscar: '+comeback);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert(overflow<=2,'Sem scroll horizontal indevido: '+overflow);
    assert.deepEqual(errors,[],'Sem erros JS de animação');
    results.push({size:size.name,flower:completed,pixel,competenceDone,overflow});
    await page.close();
  }
  for(const size of [{width:1920,height:1080},{width:1024,height:768},{width:768,height:1024},{width:360,height:800}]){
    const page=await browser.newPage({viewport:size});
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
    assert.equal(await page.locator('#sobre .about-floral-video').count(),1);
    assert.equal(await page.locator('#solucoes .to-v8-type-competence').count(),3);
    await page.close();
  }
  await fs.writeFile(OUT+'/result.json',JSON.stringify(results,null,2));
  console.log('V8 VISUAL QA PASS',JSON.stringify(results.map(r=>({size:r.size,pixel:r.pixel,overflow:r.overflow}))));
}finally{await browser.close();}
