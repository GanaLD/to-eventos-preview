import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const home=read('site/index.html');
const about=read('site/sobre/index.html');
const override=read('site/ux-diretrizes.css');
const aboutCSS=read('site/sobre/sobre.css');
const source=home+'\n'+about;
test('nenhuma seta decorativa visível na Home/Sobre',()=>{
  assert.doesNotMatch(source,/[↗↘→←↑↓➜➤❯❮⇢⇒⇠➔]/);
});
test('seções e conteúdos editoriais não usam índices ornamentais',()=>{
  assert.doesNotMatch(about,/class="sobre-index">\s*\d/);
  assert.doesNotMatch(about,/<(?:article|li)>\s*<span>\d{2}<\/span>/);
});
test('Home mantém folha de respiro e iluminacao dos CTAs',()=>{
  assert.match(home,/href="ux-diretrizes\.css\?v=1"/);
  assert.match(override,/text-align:center/);
  assert.match(override,/box-shadow:/);
  assert.match(override,/padding:/);
  assert.match(override,/@media\(max-width:899px\)/);
});
test('Sobre mantém CSS responsivo e acabamento dos botoes sem alterar mídia',()=>{
  assert.match(about,/href="sobre\.css\?v=2"/);
  assert.match(aboutCSS,/\.sobre-page \.button-accent/);
  assert.match(aboutCSS,/box-shadow:/);
  assert.match(aboutCSS,/@media\(max-width:760px\)/);
  assert.match(about, /summit-frame-apresentacao\.webp/);
});
test('preview continua com noindex, links e página Sobre',()=>{
  assert.match(home,/meta name="robots" content="noindex,nofollow"/);
  assert.match(about,/meta name="robots" content="noindex,nofollow"/);
  assert.match(home,/href="\.\/sobre\/"/);
  assert.match(about,/href="\.\.\/#projetos"/);
});
