import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try {
  for (const width of [360,390]) {
    const page = await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
    await page.goto(base,{waitUntil:'load',timeout:60000});
    await page.evaluate(()=>document.fonts.ready);
    let previous = 0;
    for (const id of ['sobre','solucoes','projetos','contato','hero']) {
      await page.locator(`.to-section-nav a[data-section="${id}"]`).tap();
      await page.waitForFunction(id=>{
        const e=document.getElementById(id),r=e.getBoundingClientRect();
        if(id==='hero') return scrollY<3;
        if(id==='contato') return r.top>=-3 && r.top<innerHeight*.35;
        return Math.abs(r.top)<4;
      },id,{timeout:8000});
      await page.waitForTimeout(200);
      const state=await page.evaluate(()=>({y:scrollY,hash:location.hash,labels:[...document.querySelectorAll('.to-section-nav a>span')].filter(e=>Number(getComputedStyle(e).opacity)>.1).length}));
      assert.equal(state.hash,'#'+id);
      assert(Math.abs(state.y-previous)>100,`Toque não moveu a página: ${JSON.stringify({id,state,previous})}`);
      assert.equal(state.labels,0,'Toque não pode abrir os rótulos de desktop');
      previous=state.y;
    }
    // Um segundo salto e o link do rodapé devem usar o mesmo caminho reversível.
    await page.locator('.to-section-nav a[data-section="contato"]').tap();
    await page.waitForFunction(()=>document.getElementById('contato').getBoundingClientRect().top<innerHeight*.35);
    await page.locator('.footer a[href="#hero"]').tap();
    await page.waitForFunction(()=>scrollY<3,null,{timeout:8000});
    assert(await page.evaluate(()=>document.querySelector('[data-role="hero-film"]').currentSrc.includes('motion-hero-vertical-v11.mp4')));
    console.log('PASS âncoras por toque, rótulos e retorno ao início',width);
    await page.close();
  }
} finally { await browser.close(); }
