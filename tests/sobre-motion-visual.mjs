import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const out='qa-sobre-cinematico';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report=[];
const around=async(page,y)=>{
  await page.evaluate(y=>{window.scrollTo({top:y,behavior:'instant'});window.ScrollTrigger?.update();},y);
  await page.waitForTimeout(850);
};
const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,top:r.top,bottom:r.bottom}};
try{
  for(const [width,height] of [[1440,900],[1280,900],[1024,768],[390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/sobre/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1300);
    await page.evaluate(()=>document.fonts?.ready);
    await page.waitForTimeout(500);
    await page.screenshot({path:out+'/'+width+'-inicio.png'});
    const initial=await page.evaluate(()=>{
      const root=document.querySelector('.sobre-page');
      const hero=document.querySelector('.sobre-hero'),about=document.querySelector('[data-sobre-slide-right]');
      const stage=document.querySelector('[data-sobre-intro]');
      const hr=hero.getBoundingClientRect(),ar=about.getBoundingClientRect(),sr=stage.getBoundingClientRect();
      return {intro:root.classList.contains('sobre-intro-active'),
       service:root.classList.contains('sobre-service-active'),
       horizontal:root.classList.contains('sobre-horizontal-active'),
       hero:{x:hr.x,y:hr.y,w:hr.width,h:hr.height,scroll:hero.scrollHeight},
       about:{x:ar.x,y:ar.y,w:ar.width,h:ar.height,scroll:about.scrollHeight},
       stage:{x:sr.x,y:sr.y,w:sr.width,h:sr.height}};
    });
    // Quando ativo, o About precisa preencher o MESMO palco do Hero.
    if(initial.intro){
      assert(Math.abs(initial.hero.y-initial.about.y)<3,'Hero/Sobre divergem no eixo Y: '+JSON.stringify(initial));
      assert(Math.abs(initial.hero.w-initial.about.w)<3,'Hero/Sobre divergem na largura: '+JSON.stringify(initial));
      assert(initial.about.x>=initial.hero.x+width*.8,'Sobre não começa fora do Hero à direita: '+JSON.stringify(initial));
      assert(initial.about.scroll<=initial.about.h+5,'Conteúdo Sobre cortado: '+JSON.stringify(initial));
      const trigger=await page.evaluate(()=>{
        const stage=document.querySelector('[data-sobre-intro]');
        const t=ScrollTrigger.getAll().find(t=>t.trigger===stage);
        return t?{start:t.start,end:t.end}:null;
      });
      assert(trigger,'ScrollTrigger do palco Hero/Sobre ausente');
      await around(page,trigger.start+(trigger.end-trigger.start)*.92);
      const mid=await page.evaluate(()=>{
        const a=document.querySelector('[data-sobre-slide-right]').getBoundingClientRect();
        const b=document.querySelector('.sobre-hero').getBoundingClientRect();
        return {aboutX:a.x,aboutY:a.y,heroX:b.x,heroY:b.y};
      });
      assert(Math.abs(mid.aboutY-mid.heroY)<4,'Sobre não se sobrepõe ao Hero ao rolar: '+JSON.stringify(mid));
      assert(Math.abs(mid.aboutX-mid.heroX)<22,'Sobre não chega à posição certa: '+JSON.stringify(mid));
      await page.screenshot({path:out+'/'+width+'-sobre.png'});
    }else{
      assert(width<1220 || height<850 || initial.hero.scroll>initial.hero.h+2 || initial.about.scroll>initial.about.h+2,
        'Overlay desativado sem motivo de responsividade: '+JSON.stringify(initial));
    }

    const noClip=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('.sobre-cards article,.sobre-proof-grid article,.sobre-service-list article,.sobre-process article,.sobre-types-grid article')];
      const issues=[];
      for(const el of nodes){
        const title=el.querySelector('h3'),p=el.querySelector('p');
        if(!title||!p)continue;
        const t=title.getBoundingClientRect(),b=p.getBoundingClientRect();
        if(b.top<t.bottom+7)issues.push({title:title.textContent?.trim(),delta:Math.round(b.top-t.bottom)});
      }
      return issues;
    });
    assert.deepEqual(noClip,[],'Colisão título/parágrafo: '+JSON.stringify(noClip));
    const bounds=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,viewport:window.innerWidth,
      faq:document.querySelector('#duvidas').getBoundingClientRect().height,
      footer:document.querySelector('.sobre-footer').getBoundingClientRect().height
    }));
    assert(bounds.width<=width+4,'Overflow horizontal na página: '+JSON.stringify(bounds));
    assert(bounds.faq>0&&bounds.footer>0,'FAQ ou rodapé invisível');
    assert.deepEqual(errors,[],'Erro de JavaScript');
    report.push({width,height,initial,bounds});
    await page.screenshot({path:out+'/'+width+'-fim.png',fullPage:width<1220});
    await page.close();
  }
  await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
  console.log('QA SOBRE GSAP: PASS '+report.map(x=>x.width+'x'+x.height).join(', '));
}finally{await browser.close();}
