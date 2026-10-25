import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
const css=readFileSync(new URL('../site/ui-v41.css', import.meta.url), 'utf8');
const js=readFileSync(new URL('../site/ui-v41.js', import.meta.url), 'utf8');
const original=readFileSync(new URL('../site/main.js', import.meta.url), 'utf8');

assert(html.includes('<link rel="stylesheet" href="ui-v41.css">'), 'Folha V4.1 não carregada');
assert(html.includes('<script defer src="ui-v41.js"></script>'), 'Script V4.1 não carregado');
// V4.1 mantém o conteúdo e a transição; o menu superior antigo foi substituído.
const menuCss=readFileSync(new URL('../site/staggered-menu.css', import.meta.url), 'utf8');
const menuJs=readFileSync(new URL('../site/staggered-menu.js', import.meta.url), 'utf8');
assert(html.includes('staggered-menu.css')&&html.includes('staggered-menu.js'), 'Novo menu deve carregar CSS e JS');
assert(!html.includes('class="nav" id="nav"')&&!html.includes('class="nav-toggle"'), 'Navegação superior antiga não deve competir com novo menu');
assert([...html.matchAll(/<(?:a|button)\b[^>]*data-to-menu-item="([^"]+)"/g)].map(m=>m[1]).join(',')==='HOME,PRODUCT', 'Menu deve ter somente HOME e PRODUCT');
assert(/data-to-menu-item="HOME"[^>]*href="\.\/#hero"/.test(html), 'HOME deve funcionar no GitHub Pages com base relativa');
assert(/<button[^>]*data-to-menu-item="PRODUCT"[^>]*disabled/.test(html), 'PRODUCT deve ficar desabilitado');
assert(menuCss.includes('backdrop-filter: blur(22px)')&&menuCss.includes('#FF4D00'), 'Acionador em vidro e paleta da marca');
assert(menuJs.includes('window.gsap')&&menuJs.includes('Escape'), 'GSAP e acessibilidade do menu devem ser preservados');
assert(/\.site-header\s+\.nav-contact\s*\{[^}]*background:\s*var\(--orange\)/s.test(css), 'CTA do cabeçalho deve ser laranja TO Eventos');
assert(html.includes('class="to-whatsapp-float"'), 'Botão flutuante original não deve ser removido');
assert(/matchMedia|matchMedia\(/.test(js), 'Movimento deve considerar breakpoints e redução de movimento');
assert(js.includes("getElementById('sobre')") && js.includes("getElementById('solucoes')"), 'Transição deve ocorrer apenas entre Sobre e Soluções');
assert(html.includes('<div class="to-page-turn" id="to-page-turn">'), 'Somente Sobre e Soluções devem estar dentro do palco da transição');
assert(html.indexOf('id="hero"') < html.indexOf('id="to-page-turn"'), 'HERO não pode participar do palco da transição');
assert(html.indexOf('id="to-page-turn"') < html.indexOf('id="sobre"') && html.indexOf('id="sobre"') < html.indexOf('id="solucoes"'), 'Ordem das seções precisa ser preservada');
assert(html.indexOf('<!-- FIM DA TRANSIÇÃO SOBRE E SOLUÇÕES -->') < html.indexOf('id="projetos"'), 'Projetos devem permanecer fora do palco da transição');
assert(css.includes('.to-page-turn{position:relative;isolation:isolate}'), 'Palco precisa ter isolação de empilhamento');
assert(/#sobre\s*\{[^}]*position:\s*sticky/s.test(css), 'Papoulas devem ficar no fluxo com sticky natural, sem pin com gap artificial');
assert(!js.includes('pinSpacing: false') && !js.includes('pin: about'), 'NÃO usar pinSpacing:false/pin:true no Sobre: sobrepõe o HERO');
assert(js.includes('gsap.fromTo(solutions'), 'GSAP deve animar exclusivamente a subida da seção de competências');
assert(js.includes("start: 'top bottom'") && js.includes("end: 'top top'"), 'Entrada da seção deve ocorrer somente quando competências alcançar o viewport');
assert(js.includes('invalidateOnRefresh: true'), 'Transição deve recalcular dimensões após resize');
assert(original.includes("getElementById('projects-track')"), 'GSAP horizontal precisa ser preservado');
assert(html.includes('hero-v5.js') && html.includes('data-role="hero-film"'), 'HERO Scroll V5 deve permanecer ativo');
console.log('TO Eventos V4.1 — regressões estruturais OK');
