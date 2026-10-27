/* TO Eventos — Connect autoplay. O vídeo inicia quando aparece na
   seção "Experiência em ação", sem som automático, e preserva controles. */
(() => {
  const video = document.querySelector('#projetos .case-featured video[data-role="connect-autoplay"]');
  if (!video) return;

  const frame = video.closest('.case-image');
  const fullscreenButton = frame?.querySelector('[data-connect-fullscreen]');
  const canFullscreen = Boolean(frame);
  let fallbackFullscreen = false;
  let webkitVideoFullscreen = false;
  let fullscreenPlaceholder = null;
  const isFullscreen = () => document.fullscreenElement === frame || document.webkitFullscreenElement === frame || fallbackFullscreen || webkitVideoFullscreen;
  const syncFullscreenButton = () => {
    if (!fullscreenButton) return;
    fullscreenButton.hidden = !canFullscreen;
    const active = isFullscreen();
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.setAttribute('aria-label', active ? 'Fechar tela cheia do vídeo Connect' : 'Assistir vídeo Connect em tela cheia');
    const label = fullscreenButton.querySelector('.connect-fullscreen-label');
    if (label) label.textContent = active ? 'Fechar tela cheia' : 'Tela cheia';
  };
  const enterFallbackFullscreen = () => {
    if (!frame) return;
    if (!fullscreenPlaceholder && frame.parentNode) {
      fullscreenPlaceholder = document.createComment('connect-video-position');
      frame.parentNode.insertBefore(fullscreenPlaceholder, frame);
      document.body.appendChild(frame);
    }
    fallbackFullscreen = true;
    frame.classList.add('is-connect-fullscreen-fallback');
    document.documentElement.classList.add('connect-fallback-active');
    syncFullscreenButton();
    window.ScrollTrigger?.refresh();
  };
  const exitFallbackFullscreen = () => {
    fallbackFullscreen = false;
    frame?.classList.remove('is-connect-fullscreen-fallback');
    document.documentElement.classList.remove('connect-fallback-active');
    if (fullscreenPlaceholder?.parentNode && frame) {
      fullscreenPlaceholder.parentNode.insertBefore(frame, fullscreenPlaceholder);
      fullscreenPlaceholder.remove();
      fullscreenPlaceholder = null;
    }
    syncFullscreenButton();
    window.ScrollTrigger?.refresh();
  };
  const leaveFullscreen = () => {
    if (fallbackFullscreen) { exitFallbackFullscreen(); return; }
    if (webkitVideoFullscreen && video.webkitExitFullscreen) { video.webkitExitFullscreen(); return; }
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (video.webkitExitFullscreen) video.webkitExitFullscreen();
  };
  fullscreenButton?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    if (isFullscreen()) { leaveFullscreen(); return; }
    try {
      if (frame?.requestFullscreen) {
        const result = frame.requestFullscreen({navigationUI:'hide'});
        const entered = await Promise.race([
          Promise.resolve(result).then(() => true, () => false),
          new Promise(resolve => setTimeout(() => resolve(false), 600))
        ]);
        if (!entered || !isFullscreen()) enterFallbackFullscreen();
      }
      else if (frame?.webkitRequestFullscreen) frame.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) { video.webkitEnterFullscreen(); return; }
      if (!isFullscreen() && !webkitVideoFullscreen) enterFallbackFullscreen();
    } catch { enterFallbackFullscreen(); }
    syncFullscreenButton();
  });
  document.addEventListener('fullscreenchange', syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
  video.addEventListener('webkitbeginfullscreen', () => { webkitVideoFullscreen = true; syncFullscreenButton(); });
  video.addEventListener('webkitendfullscreen', () => { webkitVideoFullscreen = false; syncFullscreenButton(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && fallbackFullscreen) exitFallbackFullscreen();
  });
  syncFullscreenButton();

  // Autoplay com áudio é bloqueado por navegadores: o visitante pode
  // ativar o som manualmente pelos controles do player.
  video.muted = true;
  video.defaultMuted = true;
  let inView = false;

  const playIfVisible = () => {
    if (!inView || document.hidden || !video.paused) return;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => { /* Reprodução manual continua disponível. */ });
    }
  };
  const pauseIfHidden = () => {
    if (!video.paused) video.pause();
  };

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === video);
      if (!entry) return;
      inView = entry.isIntersecting && entry.intersectionRatio >= .15;
      if (inView) playIfVisible();
      else pauseIfHidden();
    }, {threshold:[0,.15,.5]});
    observer.observe(video);
  } else {
    // Graceful fallback: o atributo autoplay do HTML continua ativo.
    inView = true;
    playIfVisible();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseIfHidden();
    else playIfVisible();
  });
  video.addEventListener('canplay', playIfVisible);
  window.addEventListener('pageshow', playIfVisible);
})();
