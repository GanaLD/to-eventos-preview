import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('site/index.html');
const hero = read('site/hero-v5.js');
const writing = read('site/editorial-writing.js');
const finish = read('site/release-enhancements.css');
const pdf = read('site/v7.js');
const sitemap = read('site/sitemap.xml');

assert(html.includes('editorial-writing.js') && html.includes('release-enhancements.css'), 'Módulo editorial deve carregar na página inicial');
assert(html.includes('assets/media/tke-thaiso-background.mp4') && html.includes('assets/media/tke-thaiso-poster.jpg'), 'Take THAISO enviado deve estar ligado à página');
for (const selector of ['#sobre-heading','#solucoes-heading','#projetos-heading','.project-panel-video .full-video-block h3','#ag-heading','#contato-heading']) {
  assert(writing.includes(selector), 'Título com escrita progressiva: ' + selector);
}
assert(writing.includes("ease: 'steps(' + steps + ')'"), 'Títulos devem revelar progressivamente');
assert(writing.includes("'--contact-glow': .18") && writing.includes("'--contact-line': 1"), 'Contato deve ganhar fechamento visual especial');
assert(finish.includes('.contact-section::before') && finish.includes('.contact-section::after'), 'Brilho e linha de encerramento do contato');
assert(hero.includes("clipPath: 'inset(0 0% 0 0)'"), 'Título principal deve ser escrito no scrub do HERO');
assert(hero.includes('onUpdate: self =>') && hero.includes('timeline.progress(self.progress)'), 'HERO deve acompanhar o scroll nos dois sentidos');
assert(pdf.includes("showcase.classList.add('is-fullscreen-fallback')") && pdf.includes('document.body.appendChild(showcase)') && pdf.includes("event.key==='Escape'"), 'PDF ocupa a viewport e sai com Escape');
assert(!/<a\b[^>]*\bdownload(?:\s|=|>)/i.test(html), 'A página não deve mostrar ação de download do PDF');
assert(sitemap.includes('https://toeventos.com/sobre/'), 'Sitemap deve incluir a página Sobre');
console.log('PASS: escrita nos títulos, entrada editorial, contato épico, fullscreen e retorno do HERO');
