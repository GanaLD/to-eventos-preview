import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const server = process.env.TO_SITE_URL || 'http://127.0.0.1:8765/';
const output='qa-hero-mobile-v10';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
const drag=async(page,x,y1,y2)=>{
 const session=await page.context().newCDPSession(page);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
 for(let n=1;n<=16;n++){
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*n/16}]});
   await page.waitForTimeout(18);
 }
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await session.detach();
 await page.waitForTimeout(900);
};
try {
 for(const {width,height,tag} of [{width:390,height:844,tag:'iphone390'},{width:360,height:800,tag:'android360'},{width:768,height:1024,tag:'tablet768'}]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy'),{timeout:22000});
  await page.waitForFunction(()=>{const v=document.querySelector('[data-role="hero-film"]');return v?.readyState>=2 && v.videoWidth>0;},{timeout:26000});
  const initial=await page.evaluate(()=>{
   const stage=document.getElementById('hero').getBoundingClientRect();
   const film=document.querySelector('.hero-film-screen').getBoundingClientRect();
   const v=document.querySelector('[data-role="hero-film"]');
   const style=getComputedStyle(v);
   return {source:v.currentSrc,mediaW:v.videoWidth,mediaH:v.videoHeight,fit:style.objectFit,mask:style.maskImage,
   film:{w:film.width,h:film.height},stage:{w:stage.width,h:stage.height},
   videoTime:v.currentTime,paused:v.paused};
  });
  assert(initial.source.includes('motion-hero-mobile.mp4'),'HERO mobile carrega MP4 16:9, não 9:16: '+JSON.stringify(initial));
  assert(Math.abs(initial.mediaW/initial.mediaH-9/16)<.02,'Mídia real não é retrato 9:16');
  assert.equal(initial.fit,'contain','O lettering original não pode ser cortado nas laterais');
  // Exigir correspondência cromática real entre MP4 decodificado e CSS:
  // sem uma faixa visível onde o vídeo 9:16 termina.
  const colors=await page.evaluate(()=>{
    const v=document.querySelector('[data-role="hero-film"]');
    const canvas=document.createElement('canvas');
    canvas.width=v.videoWidth; canvas.height=v.videoHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(v,0,0);
    const pixel=[...ctx.getImageData(400,700,1,1).data].slice(0,3);
    const backdrop=getComputedStyle(document.querySelector('.hero-film-screen')).backgroundColor;
    return {pixel,backdrop};
  });
  const rgb=(colors.backdrop.match(/[0-9]+/g)||[]).slice(0,3).map(Number);
  assert.equal(rgb.length,3,'Background do HERO deve ser RGB sólido');
  assert(Math.max(...rgb.map((n,i)=>Math.abs(n-colors.pixel[i])))<=8,
    'Laranja do vídeo diverge da borda CSS: '+JSON.stringify(colors));

  assert.equal(initial.mask,'none','Não usar fade para disfarçar barras vazias');
  assert(Math.abs(initial.film.w-width)<3&&Math.abs(initial.film.h-height)<4,'Vídeo HeroScroll não ocupa viewport real');
  await page.screenshot({path:`${output}/${tag}-inicio.jpg`,type:'jpeg',quality:38});

  const snapshot=async()=>page.evaluate(()=>{
   const t=window.ScrollTrigger.getById('to-hero-mobile-film-and-copy');
   const v=document.querySelector('[data-role="hero-film"]');
   return {progress:t.progress,frame:v.currentTime,duration:v.duration,paused:v.paused,y:scrollY};
  });
  const zero=await snapshot();
  await drag(page,width*.5,height*.78,height*.16);
  const one=await snapshot();
  assert(one.progress>zero.progress+.025,'Gesto touch não alterou timeline HeroScroll: '+JSON.stringify({zero,one}));
  assert(one.frame>zero.frame+.05,'O vídeo NÃO avança frames com o dedo: '+JSON.stringify({zero,one}));
  assert(one.paused,'Vídeo deve permanecer pausado, apenas frames devem seguir o dedo');
  await page.screenshot({path:`${output}/${tag}-meio.jpg`,type:'jpeg',quality:38});
  await drag(page,width*.5,height*.17,height*.78);
  const back=await snapshot();
  assert(back.progress<one.progress-.02,'Gesto inverso não retrocede ScrollTrigger: '+JSON.stringify({one,back}));
  assert(back.frame<one.frame-.05,'Gesto inverso não retrocede quadros do vídeo: '+JSON.stringify({one,back}));

  // Cena de transição editorial só começa DEPOIS de tocar toda a abertura.
  // Validar o fechamento em uma navegação sem inércia residual:
  // a ida/volta por gesto real já foi comprovada acima.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy')));
  await page.evaluate(()=>{
    const t=window.ScrollTrigger.getById('to-hero-mobile-film-and-copy');
    window.scrollTo({top:t.start+(t.end-t.start)*.95,behavior:'instant'});
    window.ScrollTrigger.update();
  });
  await page.waitForTimeout(1500);
  const reached=await page.evaluate(()=>window.ScrollTrigger.getById('to-hero-mobile-film-and-copy').progress);
  assert(Math.abs(reached-.95)<.035,'O scroll da abertura não alcançou o fechamento '+reached);
  const finale=await page.evaluate(()=>{
    const get=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};
    return {film:get(document.querySelector('.hero-film-screen')),
      slot:get(document.querySelector('.hero-visual')),
      textOpacity:Number(getComputedStyle(document.getElementById('hero-heading')).opacity)};
  });
  assert(finale.textOpacity>.75,'A copy final não surge depois do filme');
  assert(Math.abs(finale.slot.w/finale.slot.h-9/16)<.035,'O quadro final mobile deve preservar 9:16 sem letterbox');
  for(const k of ['x','y','w','h']) assert(Math.abs(finale.film[k]-finale.slot[k])<12,'Vídeo não recolhe no slot final: '+k+JSON.stringify(finale));
  await page.screenshot({path:`${output}/${tag}-final.jpg`,type:'jpeg',quality:38});
  assert.deepEqual(errors,[],'Erros JS no mobile');
  results.push({tag,initial,zero,one,back,finale});
  await page.close();
 }
 await fs.writeFile(output+'/resultados.json',JSON.stringify(results,null,2));
 console.log('PASS HERO MOBILE 9:16 FULL-SCREEN + TOUCH SCRUB FORWARD/REVERSE + FINAL FRAME',results.map(x=>x.tag).join(', '));
}finally{await browser.close()}
