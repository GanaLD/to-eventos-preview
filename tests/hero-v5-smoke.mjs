import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url),'utf8');
const html=read('site/index.html');
const css=read('site/hero-v5.css');
const js=read('site/hero-v5.js');
const main=read('site/main.js');
const workflow=read('.github/workflows/pages.yml');

assert(html.includes('hero-v5.css') && html.includes('hero-v5.js'), 'HERO V5 CSS/JS devem carregar');
assert(html.includes('class="hero-film-screen"'), 'Vídeo de abertura precisa preencher o primeiro bloco');
assert(html.includes('src="assets/media/motion-hero.mp4"'), 'Hero usa arquivo motion-hero.mp4 servido localmente pelo Pages');
assert(/id="hero"[\s\S]*hero-film-screen/.test(html), 'Vídeo dentro do #hero');
assert(css.includes('.site-header{display:none'), 'Barra superior não deve existir na versão atual');
assert(/\.hero-visual\s*\{[^}]*aspect-ratio:\s*16\/9/s.test(css), 'Último enquadramento deve preservar 16:9');
assert(css.includes('object-fit:contain'), 'Não distorcer o vídeo');
assert(js.includes('currentTime'), 'Vídeo deve ser controlado pelo scroll');
assert(js.includes('ScrollTrigger.create'), 'HERO necessita GSAP ScrollTrigger');
assert(js.includes('pin: true'), 'HERO deve fixar durante vídeo e entrada dos textos');
assert(js.includes('const videoPhaseEnd = 0.7'), 'Vídeo precisa completar antes dos textos');
assert(js.includes('revealStart = 85'), 'Textos só aparecem na fase final');
assert(!main.includes('const intro = gsap.timeline'), 'Remover pin anterior do HERO para não haver duplo pin');
assert(workflow.includes('motion-hero.mp4') && workflow.includes('curl'), 'Workflow deve incluir vídeo no Pages');
assert(html.includes('id="sobre"') && html.includes('id="solucoes"') && html.includes('id="projetos"'), 'Seções posteriores preservadas');
assert(html.indexOf('id="hero"') < html.indexOf('id="sobre"'), 'HERO é a primeira seção');
console.log('TO Eventos HERO V5: estrutura, ordem e proteção de regressões aprovadas.');
