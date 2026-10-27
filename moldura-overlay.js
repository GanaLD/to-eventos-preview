/* TO Eventos — moldura V13 sem halo. Fonte MP4 com preto neutro via CSS screen. Hero original intacto. */
(() => {
'use strict';
function progressForScroll(scrollY, distance) {
  return Math.max(0, Math.min(1, (Number(scrollY) || 0) / Math.max(1, distance)));
}

function timeForScroll(progress, duration) {
  return Math.max(0, Number(duration) || 0) * (1 - Math.max(0, Math.min(1, progress)));
}

/**
 * Desenha mídia 16:9 como uma borda de nove fatias (9-slice).
 * As quatro áreas dos cantos são dimensionadas UNIFORMEMENTE para não
 * achatar as flores. Apenas as tiras intermediárias se adaptam ao aspect
 * ratio do viewport. Funciona para desktop ultra-wide e mobile em retrato.
 */
function calculateNineSlice(sw, sh, dw, dh) {
  if (![sw, sh, dw, dh].every(n => Number.isFinite(n) && n > 0)) return [];

  if (dh > dw) {
    // Em retrato a imagem 16:9 NÃO pode ser esticada verticalmente.
    // Recompõe quatro cantos e dois motivos laterais, sempre no mesmo scale.
    const cornerSW = sw * .44;
    const cornerSH = sh * .48;
    const cornerW = Math.min(dw * .475, cornerSW * Math.min(dw / sw, dh / sh) * 1.5);
    const cornerH = cornerW * cornerSH / cornerSW;
    const sideSW = sw * .24;
    const sideSH = sh * .51;
    const sideW = Math.min(dw * .20,cornerW * .50);
    const sideH = sideW * sideSH / sideSW;
    const midTop = (dh - sideH) / 2;
    return [
      {sx:0, sy:0, sw:cornerSW, sh:cornerSH, dx:0, dy:0, dw:cornerW, dh:cornerH, fadeY:'bottom'},
      {sx:sw-cornerSW, sy:0, sw:cornerSW, sh:cornerSH, dx:dw-cornerW, dy:0, dw:cornerW, dh:cornerH, fadeY:'bottom'},
      {sx:0, sy:sh-cornerSH, sw:cornerSW, sh:cornerSH, dx:0, dy:dh-cornerH, dw:cornerW, dh:cornerH, fadeY:'top'},
      {sx:sw-cornerSW, sy:sh-cornerSH, sw:cornerSW, sh:cornerSH, dx:dw-cornerW, dy:dh-cornerH, dw:cornerW, dh:cornerH, fadeY:'top'},
      {sx:0, sy:sh*.30, sw:sideSW, sh:sideSH, dx:0, dy:midTop, dw:sideW, dh:sideH, feathered:true},
      {sx:sw-sideSW, sy:sh*.30, sw:sideSW, sh:sideSH, dx:dw-sideW, dy:midTop, dw:sideW, dh:sideH, feathered:true}
    ];
  }

  const sx = [0, sw * .30, sw * .70, sw];
  const sy = [0, sh * .25, sh * .75, sh];
  const scale = Math.min(dw / sw, dh / sh, dw * .46 / sx[1], dh * .38 / sy[1]);
  const cornerW = sx[1] * scale;
  const cornerH = sy[1] * scale;
  const dx = [0, cornerW, dw - cornerW, dw];
  const dy = [0, cornerH, dh - cornerH, dh];
  const tiles = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      tiles.push({
        sx: sx[col], sy: sy[row],
        sw: sx[col+1]-sx[col], sh: sy[row+1]-sy[row],
        dx: dx[col], dy: dy[row],
        dw: dx[col+1]-dx[col], dh: dy[row+1]-dy[row]
      });
    }
  }
  return tiles;
}


const stage = document.querySelector('.hero-scroll-stage');
const hero = document.getElementById('hero');
if (!stage || !hero) return;
/* FIX MOBILE V15: native video player is the VISIBLE frame of the mobile overlay.
   Avoid canvas drawImage, which was only checking decoder and did not reliably
   show the artwork on real devices. Desktop path below is unchanged. */
function startMobileFloral() {
  if (document.getElementById('to-floral-mobile-v15')) return;
  const floralReverseEnd = 0.42;
  const clamp = p => Math.max(0, Math.min(1, p));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = document.createElement('div');
  layer.id = 'to-floral-mobile-v15';
  layer.setAttribute('aria-hidden', 'true');
  const video = document.createElement('video');
  video.id = 'to-floral-mobile-v15-video';
  video.src = window.__TO_PREVIEW_MEDIA__?.mobileMp4 || 'assets/media/floral-mobile-v14.mp4';
  video.autoplay = !reduced; video.muted = true; video.defaultMuted = true;
  video.loop = false; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.disablePictureInPicture = true;
  const poster = document.createElement('img');
  poster.id = 'to-floral-mobile-v15-poster';
  poster.src = window.__TO_PREVIEW_MEDIA__?.mobilePoster || 'assets/media/floral-mobile-v14.webp';
  poster.alt = ''; poster.draggable = false;
  poster.style.display = 'none';
  layer.append(video, poster);
  document.body.appendChild(layer);
  // Alinhar às bordas reais do Hero (inclusive previews de celular dentro
  // de um canvas/iframe maior); não usar as bordas do navegador externo.
  const syncLayerBounds = () => {
    const rect = hero.getBoundingClientRect();
    layer.style.inset = 'auto';
    layer.style.left = rect.left+'px';
    layer.style.top = rect.top+'px';
    layer.style.width = rect.width+'px';
    layer.style.height = rect.height+'px';
  };
  syncLayerBounds();
  let introDone = false, scrollStarted = false;
  let wantedTime = null, raf = 0;
  const progress = () => {
    const st = window.ScrollTrigger;
    const trigger = st?.getById('to-hero-mobile-film-and-copy');
    if (trigger) return clamp(trigger.progress);
    return clamp(-stage.getBoundingClientRect().top / Math.max(1, innerHeight*1.9));
  };
  const scheduleSeek = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (wantedTime === null || video.readyState < 1 || video.seeking) return;
      if (Math.abs(video.currentTime - wantedTime) > 1/30) {
        try { video.currentTime = wantedTime; } catch { /* decoding pending */ }
      }
    });
  };
  const update = () => {
    syncLayerBounds();
    const p = progress();
    const reverse = clamp(p / floralReverseEnd);
    layer.style.opacity = String(1 - reverse);
    if (reduced) { video.style.display = 'none'; poster.style.display = ''; return; }
    if (!scrollStarted && p < .001) return; // play full intro at top, then freeze
    scrollStarted = true;
    poster.style.display = 'none';
    video.style.display = '';
    video.pause();
    const duration = video.duration;
    if (Number.isFinite(duration) && duration > 0) {
      wantedTime = Math.max(0, duration - 1/24) * (1 - reverse);
      scheduleSeek();
    }
  };
  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {scrollRaf = 0; update();});
  };
  const scrollTrigger = window.ScrollTrigger;
  scrollTrigger?.addEventListener('update', onScroll);
  video.addEventListener('loadedmetadata', () => {
    if (reduced) { update(); return; }
    if (progress() > .001) { update(); return; }
    video.play().catch(() => { poster.style.display = ''; video.style.display='none';});
  });
  video.addEventListener('ended', () => {
    introDone = true;
    video.pause();
    if (!scrollStarted) { poster.style.display = ''; video.style.display = 'none'; }
    onScroll();
  });
  video.addEventListener('seeked', scheduleSeek);
  video.addEventListener('error', () => {poster.style.display = '';video.style.display = 'none';});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (!scrollStarted && !introDone && !reduced) video.play().catch(() => {});
  });
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  window.addEventListener('pagehide', () => {
    video.pause(); window.removeEventListener('scroll', onScroll);
    scrollTrigger?.removeEventListener('update', onScroll);
    window.removeEventListener('resize', onScroll);
    if (raf) cancelAnimationFrame(raf);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
  }, {once:true});
  video.load();
  onScroll();
}
/* V16: alterna camada mobile/desktop no resize sem recarregar o site.
   O caminho V13 desktop abaixo mantém sua implementação original. */
function startDesktopFloral() {
if (document.getElementById('to-floral-intro-v10')) return;
const canvas = document.createElement('canvas');
canvas.id='to-floral-intro-v10';
canvas.setAttribute('aria-hidden','true');
document.body.appendChild(canvas);
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx) { canvas.remove(); return; }
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// MP4 H.264 compatível também com Safari, sem necessidade de imagem estática nesse navegador.
const video = document.createElement('video');
video.className='to-floral-v10-video-decoder';
video.setAttribute('aria-hidden','true');
video.setAttribute('playsinline','');
video.playsInline=true;video.muted=true;video.defaultMuted=true;video.preload='auto';
video.disablePictureInPicture=true;video.loop=false;
const isMobilePortrait = window.matchMedia('(max-width: 899px) and (orientation: portrait)').matches;
// Desktop preservado: só a fonte da moldura muda em mobile retrato.
const sourceMP4 = isMobilePortrait
  ? (window.__TO_PREVIEW_MEDIA__?.mobileMp4 || 'assets/media/floral-mobile-v14.mp4')
  : (window.__TO_PREVIEW_MEDIA__?.mp4 || 'assets/media/moldura-v13-screen.mp4');
const sourcePoster = isMobilePortrait
  ? (window.__TO_PREVIEW_MEDIA__?.mobilePoster || 'assets/media/floral-mobile-v14.webp')
  : (window.__TO_PREVIEW_MEDIA__?.poster || 'assets/media/moldura-v13-screen.webp');
video.src=sourceMP4;
document.body.appendChild(video);
const poster = new Image();poster.src=sourcePoster;
let posterReady=false;let videoError=false;
let introDone=false;let scrollStarted=false;
let targetTime=null;let latestVideoTime=-1;
let frameRequest=0;let sizeW=0;let sizeH=0;
const floralReverseEnd = 0.42; // Somente a moldura some mais cedo; o Hero V5 permanece inalterado.
const offscreen = document.createElement('canvas');
const offctx = offscreen.getContext('2d',{alpha:true});
const clamp=(x)=>Math.max(0,Math.min(1,x));
function heroProgress(){
  // Não instanciar nem alterar um segundo ScrollTrigger do Hero.
  const st=window.ScrollTrigger;
  const active=st?.getById('to-hero-film-and-copy') || st?.getById('to-hero-mobile-film-and-copy');
  if(active) return clamp(active.progress);
  // Fallback somente de leitura quando GSAP ainda está carregando.
  const top=stage.getBoundingClientRect().top;
  return clamp((-top)/Math.max(1,innerHeight*3.3));
}
function drawMedia(media){
  const sw=media.videoWidth||media.naturalWidth;
  const sh=media.videoHeight||media.naturalHeight;
  if(!(sw>0 && sh>0 && sizeW>0 && sizeH>0)) return;
  ctx.clearRect(0,0,sizeW,sizeH);
  // Zoom da composição floral: 7% extra são cortados nas bordas, sem tocar no Hero.
  ctx.save();
  ctx.translate(sizeW/2,sizeH/2);
  ctx.scale(1.07,1.07);
  ctx.translate(-sizeW/2,-sizeH/2);
  if(isMobilePortrait){
    // Imagem mobile 9:16 intacta, preenchendo a viewport sem esticar ou repetir flores.
    // A camada conserva o Screen Blend e o zoom 7% do desktop, sem chroma key.
    const scale=Math.max(sizeW/sw,sizeH/sh);
    const drawW=sw*scale,drawH=sh*scale;
    ctx.drawImage(media,(sizeW-drawW)/2,(sizeH-drawH)/2,drawW,drawH);
    ctx.restore();
    return;
  }
  for(const t of calculateNineSlice(sw,sh,sizeW,sizeH)){
    if (!(t.dw>0 && t.dh>0)) continue;
    if ((t.feathered || t.fadeY) && offctx){
      offscreen.width=Math.max(1,Math.ceil(t.dw));offscreen.height=Math.max(1,Math.ceil(t.dh));
      offctx.globalCompositeOperation='source-over';
      offctx.drawImage(media,t.sx,t.sy,t.sw,t.sh,0,0,offscreen.width,offscreen.height);
      offctx.globalCompositeOperation='destination-in';
      const fade=offctx.createLinearGradient(0,0,0,offscreen.height);
      if(t.fadeY==='bottom') {fade.addColorStop(0,'#000');fade.addColorStop(.72,'#000');fade.addColorStop(1,'transparent');}
      else if(t.fadeY==='top'){fade.addColorStop(0,'transparent');fade.addColorStop(.28,'#000');fade.addColorStop(1,'#000');}
      else {fade.addColorStop(0,'transparent');fade.addColorStop(.2,'#000');fade.addColorStop(.8,'#000');fade.addColorStop(1,'transparent');}
      offctx.fillStyle=fade;offctx.fillRect(0,0,offscreen.width,offscreen.height);
      ctx.drawImage(offscreen,t.dx,t.dy,t.dw,t.dh);
    } else ctx.drawImage(media,t.sx,t.sy,t.sw,t.sh,t.dx,t.dy,t.dw,t.dh);
  }
  ctx.restore();
}
function draw(){
  if((reduced || videoError) && posterReady) drawMedia(poster);
  else if(video.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA){
    drawMedia(video);latestVideoTime=video.currentTime;
  }
}
function resize(){
  sizeW=Math.max(1,innerWidth);sizeH=Math.max(1,innerHeight);
  const dpr=Math.min(2,Math.max(1,devicePixelRatio||1));
  canvas.width=Math.ceil(sizeW*dpr);canvas.height=Math.ceil(sizeH*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
function seekToTime(){
  if(targetTime===null || video.seeking || video.readyState<1 || videoError) return;
  if(Math.abs(video.currentTime-targetTime)<1/48) { if(Math.abs(latestVideoTime-video.currentTime)>1/48) draw();return; }
  try {video.currentTime=targetTime;} catch { /* metadata indisponível durante carga */ }
}
function update(){
  frameRequest=0;
  const p=heroProgress();
  const reverseProgress=clamp(p/floralReverseEnd);
  canvas.style.opacity=(1-reverseProgress).toFixed(4);
  if(reduced || videoError){if(posterReady) draw();return;}
  // No topo a introdução deve concluir naturalmente antes do scroll assumir o playhead.
  if(!scrollStarted && p<.001) return;
  scrollStarted=true;
  video.pause();
  if(!Number.isFinite(video.duration) || video.duration<=0)return;
  targetTime=timeForScroll(reverseProgress,Math.max(0,video.duration-1/48));
  seekToTime();
}
function onScroll(){if(!frameRequest)frameRequest=requestAnimationFrame(update);}
const scrollTrigger=window.ScrollTrigger;
scrollTrigger?.addEventListener('update',onScroll);
video.addEventListener('seeked',()=>{draw();seekToTime();});
video.addEventListener('loadeddata',draw);
video.addEventListener('timeupdate',()=>{if(!scrollStarted)draw();});
video.addEventListener('ended',()=>{introDone=true;video.pause();draw();onScroll();});
video.addEventListener('loadedmetadata',()=>{
  if(reduced) {draw();onScroll();return;}
  if(heroProgress()>.001){scrollStarted=true;onScroll();return;}
  video.play().catch(()=>{videoError=true;draw();onScroll();});
});
video.addEventListener('error',()=>{videoError=true;draw();onScroll();});
poster.onload=()=>{posterReady=true;if(reduced || videoError)draw();};
if('requestVideoFrameCallback' in video){
 const frame=()=>{draw();video.requestVideoFrameCallback(frame);};
 video.requestVideoFrameCallback(frame);
} else {
 let frameLoop=0;
 const loop=()=>{frameLoop=0;if(!video.paused && !videoError){draw();frameLoop=requestAnimationFrame(loop);}};
 video.addEventListener('play',()=>{if(!frameLoop)frameLoop=requestAnimationFrame(loop);});
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',()=>{resize();onScroll();},{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)video.pause();
 else if(!scrollStarted && !introDone && !reduced && !videoError)video.play().catch(()=>{});
});
window.addEventListener('pagehide',()=>{
 window.removeEventListener('scroll',onScroll);
  scrollTrigger?.removeEventListener('update',onScroll);
 if(frameRequest)cancelAnimationFrame(frameRequest);
 video.pause();
},{once:true});
resize();
if(!reduced)video.load();
onScroll();
}
const portraitMode = () => window.matchMedia('(max-width: 899px) and (orientation: portrait)').matches
  || document.documentElement.classList.contains('to-hero-mobile-portrait-forced');
function reconcileFloralLayer() {
  if (portraitMode()) {
    startMobileFloral();
    const mobile = document.getElementById('to-floral-mobile-v15');
    const desktop = document.getElementById('to-floral-intro-v10');
    if (mobile) mobile.style.display = '';
    if (desktop) desktop.style.display = 'none';
  } else {
    startDesktopFloral();
    const mobile = document.getElementById('to-floral-mobile-v15');
    const desktop = document.getElementById('to-floral-intro-v10');
    if (mobile) mobile.style.display = 'none';
    if (desktop) desktop.style.display = '';
  }
}
const resyncFloral = () => requestAnimationFrame(reconcileFloralLayer);
window.addEventListener('resize', resyncFloral, {passive:true});
window.addEventListener('orientationchange', resyncFloral, {passive:true});
reconcileFloralLayer();
})();
