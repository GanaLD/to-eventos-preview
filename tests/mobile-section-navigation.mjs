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
  const cold = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await cold.route(/fonts\.googleapis\.com|use\.typekit\.net\/oet1pqt\.css/, async route => {
    await new Promise(resolve => setTimeout(resolve,1800));
    await route.continue();
  });
  await cold.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await cold.locator('.to-section-nav a[data-section="contato"]').tap();
  await cold.waitForFunction(()=>document.readyState==='complete' && document.fonts.status==='loaded');
  await cold.waitForTimeout(1800);
  const contactTop=await cold.locator('#contato').evaluate(e=>e.getBoundingClientRect().top);
  assert(contactTop>=-3 && contactTop<844*.35,'Âncora interrompida pelo carregamento tardio das fontes: '+contactTop);
  await cold.mouse.wheel(0,-400);
  await cold.waitForTimeout(400);
  const manual=await cold.evaluate(()=>scrollY);
  await cold.evaluate(()=>ScrollTrigger.refresh());
  await cold.waitForTimeout(1200);
  assert(Math.abs(await cold.evaluate(()=>scrollY)-manual)<5,'Correção da âncora não pode disputar um gesto manual');
  await cold.close();
  console.log('PASS toque durante fontes lentas e respeito ao scroll manual');
} finally { await browser.close(); }
