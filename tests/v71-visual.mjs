import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const url=process.env.TO_PREVIEW_URL||'https://ganald.github.io/to-eventos-preview/?v=71';
const directory='qa-artifacts/v71';
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
const results=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const scan=async page=>page.evaluate(()=>{
  const opacity=selector=>{
    const node=document.querySelector(selector);
    return node ? +getComputedStyle(node).opacity : null;
  };
  return {
    width:innerWidth,scroll:scrollY,
    triggers:window.ScrollTrigger?.getAll().map(t=>({id:t.vars.id,progress:+t.progress.toFixed(2)})),
    caption:document.querySelector('#sobre figcaption')!==null,
    about:{headline:opacity('#sobre-heading'),overline:opacity('#sobre .about-copy .overline'),
      proof:opacity('#sobre .microproof'),video:opacity('#sobre .about-floral-video')},
    project:{heading:opacity('#projetos-heading'),caption:opacity('.project-panel-summit .case-caption h3')},
    cases:{
      chars:document.querySelectorAll('.to-v71-type-char').length,
      first:opacity('.to-v71-type-char:first-child'),
      text:document.querySelector('.project-panel-cases .case-text:not(.case-text-contrast) h3')?.getAttribute('aria-label')
    },
    contact:{heading:opacity('#contato-heading'),cta:opacity('#contato .button-accent'),aside:opacity('#contato .contact-aside a'),foot:opacity('#contato .footer a')},
    horizontal:document.documentElement.scrollWidth-innerWidth
  };
});

async function jumpGallery(page,progress){
  const result=await page.evaluate(progress=>{
    const t=window.ScrollTrigger?.getAll().find(t=>t.trigger?.id==='projetos' && t.animation);
    if(!t)return null;
    window.scrollTo({top:t.start+(t.end-t.start)*progress,behavior:'instant'});
    return {start:t.start,end:t.end,progress};
  },progress);
  await page.waitForTimeout(2300);
  return result;
}

try {
  for(const v of [{w:1440,h:900,key:'desktop'},{w:390,h:844,key:'mobile'}]){
    const page=await browser.newPage({viewport:{width:v.w,height:v.h},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForTimeout(1700);
    assert.equal(await page.locator('#sobre figcaption').count(),0,'Legenda das papoulas precisa ser removida');
    assert.equal(await page.locator('.project-panel-cases > .project-panel-inner > .section-kicker').count(),0,'Identificação externa duplicada');
    assert.equal(await page.locator('.project-asset-note').count(),0,'Nota de produção interna removida');
    const type=page.locator('.case-text:not(.case-text-contrast) h3');
    assert((await type.getAttribute('aria-label'))?.includes('Convenções corporativas'),'Título acessível intacto');
    assert(await page.locator('.to-v71-type-char').count()>20,'Digitação visual tem caracteres individuais');
    const flowerStyle=await page.locator('.about-floral-video').evaluate(video=>{
      const rect=video.getBoundingClientRect();
      const figure=video.closest('figure').getBoundingClientRect();
      return {fit:getComputedStyle(video).objectFit,ratio:rect.width/rect.height,
        leftPadding:rect.left-figure.left,rightPadding:figure.right-rect.right,
        width:rect.width,height:rect.height};
    });
    assert.equal(flowerStyle.fit,'contain','Vídeo de papoulas deve ser exibido inteiro');
    assert(Math.abs(flowerStyle.ratio-.5625)<.025,'Vídeo floral não deve ser deformado: '+JSON.stringify(flowerStyle));
    assert(flowerStyle.leftPadding>8&&flowerStyle.rightPadding>8,'Pétalas precisam de margem interna: '+JSON.stringify(flowerStyle));

    await page.locator('#sobre').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2600);
    const about=await scan(page);
    assert(about.about.headline>.95&&about.about.proof>.95&&about.about.video>.95,
      'Textos de Sobre e vídeo precisam estar visíveis depois da revelação: '+JSON.stringify(about.about));
    await page.screenshot({path:directory+'/sobre-'+v.key+'.png'});

    await page.locator('#solucoes').scrollIntoViewIfNeeded();
    await page.waitForTimeout(3200);
    const skills=await page.evaluate(()=>[...document.querySelectorAll('#solucoes .solution h3')].map(e=>+getComputedStyle(e).opacity));
    assert(skills.every(x=>x>.95),'Revelações de competências precisam terminar visíveis: '+JSON.stringify(skills));
    await page.screenshot({path:directory+'/competencias-'+v.key+'.png'});

    if(v.key==='desktop'){
      const gallery=await jumpGallery(page,.11);
      assert(gallery,'Desktop deve preservar galeria horizontal controlada por GSAP');
      await page.waitForTimeout(2100);
      const summit=await scan(page);
      assert(summit.triggers.some(t=>t.id==='to-v71-projects'),'Experiência em Ação precisa usar trigger da galeria');
      assert(summit.project.heading>.95&&summit.project.caption>.95,
        'Textos do Connect e Summit devem estar visíveis quando painel entra: '+JSON.stringify(summit));
      await page.screenshot({path:directory+'/connect-'+v.key+'.png'});

      await jumpGallery(page,.51);
      await page.waitForTimeout(3800);
      const cards=await scan(page);
      assert(cards.cases.chars>20&&cards.cases.text==='Convenções corporativas',
        'Cabeçalho em letras com rótulo acessível íntegro');
      const lastChar=await page.locator('.to-v71-type-char').last().evaluate(e=>+getComputedStyle(e).opacity);
      assert(lastChar>.95,'Digitação deve concluir no painel cinza: '+JSON.stringify(cards));
      await page.screenshot({path:directory+'/operacoes-digitacao-'+v.key+'.png'});
    }else{
      await page.locator('.project-panel-summit').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2200);
      const summit=await scan(page);
      assert(summit.project.heading>.95&&summit.project.caption>.95,'Textos Connect no mobile');
      await page.screenshot({path:directory+'/connect-'+v.key+'.png'});
      await page.locator('.project-panel-cases').scrollIntoViewIfNeeded();
      await page.waitForTimeout(3500);
      const lastChar=await page.locator('.to-v71-type-char').last().evaluate(e=>+getComputedStyle(e).opacity);
      assert(lastChar>.95,'Digitação no mobile deve concluir');
      await page.screenshot({path:directory+'/operacoes-digitacao-'+v.key+'.png'});
    }

    await page.locator('#contato').scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    const contact=await scan(page);
    assert(contact.contact.heading>.95&&contact.contact.cta>.95&&contact.contact.aside>.95&&contact.contact.foot>.95,
      'Rodapé e contatos precisam surgir: '+JSON.stringify(contact.contact));
    assert(errors.length===0,'Erros JS: '+JSON.stringify(errors));
    assert(Math.abs(await page.evaluate(()=>scrollX))<2,'Sem scroll horizontal na página');
    await page.screenshot({path:directory+'/contato-'+v.key+'.png'});
    results.push({viewport:v.key,flowerStyle,about:about.about,skills,contact:contact.contact,errorCount:errors.length});
    await page.close();
  }

  for(const v of [{w:1920,h:1080},{w:1890,h:900},{w:1024,h:768},{w:768,h:1024},{w:360,h:800}]){
    const page=await browser.newPage({viewport:{width:v.w,height:v.h}});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    const film=await page.locator('#hero video').first().evaluate(e=>({fit:getComputedStyle(e).objectFit}));
    assert.equal(film.fit,'contain','HERO preserva enquadramento em '+v.w);
    assert.equal(await page.locator('#sobre figcaption').count(),0);
    await page.close();
  }
  await fs.writeFile(directory+'/qa-v71.json',JSON.stringify(results,null,2));
  console.log('TO Eventos V7.1 QA visual PASSOU',JSON.stringify(results));
}finally{await browser.close();}
