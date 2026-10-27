import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url),'utf8');
const html = read('site/index.html');
const css = read('site/hero-thaiso.css');
const js = read('site/hero-thaiso.js');
const controller = read('site/hero-v5.js');
const gallery = read('site/accordion-gallery.js');

assert(html.includes('hero-thaiso.css') && html.includes('hero-thaiso.js'), 'Camada autoral deve carregar sem substituir HERO V5');
assert(/class="to-hero-thaiso-backdrop"/.test(html), 'Fundo precisa existir dentro do HERO final');
assert(/data-src="assets\/media\/tke-thaiso-background\.mp4\?v=20261027"/.test(html), 'Take THAISO enviado deve ser carregado sob demanda');
assert(html.includes('motion-hero-vertical-v11.mp4'), 'Preservar HERO mobile 9:16');
assert(html.includes('data-accordion-gallery'), 'Preservar sanfona de cinco painéis');
assert(css.includes('.is-hero-framed .to-hero-thaiso-backdrop'), 'Fundo deve aparecer somente no HERO enquadrado');
assert(css.includes('pointer-events:none') || css.includes('pointer-events: none'), 'Fundo não pode bloquear cliques');
assert(/object-fit:contain/.test(css) && /\.to-hero-thaiso-fill[\s\S]*?object-fit:cover/.test(css), 'Take nítido preserva as laterais; camada de fundo cobre a tela');
assert(css.includes('tke-thaiso-poster.jpg') && css.includes('blur(10px)'), 'Preencher toda a tela com o take sem cortar o vídeo nítido');
assert(/prefers-reduced-motion:reduce/.test(css), 'Respeitar redução de movimento');
assert(js.includes('MutationObserver') && js.includes('classList.contains(\'is-hero-framed\')'), 'Playback acompanha fase final do HERO');
assert(js.includes('video.pause()'), 'Parar o vídeo fora da fase final');
assert(js.includes('fill.currentTime=video.currentTime'), 'Sincronizar a camada de preenchimento com o take nítido');
assert(!js.includes('ScrollTrigger.create') && !js.includes('pin: true'), 'Não adicionar um segundo pin ao HERO');
assert(controller.includes('to-hero-mobile-film-and-copy') && controller.includes('scheduleSeek') && controller.includes('scrub: true'), 'Preservar ScrollTrigger e retorno exato do scrubbing mobile');
assert(gallery.includes('data-accordion-gallery'), 'Preservar a galeria atual');

const asset = new URL('../site/assets/media/tke-thaiso-background.mp4',import.meta.url);
assert(fs.existsSync(asset) && fs.statSync(asset).size > 100_000, 'Take THAISO deve existir no repositório, sem URL temporária');
const poster = new URL('../site/assets/media/tke-thaiso-poster.jpg',import.meta.url);
assert(fs.existsSync(poster) && fs.statSync(poster).size > 10_000, 'Poster do take deve existir para preencher as laterais');
console.log('PASS: take THAISO no fundo final sem regressão do HERO e sanfona');
