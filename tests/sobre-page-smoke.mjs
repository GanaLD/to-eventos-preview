import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const home=read('site/index.html');
const about=read('site/sobre/index.html');
const menu=read('site/staggered-menu.js');

test('menu da Home conduz à página Sobre e preserva Product desativado',()=>{
  assert.match(home,/data-to-menu-item="SOBRE"[^>]*href="\.\/sobre\/"/);
  assert.match(home,/data-to-menu-item="PRODUCT"[^>]*disabled/);
});
test('rota /sobre/ tem documento estático e CSS próprios',()=>{
  assert.ok(existsSync(path.join(root,'site/sobre/index.html')));
  assert.ok(existsSync(path.join(root,'site/sobre/sobre.css')));
  assert.match(about,/lang="pt-BR"/);
  assert.match(about,/rel="stylesheet" href="sobre\.css/);
});
test('links funcionam em GitHub Pages dentro de subpasta',()=>{
  assert.match(about,/href="\.\.\/#hero"/);
  assert.match(about,/href="\.\.\/#projetos"/);
  assert.match(about,/data-to-menu-item="SOBRE" href="\.\/"/);
  assert.match(about,/src="\.\.\/assets\/media\/summit-frame-apresentacao\.webp"/);
  assert.ok(existsSync(path.join(root,'site/assets/media/summit-frame-apresentacao.webp')));
});
test('estrutura editorial indexável preservada no HTML',()=>{
  assert.equal((about.match(/<h1\b/g)||[]).length,1);
  for(const value of ['Organização e','O que','Seu projeto','Tipos de','Do briefing','Experiência','Perguntas','seu próximo evento']){
    assert.ok(about.toLowerCase().includes(value.toLowerCase()),"missing content: "+value);
  }
  assert.equal((about.match(/<details>/g)||[]).length,5);
  assert.match(about,/type="application\/ld\+json"/);
  assert.match(about,/rel="canonical" href="https:\/\/toeventos\.com\/sobre\/"/);
});
test('prévia não disputa indexação com a publicação definitiva na Hostinger',()=>{
  assert.match(about,/meta name="robots" content="noindex,nofollow"/);
  assert.match(home,/meta name="robots" content="noindex,nofollow"/);
});
test('menu permanece acessível com vários links e sem GSAP',()=>{
  assert.match(menu,/menuLinks\.forEach/);
  assert.match(menu,/const focusables = \[\.\.\.menuLinks, toggle\]/);
  assert.match(menu,/setInstantly/);
  assert.match(about,/aria-expanded="false"/);
  assert.match(about,/aria-hidden="true" inert/);
});
test('metadados e identidade do projeto conferidos',()=>{
  assert.match(about,/<title>Organização e Produção de Eventos Corporativos em Curitiba/);
  assert.match(about,/meta name="description"/);
  assert.match(about,/#(?:[a-f\d]{6})/i); // works with page's theme-color
});

test('revisão visual: sem índices de seção e enumerações decorativas',()=>{
  assert.doesNotMatch(about,/class="sobre-side"|class="sobre-index"/);
  assert.doesNotMatch(about,/<ol\b|<li>\s*<span>0[1-9]<\/span>/);
  assert.doesNotMatch(about,/<article>\s*<span>0[1-9]<\/span>/);
  assert.match(about,/class="sobre-process">/);
  assert.equal((about.match(/<article>/g)||[]).length,(about.match(/<\/article>/g)||[]).length);
});
test('revisão visual: nenhuma seta nas chamadas e nos conteúdos',()=>{
  assert.doesNotMatch(about,/[↗↖↘↙→←➜➝➡➤⇢⇨]/u);
  assert.doesNotMatch(about,/class="sobre-inline-link"/);
});
test('revisão visual: títulos com espaço e layout adaptável',()=>{
  const css=read('site/sobre/sobre.css');
  assert.match(css,/\.sobre-hero h1\s*\{[^}]*line-height:\s*1\.19/s);
  assert.match(css,/text-wrap:\s*balance/);
  assert.match(css,/overflow-wrap:\s*break-word/);
  assert.match(css,/\.sobre-split\s*\{[^}]*display:block/s);
  assert.match(css,/@media\(max-width:1100px\)/);
  assert.match(css,/\.sobre-proof-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/s);
});
test('revisão visual: CTAs com iluminação, sombra e texto centralizado',()=>{
  const css=read('site/sobre/sobre.css');
  assert.match(css,/\.sobre-page \.button-accent\s*\{[^}]*justify-content:center/s);
  assert.match(css,/\.sobre-page \.button-accent\s*\{[^}]*text-align:center/s);
  assert.match(css,/\.sobre-page \.button-accent\s*\{[^}]*box-shadow:/s);
  assert.match(css,/\.sobre-page \.button-accent:hover/);
  assert.match(css,/\.sobre-page \.button-accent:focus-visible/);
  assert.match(about,/class="button-accent sobre-secondary-button"/);
});
test('FAQ sem seta nativa de expansão',()=>{
  const css=read('site/sobre/sobre.css');
  assert.match(css,/summary::-webkit-details-marker\s*\{display:none\}/);
  assert.match(css,/\.sobre-questions summary\s*\{[^}]*list-style:none/s);
});
