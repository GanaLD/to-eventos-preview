import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html = read('site/index.html');
const heroCss = read('site/hero-thaiso.css');
const autoplayJs = read('site/connect-autoplay.js');
const workflow = read('.github/workflows/pages.yml');

const projects = html.slice(html.indexOf('<section id="projetos"'),html.indexOf('<section id="contato"'));
const connect = projects.match(/<video\b[^>]*data-role="connect-autoplay"[^>]*>/)?.[0];
assert(connect, 'Connect em Experiência em ação precisa de identificação específica');
for(const attr of ['autoplay','muted','loop','playsinline','controls','preload="metadata"']){
  assert(new RegExp('(?:\\s|^)'+attr+'(?:\\s|>|$)').test(connect), 'Connect deve conter: '+attr);
}
assert(projects.includes('connect-web.webm') && projects.includes('connect-web.mp4'), 'Preservar mídias Connect');
assert(/<script defer src="connect-autoplay\.js(?:\?[^"]*)?">\s*<\/script>/.test(html), 'Carregar controlador de reprodução Connect');
assert(workflow.includes('node tests/hostinger-connect-visual-smoke.mjs'), 'Verificação Connect na publicação');
assert(workflow.includes('node --check site/connect-autoplay.js'), 'Validar sintaxe do controlador Connect');

const backdrop = heroCss.match(/\.hero-scroll-stage \.to-hero-thaiso-backdrop video\s*\{([^}]+)\}/)?.[1];
assert(backdrop, 'Estilos do fundo THAISO preservados');
const opacity = Number(backdrop.match(/opacity:\s*([\d.]+)/)?.[1]);
const brightness = Number(backdrop.match(/brightness\(([\d.]+)\)/)?.[1]);
assert(opacity >= .75, 'Take THAISO deve ser efetivamente visível; opacidade anterior apagava a imagem');
assert(brightness >= .8, 'Não escurecer excessivamente o take THAISO');
assert(/object-fit:\s*cover/.test(backdrop), 'Vídeo THAISO deve dar zoom e cobrir a tela, sem faixas nas bordas');
assert(/width:\s*100%/.test(backdrop) && /height:\s*100%/.test(backdrop), 'Vídeo THAISO deve ocupar toda a área responsiva');
const over = heroCss.match(/\.hero-scroll-stage \.to-hero-thaiso-backdrop::after\s*\{([^}]+)\}/)?.[1];
assert(over, 'Gradiente de legibilidade deve existir');
const alpha = [...over.matchAll(/rgba\(26,26,26,([\d.]+)\)/g)].map(m=>Number(m[1]));
assert(alpha.length>=2 && Math.min(...alpha)<.5, 'Pelo menos metade da composição deve preservar visibilidade da imagem');
assert(heroCss.includes('.hero-scroll-stage.is-hero-framed .to-hero-thaiso-backdrop'), 'Respeitar a fase final');
assert(html.includes('motion-hero-vertical-v11.mp4') && html.includes('data-accordion-gallery'), 'Hero mobile e sanfona intactos');

const handlers={}, vhandlers={}, buttonHandlers={};
const label={textContent:''};
const fullscreenButton={hidden:false,attributes:{},
  setAttribute(name,value){this.attributes[name]=value},
  querySelector:()=>label,
  addEventListener(name,fn){buttonHandlers[name]=fn}
};
const frame={classList:{add(){},remove(){}},
  querySelector:selector=>selector==='[data-connect-fullscreen]'?fullscreenButton:null
};
const video = {paused:true,muted:false,playCount:0,pauseCount:0,
  closest:selector=>selector==='.case-image'?frame:null,
  play(){this.paused=false;this.playCount++;return Promise.resolve()},
  pause(){this.paused=true;this.pauseCount++},
  addEventListener(name,fn){vhandlers[name]=fn}
};
let io;
const context={
  document:{hidden:false,fullscreenElement:null,documentElement:{classList:{add(){},remove(){}}},
    querySelector:sel=>sel.includes('connect-autoplay')?video:null,
    addEventListener:(name,fn)=>handlers[name]=fn,
    exitFullscreen(){this.fullscreenElement=null;handlers.fullscreenchange?.();return Promise.resolve()}},
  window:{addEventListener:(name,fn)=>handlers['window:'+name]=fn},
  setTimeout,
  IntersectionObserver:class {
    constructor(fn,options){this.notify=fn;this.options=options;io=this}
    observe(node){assert.equal(node,video)}
  }
};
frame.requestFullscreen=()=>{context.document.fullscreenElement=frame;handlers.fullscreenchange?.();return Promise.resolve()};
vm.runInNewContext(autoplayJs,context);
context.document.fullscreenElement=null;
assert(io, 'Observar visibilidade real do Connect');
io.notify([{target:video,isIntersecting:true,intersectionRatio:.75}]);
assert.equal(video.playCount,1, 'Connect deve tocar automaticamente quando visível');
io.notify([{target:video,isIntersecting:false,intersectionRatio:0}]);
assert(video.pauseCount>0, 'Connect deve pausar fora da tela para economizar recursos');
io.notify([{target:video,isIntersecting:true,intersectionRatio:.7}]);
assert.equal(video.playCount,2,'Retornando aos projetos, deve retomar automaticamente');
context.document.hidden=true;handlers.visibilitychange();
assert(video.paused,'Suspender em aba oculta');
context.document.hidden=false;
await buttonHandlers.click({preventDefault(){},stopPropagation(){}});
assert.equal(fullscreenButton.attributes['aria-pressed'],'true','Connect entra em tela cheia');
assert.equal(label.textContent,'Fechar tela cheia','Botão informa como sair da tela cheia');
await buttonHandlers.click({preventDefault(){},stopPropagation(){}});
assert.equal(fullscreenButton.attributes['aria-pressed'],'false','Connect sai da tela cheia pelo mesmo botão');
console.log('PASS Hostinger parity: Connect autoplay e vídeo THAISO visível; Hero mobile e sanfona preservados');
