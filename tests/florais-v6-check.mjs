import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/florais-v6.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../site/florais-v6.js',import.meta.url),'utf8');
for(const name of ['papoula-2-direita.png','papoula-3-esquerda.png','animacao-papoulas.mp4']){
 assert(existsSync(new URL('../site/assets/media/'+name,import.meta.url)), 'Arquivo de mídia ausente: '+name);
}
assert(html.includes('florais-v6.css') && html.includes('florais-v6.js'));
const about=html.substring(html.indexOf('<section id="sobre"'),html.indexOf('<section id="solucoes"'));
const solutions=html.substring(html.indexOf('<section id="solucoes"'),html.indexOf('<section id="projetos"'));
assert(about.includes('src="assets/media/animacao-papoulas.mp4"'));
assert(!about.includes('papoulas-preview.webp'));
assert(about.includes('playsinline') && about.includes('muted'));
assert(solutions.includes('src="assets/media/papoula-3-esquerda.png"'));
assert(solutions.includes('src="assets/media/papoula-2-direita.png"'));
assert(css.includes('object-fit: contain') && css.includes('pointer-events: none'));
assert(js.includes('ScrollTrigger.create') && js.includes('onEnterBack') && js.includes('onLeaveBack'));
assert(js.includes('play()') && js.includes('currentTime = 0'));
assert(js.includes('gsap.fromTo') && js.includes('prefers-reduced-motion'));
assert(html.indexOf('id="hero"') < html.indexOf('id="sobre"'));
assert(html.indexOf('id="sobre"') < html.indexOf('id="solucoes"'));
console.log('TO Eventos V6: mídia e animações florais verificadas.');
