import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
const css=readFileSync(new URL('../site/ui-v41.css', import.meta.url), 'utf8');
const js=readFileSync(new URL('../site/ui-v41.js', import.meta.url), 'utf8');
const original=readFileSync(new URL('../site/main.js', import.meta.url), 'utf8');

assert(html.includes('<link rel="stylesheet" href="ui-v41.css">'), 'Folha V4.1 não carregada');
assert(html.includes('<script defer src="ui-v41.js"></script>'), 'Script V4.1 não carregado');
assert(html.includes('class="nav" id="nav"'), 'Menu superior original precisa permanecer no DOM');
for(const label of ['Sobre','Soluções','Projetos','Contato']) {
  assert(html.includes('>'+label+'</a>'), 'Falta link superior '+label);
}
assert(/@media\s*\(min-width:\s*901px\)/.test(css), 'O menu superior deve ser restaurado no desktop');
assert(/\.site-header\s+\.nav\s*\{\s*display:\s*flex/.test(css), 'Menu superior desktop precisa ter display:flex');
assert(/\.site-header\s+\.nav-contact\s*\{[^}]*background:\s*var\(--orange\)/s.test(css), 'CTA do cabeçalho deve ser laranja TO Eventos');
assert(html.includes('class="to-whatsapp-float"'), 'Botão flutuante original não deve ser removido');
assert(/matchMedia|matchMedia\(/.test(js), 'Movimento deve considerar breakpoints e redução de movimento');
assert(js.includes("getElementById('sobre')") && js.includes("getElementById('solucoes')"), 'Transição deve ocorrer apenas entre Sobre e Soluções');
assert(js.includes('ScrollTrigger.create'), 'Transição deve usar ScrollTrigger');
assert(js.includes("start: 'bottom bottom'"), 'A transição deve começar no fim das papoulas');
assert(js.includes('pinSpacing: false'), 'Transição não pode inserir espaçamentos artificiais');
assert(js.includes('pin: about'), 'Seção das papoulas deve permanecer fixa durante a transição');
assert(js.includes('Math.sin') || js.includes('yPercent'), 'Painel de soluções deve ter transformação vertical sincronizada ao scroll');
assert(js.includes('invalidateOnRefresh: true'), 'Transição deve recalcular dimensões após resize');
assert(original.includes("getElementById('projects-track')"), 'GSAP horizontal precisa ser preservado');
assert(original.includes("document.querySelector('.hero-scroll-stage')"), 'HERO Scroll deve ser preservado');
console.log('TO Eventos V4.1 — regressões estruturais OK');
