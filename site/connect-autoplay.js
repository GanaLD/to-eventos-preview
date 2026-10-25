/* TO Eventos — Connect autoplay. O vídeo inicia quando aparece na
   seção "Experiência em ação", sem som automático, e preserva controles. */
(() => {
  const video = document.querySelector('#projetos .case-featured video[data-role="connect-autoplay"]');
  if (!video) return;

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
