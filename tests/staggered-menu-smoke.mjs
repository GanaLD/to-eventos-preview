import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(base, file), 'utf8');
const markup = () => read('site/index.html');

test('menu possui apenas HOME e PRODUCT, nesta ordem', () => {
  const labels = [...markup().matchAll(/<(?:a|button)\b[^>]*data-to-menu-item="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(labels, ['HOME', 'PRODUCT']);
});
test('HOME aponta para a própria página, inclusive no GitHub Pages em subpasta', () => {
  assert.match(markup(), /data-to-menu-item="HOME"[^>]*href="\.\/#hero"/);
});
test('PRODUCT não possui ação e está nativamente desabilitado', () => {
  const html = markup();
  assert.match(html, /<button[^>]*data-to-menu-item="PRODUCT"[^>]*disabled/);
  assert.doesNotMatch(html, /data-to-menu-item="PRODUCT"[^>]*(?:href=|onclick=)/);
});
test('acionador acessível e painel inicialmente fechado', () => {
  const html = markup();
  assert.match(html, /aria-controls="to-staggered-panel"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="to-staggered-panel"[^>]*aria-hidden="true"[^>]*inert/);
});
test('cores da marca e efeito vidro responsivo', () => {
  const css = read('site/staggered-menu.css');
  assert.match(css, /#FF4D00/i);
  assert.match(css, /#1A1A1A/i);
  assert.match(css, /#F4F4F2/i);
  assert.match(css, /backdrop-filter:\s*blur\(/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
});
test('GSAP, fallback e fechamento por Escape e clique fora', () => {
  const js = read('site/staggered-menu.js');
  assert.match(js, /window\.gsap/);
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /Escape/);
  assert.match(js, /addEventListener\('click'/);
  assert.match(js, /\.inert\s*=/);
});

test('regressão: CSS não acumula translateX com xPercent controlado pelo GSAP', () => {
  const css = read('site/staggered-menu.css');
  const js = read('site/staggered-menu.js');
  assert.match(css, /\.to-sm\.has-gsap \.to-sm-panel\s*\{\s*transform:\s*none/);
  assert.match(css, /\.to-sm\.has-gsap \.to-sm-layer/);
  assert.match(js, /root\.classList\.add\('has-gsap'\)/);
  assert.match(js, /gsap\.set\(\[panel,\s*\.\.\.layers\],\s*\{\s*xPercent:\s*105/);
  assert.match(js, /timeline\.to\(panel,\s*\{\s*xPercent:\s*0/);
});
test('menu usa cache bust após correção de animação', () => {
  const html = markup();
  assert.match(html, /staggered-menu\.css\?v=20261025b/);
  assert.match(html, /staggered-menu\.js\?v=20261025b/);
});

test('opções HOME e PRODUCT sem numeração visual ou semântica', () => {
  const html = markup();
  assert.match(html, /<ul class="to-sm-list">/);
  assert.doesNotMatch(html, /<ol class="to-sm-list">/);
  assert.doesNotMatch(html, /class="to-sm-number"/);
});
test('tipografia segura contra corte nas laterais e descendentes', () => {
  const css = read('site/staggered-menu.css');
  assert.match(css, /\.to-sm-list li\s*\{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.to-sm-item-label\s*\{[^}]*line-height:\s*1\.(?:1[5-9]|[2-9]\d?)/s);
  assert.match(css, /\.to-sm-item-label\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(css, /\.to-sm-item-label\s*\{[^}]*font-size:\s*clamp\(/s);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/s);
});
