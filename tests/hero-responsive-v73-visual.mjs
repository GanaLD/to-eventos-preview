import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.TO_SITE_URL || 'http://127.0.0.1:8765/';
const out='qa-hero-v73';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
const results=[];
try {
  for (const view of [
    {tag:'desktop-1920',width:1920,height:1080},
    {tag:'desktop-1440',width:1440,height:900},
    {tag:'tablet-landscape',width:1024,height:768},
    {tag:'tablet-portrait',width:768,height:1024},
    {tag:'mobile-390',width:390,height:844},
    {tag:'mobile-360',width:360,height:800},
    {tag:'mobile-landscape',width:844,height:390}
  ]) {
    const page=await browser.newPage({viewport:{width:view.width,height:view.height},hasTouch:view.width<900,deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>Boolean(window.ScrollTrigger?.getById(
      window.innerWidth<900?'to-hero-mobile-film-and-copy':'to-hero-film-and-copy'
    )),{timeout:25000});

    const initial=await page.evaluate(()=>{
      const film=document.querySelector('#hero .hero-film-screen');
      const video=film?.querySelector('video');
      return {
        canvas:film?.querySelectorAll('canvas').length,
        numberOfVideos:film?.querySelectorAll('video').length,
        fit:getComputedStyle(video).objectFit,
        position:getComputedStyle(video).objectPosition,
        filmBackground:getComputedStyle(film).backgroundColor,
        mask:getComputedStyle(video).maskImage
      };
    });
    assert.equal(initial.canvas,0,'Nenhum canvas espelhado pode existir');
    assert.equal(initial.numberOfVideos,1,'Uma única mídia no HERO');
    const expectedFit=view.width/view.height>1.5?'cover':'contain';
    assert.equal(initial.fit,expectedFit,'A escolha de crop em '+view.tag);
    assert.equal(initial.filmBackground,'rgb(255, 97, 8)','Laranja do ambiente deve ser coerente');
    await page.screenshot({path:`${out}/${view.tag}-inicio.png`});

    const id=view.width<900?'to-hero-mobile-film-and-copy':'to-hero-film-and-copy';
    const scroll=async p=>{
      const tr=await page.evaluate(({id,p})=>{
        const st=window.ScrollTrigger?.getById(id);
        if(!st)return null;
        window.scrollTo({top:st.start+(st.end-st.start)*p,behavior:'instant'});
        return {start:st.start,end:st.end};
      },{id,p});
      assert(tr,'Hero GSAP não encontrado');
      await page.waitForTimeout(1800);
    };
    await scroll(.56);
    const during=await page.locator('[data-role=hero-film]').evaluate(v=>({
      time:v.currentTime,duration:v.duration,ready:v.readyState,error:v.error?.message||null
    }));
    assert(during.ready>=2 && during.time>0 && during.duration>1,'MP4 não decodificou ou scrub não avançou em '+view.tag+JSON.stringify(during));
    await page.screenshot({path:`${out}/${view.tag}-video.png`});
    if (view.tag==='desktop-1440' || view.tag==='mobile-390') {
      // Prévia compacta para revisão humana da imagem real renderizada.
      await page.screenshot({path:`${out}/${view.tag}-review.jpg`,type:'jpeg',quality:22});
    }

    await scroll(.96);
    const ending=await page.evaluate(()=>{
      const film=document.querySelector('.hero-film-screen');
      const slot=document.querySelector('.hero-visual');
      const media=film.querySelector('video');
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      return {
        film:rect(film),slot:rect(slot),
        fit:getComputedStyle(media).objectFit,
        mask:getComputedStyle(media).maskImage,
        framed:document.querySelector('.hero-scroll-stage').classList.contains('is-hero-framed'),
        copyOpacity:Number(getComputedStyle(document.querySelector('#hero-heading')).opacity)
      };
    });
    assert(ending.framed,'Fase final do hero não ativada em '+view.tag);
    assert.equal(ending.fit,'contain','O vídeo final não pode cortar lettering');
    assert.equal(ending.mask,'none','O enquadramento final deve ser íntegro');
    for(const key of ['x','y','w','h']) assert(Math.abs(ending.film[key]-ending.slot[key])<10,'Vídeo não encaixou no slot final '+view.tag+' '+key+': '+JSON.stringify(ending));
    assert(ending.copyOpacity>.7,'Texto final não apareceu em '+view.tag);
    await page.screenshot({path:`${out}/${view.tag}-final.png`});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert(overflow<=2,'Overflow horizontal '+view.tag+' '+overflow);
    assert.deepEqual(errors,[],'Erros na página '+view.tag);
    results.push({tag:view.tag,initial,during,ending,overflow,errors});
    await page.close();
  }

  const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await fallback.goto(base,{waitUntil:'domcontentloaded'});
  await fallback.waitForTimeout(450);
  assert.equal(await fallback.locator('#hero .hero-visual video[controls]').count(),1,'Reduced motion deve preservar vídeo manual com controles');
  assert.equal(await fallback.locator('#hero .hero-film-screen').count(),0,'Reduced motion não deixa camada duplicada');
  await fallback.close();
  await fs.writeFile(out+'/resultados.json',JSON.stringify(results,null,2));
  console.log('TO HERO V7.3 QA PASS: '+results.map(x=>x.tag+':'+x.overflow+'px').join(', '));
} finally {await browser.close();}
