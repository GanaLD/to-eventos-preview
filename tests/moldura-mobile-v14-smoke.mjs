import assert from 'node:assert/strict';
import fs from 'node:fs';
const js=fs.readFileSync(new URL('../site/moldura-overlay.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../site/moldura-overlay.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const hero=fs.readFileSync(new URL('../site/hero-v5.js',import.meta.url),'utf8');
assert(js.includes("const isMobilePortrait = window.matchMedia('(max-width: 899px) and (orientation: portrait)').matches"),'Somente telas mobile retrato devem selecionar nova moldura');
assert(js.includes("'assets/media/floral-mobile-v14.mp4'"),'Video mobile diferente do desktop');
assert(js.includes("'assets/media/floral-mobile-v14.webp'"),'Poster mobile precisa ser o final da animacao');
assert(js.includes("'assets/media/moldura-v13-screen.mp4'"),'Desktop V13 precisa permanecer');
assert(js.includes('if(isMobilePortrait){') && js.includes('const scale=Math.max(sizeW/sw,sizeH/sh)'),'Video vertical usa quadro inteiro, sem fatiamento 9-slice');
assert(js.includes('calculateNineSlice(sw,sh,sizeW,sizeH)'),'Desktop continua usando as nove fatias');
assert(js.includes('const floralReverseEnd = 0.42'),'Saida reversa original permanece');
assert(js.includes('ctx.scale(1.07,1.07)'),'Zoom de 7 por cento permanece');
assert(css.includes('mix-blend-mode:screen'),'Nao gerar halo preto');
assert(html.includes('motion-hero-vertical-v11.mp4') && html.includes('motion-hero.mp4'),'Videos laranja mobile e desktop preservados');
assert(hero.includes("to-hero-film-and-copy") && hero.includes("to-hero-mobile-film-and-copy"),'Controladores do Hero preservados');
for(const ext of ['mp4','webp']) {
 const p=new URL('../site/assets/media/floral-mobile-v14.'+ext,import.meta.url);
 assert(fs.existsSync(p), 'Asset mobile ausente: '+p.pathname);
 assert(fs.statSync(p).size > 20000,'Asset mobile vazio');
}
console.log('PASS moldura V14: mobile retrato isolado, desktop V13 preservado, sem halos');
