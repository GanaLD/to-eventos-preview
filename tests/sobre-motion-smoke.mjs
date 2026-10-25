import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../site/sobre/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/sobre/sobre.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../site/sobre/sobre-motion.js',import.meta.url),'utf8');

test('Hero e Sobre compartilham um único palco; não entram lateralmente no fluxo normal',()=>{
  const stage=html.indexOf('data-sobre-intro');
  const pin=html.indexOf('data-sobre-intro-pin');
  const hero=html.indexOf('class="sobre-hero"');
  const about=html.indexOf('data-sobre-slide-right');
  const services=html.indexOf('data-sobre-services');
  assert.ok(stage>0&&stage<pin&&pin<hero&&hero<about&&about<services);
  assert.match(css,/\.sobre-page\.sobre-intro-active \.sobre-hero,\s*\.sobre-page\.sobre-intro-active \.sobre-entrance\s*\{[^}]*position:absolute;[^}]*inset:0/s);
  assert.match(js,/trigger:\s*pin/);
  assert.match(js,/pin:\s*true/);
  assert.doesNotMatch(js,/trigger:\s*entrance/);
});
test('Sobre tem duas colunas com respiro e fallback estático acessível',()=>{
  assert.match(html,/class="sobre-about-grid"/);
  assert.match(html,/class="sobre-about-heading"/);
  assert.match(html,/class="sobre-about-body"/);
  assert.match(css,/\.sobre-page\.sobre-intro-active \.sobre-about-grid\s*\{[^}]*display:grid/s);
  assert.match(js,/layoutFits\(hero\) && layoutFits\(entrance\)/);
  assert.match(js,/clearProps:\s*'transform'/);
});
test('conceito e execução são revelados em duas entradas suaves com tempo limitado',()=>{
  assert.match(html,/data-sobre-rise-heading/);
  assert.match(html,/data-sobre-rise-details/);
  assert.match(js,/reveal\.to\(heading,[\s\S]*?\.to\(details,/);
  assert.match(js,/viewport\(\) \* 1\.3/);
  assert.doesNotMatch(js,/viewport\(\) \* 2\.65/);
});
test('painéis horizontais respeitam viewport e não criam rolagem vertical interna',()=>{
  assert.equal((html.match(/sobre-horizontal-panel"/g)||[]).length,4);
  assert.match(js,/panels\.every\(layoutFits\)/);
  assert.match(js,/track\.scrollWidth - horizontal\.clientWidth/);
  assert.match(css,/\.sobre-page\.sobre-horizontal-active \.sobre-horizontal-panel\s*\{[^}]*overflow:visible/s);
  assert.doesNotMatch(css,/\.sobre-page\.sobre-horizontal-active \.sobre-horizontal-panel\s*\{[^}]*overflow-y:auto/s);
});
test('scroll natural depois do horizontal e fallback móvel/redução de movimento',()=>{
  const end=html.indexOf('<!-- Aqui termina o pin horizontal');
  assert.ok(end>0&&end<html.indexOf('id="duvidas"'));
  assert.ok(end<html.indexOf('id="contato-sobre"')&&end<html.indexOf('class="sobre-footer"'));
  assert.match(js,/min-width: 1220px/);
  assert.match(js,/min-height: 850px/);
  assert.match(js,/prefers-reduced-motion: no-preference/);
  assert.doesNotMatch(js,/trigger:\s*(?:faq|footer|contact)/);
});
test('sem numerações decorativas ou setas e sem alterações da Home',()=>{
  assert.doesNotMatch(html,/[↗↖↘↙→←➜➝➡➤⇢⇨]/u);
  assert.doesNotMatch(html,/class="sobre-side"|class="sobre-index"|<article><span>0[1-9]/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/sobre\.css\?v=4/);
  assert.match(html,/sobre-motion\.js\?v=2/);
});
