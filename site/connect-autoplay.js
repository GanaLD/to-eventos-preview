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
  let fullscreenOverlay = null;
  let fullscreenVideo = null;
  let fallbackWasPlaying = false;
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
    if (!frame || fallbackFullscreen) return;
    const position = video.currentTime || 0;
    fallbackWasPlaying = !video.paused;
    fullscreenOverlay = frame.cloneNode(true);
    fullscreenOverlay.classList.add('is-connect-fullscreen-fallback');
    fullscreenOverlay.setAttribute('role','dialog');
    fullscreenOverlay.setAttribute('aria-modal','true');
    fullscreenOverlay.setAttribute('aria-label','Vídeo Connect em tela cheia');
    fullscreenVideo = fullscreenOverlay.querySelector('video');
    fullscreenVideo.autoplay = false;
    fullscreenVideo.muted = video.muted;
    fullscreenVideo.volume = video.volume;
    fullscreenVideo.playbackRate = video.playbackRate;
    const close = fullscreenOverlay.querySelector('[data-connect-fullscreen]');
    close.setAttribute('aria-label','Fechar tela cheia do vídeo Connect');
    close.setAttribute('aria-pressed','true');
    const label = close.querySelector('.connect-fullscreen-label');
    if (label) label.textContent = 'Fechar tela cheia';
    close.addEventListener('click', exitFallbackFullscreen);
    fallbackFullscreen = true;
    video.pause();
    document.body.appendChild(fullscreenOverlay);
    document.documentElement.classList.add('connect-fallback-active');
    const overlay = fullscreenOverlay;
    const start = () => {
      if (fullscreenOverlay !== overlay) return;
      try { fullscreenVideo.currentTime = position; } catch { /* metadata may still be loading */ }
    };
    if (fullscreenVideo.readyState >= 1) start();
    else fullscreenVideo.addEventListener('loadedmetadata', start, {once:true});
    // Inicie dentro do gesto do visitante para preservar o áudio quando ele
    // já tiver sido habilitado nos controles do vídeo original.
    if (fallbackWasPlaying) fullscreenVideo.play()?.catch(() => {});
    syncFullscreenButton();
    close.focus({preventScroll:true});
  };
  const exitFallbackFullscreen = () => {
    if (!fallbackFullscreen) return;
    const position = fullscreenVideo?.readyState >= 1 ? fullscreenVideo.currentTime : video.currentTime;
    const shouldPlay = fullscreenVideo?.readyState >= 1 ? !fullscreenVideo.paused : fallbackWasPlaying;
    if (fullscreenVideo) {
      video.muted = fullscreenVideo.muted;
      video.volume = fullscreenVideo.volume;
      video.playbackRate = fullscreenVideo.playbackRate;
      fullscreenVideo.pause();
    }
    fallbackFullscreen = false;
    document.documentElement.classList.remove('connect-fallback-active');
    fullscreenOverlay?.remove();fullscreenOverlay = null;fullscreenVideo = null;
    try { video.currentTime = position; } catch { /* preserve the current frame if seeking is unavailable */ }
    if (shouldPlay && !document.hidden) video.play()?.catch(() => {});
    syncFullscreenButton();
    fullscreenButton?.focus({preventScroll:true});
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
  const onFullscreenChange = () => {
    if ((document.fullscreenElement || document.webkitFullscreenElement) === frame && fallbackFullscreen) exitFallbackFullscreen();
    syncFullscreenButton();
  };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
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
    if (fallbackFullscreen || !inView || document.hidden || !video.paused) return;
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
