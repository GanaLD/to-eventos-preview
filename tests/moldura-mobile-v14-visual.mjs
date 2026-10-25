import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
for(const {width,height,mobile,portrait} of [
 {width:390,height:844,mobile:true,portrait:true},
 {width:360,height:800,mobile:true,portrait:true},
 {width:768,height:1024,mobile:true,portrait:true},
 {width:1440,height:900,mobile:false,portrait:false}
]){
 const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.to-floral-v10-video-decoder')?.readyState>=2,{timeout:30000});
 const initial=await page.evaluate(()=>{
  const v=document.querySelector('.to-floral-v10-video-decoder');
  const c=document.getElementById('to-floral-intro-v10');
  return {src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,duration:v.duration,
          blend:getComputedStyle(c).mixBlendMode,overlayWidth:c.width,
          heroSrc:document.querySelector('[data-role="hero-film"]')?.querySelector('source:last-child')?.getAttribute('src')};
 });
 assert.equal(initial.blend,'screen');
 assert(initial.overlayWidth>0);
 assert(initial.heroSrc==='assets/media/motion-hero.mp4','Desktop Hero source altered');
 if(portrait){
  assert(initial.src.includes('floral-mobile-v14.mp4'),'Portrait media not loaded '+JSON.stringify(initial));
  assert(Math.abs(initial.width/initial.height-9/16)<.04,'Portrait source stretched');
  assert(initial.duration>=5.7 && initial.duration<6,'Untrimmed video will finish on black');
  await page.waitForFunction(()=>!!window.ScrollTrigger?.getById('to-hero-mobile-film-and-copy'),{timeout:30000});
  // A progress=0.21, floral layer half faded, controlled by the existing Hero trigger.
  await page.evaluate(()=>{
    const st=ScrollTrigger.getById('to-hero-mobile-film-and-copy');
    window.scrollTo(0,st.start+(st.end-st.start)*.21);ScrollTrigger.update();
  });
  await page.waitForTimeout(1300);
  const mid=await page.evaluate(()=>({opacity:parseFloat(getComputedStyle(document.getElementById('to-floral-intro-v10')).opacity),scroll:ScrollTrigger.getById('to-hero-mobile-film-and-copy').progress}));
  assert(mid.scroll>.16 && mid.scroll<.26,'Mobile HeroScroll progress unexpected '+JSON.stringify(mid));
  assert(mid.opacity>.35 && mid.opacity<.65,'Floral layer not reversing fast '+JSON.stringify(mid));
 } else {
  assert(initial.src.includes('moldura-v13-screen.mp4'),'Desktop floral V13 changed '+JSON.stringify(initial));
  assert(initial.width>initial.height,'Desktop floral must remain landscape');
 }
 assert.deepEqual(errors,[],'Page error');
 console.log('PASS '+width+'x'+height+' source='+initial.src.split('/').pop());
 await page.close();
}
}finally{await browser.close();}
