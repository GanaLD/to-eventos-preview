import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const h=readFileSync(new URL('../site/sobre/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/sobre/sobre.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../site/sobre/sobre-motion.js',import.meta.url),'utf8');

test('introdução lateral começa depois do Hero, não altera a Home',()=>{
  assert.match(h,/class="sobre-entrance"[^>]*data-sobre-slide-right|class="sobre-section sobre-light sobre-entrance" data-sobre-slide-right/);
  assert.ok(h.indexOf('class="sobre-hero"')<h.indexOf('data-sobre-slide-right'));
  assert.match(js,/xPercent:\s*100/);
  assert.match(js,/start:\s*'top bottom'/);
  assert.match(js,/end:\s*'top top'/);
});
test('serviços revelados em dois pulsos verticais com pin e scrub',()=>{
  assert.match(h,/data-sobre-rise-heading/);
  assert.match(h,/data-sobre-rise-details/);
  assert.match(js,/gsap\.set\(\[heading,\s*details\]/);
  assert.match(js,/rise\.to\(heading,[\s\S]*?\.to\(details,/);
  assert.match(js,/pin:\s*true/);
  assert.match(js,/scrub:\s*1\.25/);
});
test('quatro painéis laterais, sem índices ou setas, até o fim antes da FAQ',()=>{
  const start=h.indexOf('data-sobre-horizontal');
  const end=h.indexOf('<!-- Aqui termina o pin horizontal');
  assert.ok(start>0&&end>start);
  const content=h.slice(start,end);
  assert.equal((content.match(/sobre-horizontal-panel"/g)||[]).length,4);
  for(const heading of ['id="publicos"','id="formatos"','id="metodo"','id="experiencia"'])assert.ok(content.includes(heading));
  assert.ok(h.indexOf('id="duvidas"')>end);
  assert.ok(h.indexOf('id="contato-sobre"')>end);
  assert.ok(h.indexOf('class="sobre-footer"')>end);
  assert.doesNotMatch(h,/[↗↖↘↙→←➜➝➡➤⇢⇨]/u);
  assert.doesNotMatch(h,/class="sobre-index"|class="sobre-side"/);
});
test('distância horizontal medida dinamicamente e pin termina antes do rodapé',()=>{
  assert.match(js,/track\.scrollWidth\s*-\s*horizontal\.clientWidth/);
  assert.match(js,/trigger:\s*horizontal/);
  assert.match(js,/pin:\s*true/);
  assert.doesNotMatch(js,/trigger:\s*['"]?\.?sobre-(?:faq|contact|footer)/);
  assert.match(css,/\.sobre-motion-ready \.sobre-horizontal-track\s*\{[\s\S]*?display:flex/);
});
test('fallback estático para mobile, telas baixas e movimento reduzido',()=>{
  assert.match(js,/min-width: 1180px/);
  assert.match(js,/min-height: 780px/);
  assert.match(js,/prefers-reduced-motion: no-preference/);
  assert.match(css,/@media \(min-width:1180px\) and \(min-height:780px\)/);
  assert.match(h,/ScrollTrigger\.min\.js/);
  assert.match(h,/sobre-motion\.js\?v=1/);
});
test('sem colisões: cada cena usa tamanhos limitados, conteúdo adaptável',()=>{
  assert.match(css,/\.sobre-motion-ready \.sobre-service-list\s*\{\s*display:grid/);
  assert.match(css,/\.sobre-motion-ready \.sobre-horizontal-panel\s*\{[\s\S]*?overflow-y:auto/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
