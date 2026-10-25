import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html = read('site/index.html');
const css = read('site/papoulas-intactas-v76.css');
const js = read('site/v7.js');
const about = html.slice(html.indexOf('<section id="sobre"'), html.indexOf('<section id="solucoes"'));

assert(about.includes('assets/media/papoulas-preview.webp'), 'Seção Sobre deve usar papoulas originais completas e transparentes.');
assert(about.includes('class="about-floral-video"'), 'Asset deve preservar classe e organização do componente.');
assert(!about.includes('animacao-papoulas-alpha-v75.webm'), 'Proibir vídeo com pétalas degradadas pelo matte.');
assert(!html.includes('papoulas-alpha-v73.js'), 'Não carregar shader de recorte.');
assert(!about.includes('<video'), 'Papoulas não podem depender de vídeo com limite físico de frame.');
assert(css.includes('overflow:visible') && css.includes('clip-path:none') && css.includes('mask-image:none'),
  'Contêiner e mídia não podem aplicar recorte de bordas.');
assert(css.includes('papoula-sway') && css.includes('prefers-reduced-motion'),
  'Animar ilustração com movimento sutil, respeitando movimento reduzido.');
assert(js.includes("el.id==='sobre-heading'?2.1:1.28"),
  'Manter animação lenta do lettering.');
assert(js.includes('let entered=false') && js.includes('if(entered)'),
  'Não reiniciar o reveal do lettering ao retornar na rolagem.');
console.log('V7.6: silhueta integral sem retângulo e lettering preservado: OK');
