import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('site/index.html');
const css = read('site/accordion-gallery.css');
const js = read('site/accordion-gallery.js');

test('galeria editorial fica após o percurso GSAP/PDF e antes do contato', () => {
  const projects = html.indexOf('<section id="projetos"');
  const pdf = html.indexOf('id="to-pdf-showcase"');
  const gallery = html.indexOf('<section id="galeria-editorial"');
  const contact = html.indexOf('<section id="contato"');
  assert(projects >= 0 && pdf > projects && gallery > pdf && contact > gallery);
  assert(html.includes('assets/docs/portfolio-thais-ortiz.pdf'));
  assert(html.includes('data-pdf-action="next"'));
});

test('scripts e estilos novos são carregados uma vez sem remover a pilha existente', () => {
  assert.equal(html.match(/href="accordion-gallery\.css"/g)?.length, 1);
  assert.equal(html.match(/src="accordion-gallery\.js"/g)?.length, 1);
  for (const resource of ['main.js','hero-v5.js','v7.js','motion-v71.js','mobile-v9.css','hero-mobile-v10.css']) {
    assert(html.includes(resource), resource);
  }
});

test('painéis usam imagens locais existentes, rótulos e semântica de botão', () => {
  const gallery = html.split('<section id="galeria-editorial"')[1]?.split('<section id="contato"')[0] || '';
  const images = [...gallery.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)].map(x => x[1]);
  assert.equal(images.length, 3);
  for (const image of images) {
    assert(image.startsWith('assets/media/'));
    assert(fs.existsSync(new URL('../site/' + image, import.meta.url)), image);
  }
  assert.equal((gallery.match(/data-ag-panel/g) || []).length, 3);
  assert.equal((gallery.match(/aria-pressed=/g) || []).length, 3);
  assert(gallery.includes('aria-label="Galeria de experiências'));
});

test('interação possui teclado, touch, redução de movimento e fallback independente de GSAP', () => {
  assert(js.includes("mouseenter") && js.includes("focus") && js.includes("click"));
  assert(js.includes("ArrowRight") && js.includes("ArrowLeft"));
  assert(js.includes('aria-pressed') && js.includes('prefers-reduced-motion: reduce'));
  assert(js.includes('ResizeObserver') && js.includes('window.gsap'));
  assert(!js.includes('ScrollTrigger.create(') && !js.includes('ScrollTrigger.refresh(') && !js.includes('.killAll('));
  assert(css.includes('@media (max-width: 620px)'));
  assert(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert(css.includes(':focus-visible'));
});
