import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('site/index.html');
const css=read('site/papoulas-alpha-v73.css');
const alpha=read('site/papoulas-alpha-v73.js');
const v7=read('site/v7.js');
const about=html.slice(html.indexOf('id="sobre"'),html.indexOf('id="solucoes"'));

assert(about.includes('animacao-papoulas-editorial-v72.mp4'),
  'Vídeo animado original deve continuar sem substituir mídia ou frames.');
assert(html.includes('papoulas-alpha-v73.css') && html.includes('papoulas-alpha-v73.js'),
  'Nova camada deve ser carregada pela página.');
assert(css.includes('object-fit:contain') && css.includes('overflow:visible'),
  'Sem crop, cover, overflow hidden ou corte geométrico das flores.');
assert(css.includes('.to-papoulas-keyed .about-floral-video'),
  'Ocultar vídeo somente após o primeiro frame transparente processado.');
assert(alpha.includes("canvas.getContext('webgl'") &&
       alpha.includes('gl.texImage2D') &&
       alpha.includes('texture2D(frame'),
  'Transparência deve processar frames do vídeo em GPU.');
assert(alpha.includes("figure.classList.add('to-papoulas-keyed')") &&
       alpha.includes("figure.classList.remove('to-papoulas-keyed')"),
  'Falha de WebGL deve manter vídeo original como fallback.');
assert(alpha.includes('canvas.style.opacity=video.style.opacity'),
  'Alpha deve seguir timing do reveal GSAP existente.');
assert(v7.includes("el.id==='sobre-heading'?2.1:1.28"),
  'Apenas título da seção desacelera; textos restantes conservam duração.');
assert(v7.includes('if(entered)'), 'Não reiniciar reveal no scroll reverso.');
console.log('V7.3: vídeo integral, transparência progressiva e lettering: OK');
