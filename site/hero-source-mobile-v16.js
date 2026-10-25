/* TO Eventos · V16 — resolve apenas fonte do Hero mobile.
   Na troca de viewport (ex.: simulador desktop -> celular), <video><source media>
   não e necessariamente reselecionado pelo browser. Nada modifica o filme desktop. */
(() => {
  'use strict';
  const video = document.querySelector('[data-role="hero-film"]');
  const hero = document.getElementById('hero');
  if (!video || !hero) return;
  const portraitMedia = 'assets/media/motion-hero-vertical-v11.mp4';
  const mq = window.matchMedia('(max-width: 899px) and (orientation: portrait)');
  let forced = false;
  function wantsPortrait() {
    const box = hero.getBoundingClientRect();
    // Em previews com iframe/canvas externo, a caixa real pode ser retrato
    // mesmo quando a viewport do browser externo continua em modo desktop.
    const portraitBox = box.width > 0 && box.width <= 899 && box.height > box.width * 1.18;
    return mq.matches || portraitBox;
  }
  function syncSource() {
    const mobile = wantsPortrait();
    document.documentElement.classList.toggle('to-hero-mobile-portrait-forced', mobile);
    if (mobile && !forced) {
      forced = true;
      video.setAttribute('src', portraitMedia);
      video.load();
    } else if (!mobile && forced) {
      forced = false;
      video.removeAttribute('src');
      video.load(); // Retorna aos <source> originais, sem forcar mídia desktop.
    }
  }
  const onResize = () => requestAnimationFrame(syncSource);
  syncSource();
  mq.addEventListener?.('change', syncSource);
  window.addEventListener('resize', onResize, {passive:true});
  window.addEventListener('orientationchange', onResize, {passive:true});
  window.addEventListener('pagehide', () => {
    mq.removeEventListener?.('change', syncSource);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  }, {once:true});
})();
