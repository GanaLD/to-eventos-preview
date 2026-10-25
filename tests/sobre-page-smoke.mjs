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
