import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html=read('site/index.html'), css=read('site/accordion-gallery.css'), js=read('site/accordion-gallery.js');
const gallery=html.slice(html.indexOf('<section id="galeria-editorial"'),html.indexOf('<section id="contato"'));
test('Gallery appears after the GSAP PDF and before contact',()=>{
  assert(html.indexOf('id="to-pdf-showcase"')<html.indexOf('id="galeria-editorial"'));
  assert(html.indexOf('id="galeria-editorial"')<html.indexOf('id="contato"'));
  assert(html.includes('data-pdf-action="next"')&&html.includes('data-pdf-action="fullscreen"'));
});
test('Five distinct event photos, valid backups and fifth counter',()=>{
  const matches=[...gallery.matchAll(/<img[^>]+src="([^"]+)"[^>]*data-ag-fallback="([^"]+)"/g)];
  assert.equal(matches.length,5);
  assert.equal(new Set(matches.map(m=>m[1])).size,5);
  matches.forEach(m=>{
    assert.match(m[1],/^https:\/\/images\.unsplash\.com\/photo-/);
    assert(m[2].startsWith('assets/media/'));
    assert(existsSync(new URL('../site/'+m[2],import.meta.url)),m[2]);
  });
  assert.equal((gallery.match(/data-ag-panel\b/g)||[]).length,5);
  assert.equal((gallery.match(/aria-pressed=/g)||[]).length,5);
  assert(gallery.includes('data-default-index="2"')&&gallery.includes('data-expand-ratio="0.52"'));
  assert(gallery.includes('01 — 05')&&gallery.includes('IMAGENS ILUSTRATIVAS'));
});
test('GSAP expands active to 52%, offers accessible touch and reduced-motion fallback',()=>{
  assert(css.includes('--ag-radius:16px')&&css.includes('height:460px')&&css.includes('--ag-gap:10px'));
  assert(js.includes('ratio * (count - 1) / (1 - ratio)'));
  for(const s of ["mouseenter","click","focus","ArrowRight","ArrowLeft","Home","End","aria-pressed","prefers-reduced-motion: reduce","ResizeObserver","data-ag-fallback","power3.out"]){
    assert(js.includes(s),'Missing '+s);
  }
  assert(css.includes('@media(max-width:620px)')&&css.includes('flex-direction:column'));
  assert(css.includes(':focus-visible'));
  assert(!js.includes('ScrollTrigger.create(')&&!js.includes('ScrollTrigger.refresh('));
});
test('Does not remove other site assets or navigation',()=>{
  for(const asset of ['staggered-menu.js','moldura-overlay.css','main.js','motion-v71.js','hero-v5.js','assets/docs/portfolio-thais-ortiz.pdf']){
    assert(html.includes(asset),asset);
  }
  assert.equal((html.match(/src="accordion-gallery\.js"/g)||[]).length,1);
  assert.equal((html.match(/href="accordion-gallery\.css"/g)||[]).length,1);
});
