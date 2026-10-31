/* TO Eventos — Connect: carregamento por visibilidade e expansão fora do trilho GSAP. */
(() => {
  const video = document.querySelector('#projetos .case-featured video[data-role="connect-autoplay"]');
  if (!video) return;
  const frame = video.closest('.case-image');
  const fullscreenButton = frame?.querySelector('[data-connect-fullscreen]');
  let viewer = null, fullscreenTarget = null, expandedVideo = null, expanded = false, nativeEntered = false;
  let inView = false, sourceLoaded = false, wasPlaying = false;

  const loadSources = () => {
    if (sourceLoaded) return;
    sourceLoaded = true;
    const sources = video.querySelectorAll?.('source[data-src]') || [];
    sources.forEach(source => { source.src = source.dataset.src; });
    if (sources.length) video.load();
  };
  const syncButton = () => {
    if (!fullscreenButton) return;
    fullscreenButton.setAttribute('aria-pressed', String(expanded));
    fullscreenButton.setAttribute('aria-label', expanded ? 'Fechar tela cheia do vídeo Connect' : 'Assistir vídeo Connect em tela cheia');
    const label = fullscreenButton.querySelector('.connect-fullscreen-label');
    if (label) label.textContent = expanded ? 'Fechar tela cheia' : 'Tela cheia';
  };
  const exitExpanded = () => {
    if (!expanded) return;
    const position = expandedVideo?.readyState >= 1 ? expandedVideo.currentTime : video.currentTime;
    const resume = expandedVideo?.readyState >= 1 ? !expandedVideo.paused : wasPlaying;
    if (expandedVideo) {
      video.muted = expandedVideo.muted;
      video.volume = expandedVideo.volume;
      video.playbackRate = expandedVideo.playbackRate;
      expandedVideo.pause();
    }
    const closing = viewer;
    expanded = false;
    nativeEntered = false;
    const native = document.fullscreenElement || document.webkitFullscreenElement;
    if (native && closing?.contains(native)) {
      try {
        if (document.exitFullscreen) document.exitFullscreen()?.catch(() => {});
        else document.webkitExitFullscreen?.();
      } catch { /* O diálogo fecha mesmo quando a API nativa falha. */ }
    }
    if (closing?.open && closing.close) closing.close();
    closing?.remove();
    viewer = null; fullscreenTarget = null; expandedVideo = null;
    document.documentElement.classList.remove('connect-fallback-active');
    try { video.currentTime = position; } catch { /* Preserva o frame atual. */ }
    if (resume && !document.hidden) video.play()?.catch(() => {});
    syncButton();
    fullscreenButton?.focus({preventScroll:true});
  };
  const enterExpanded = () => {
    if (!frame || expanded) return;
    loadSources();
    const position = video.currentTime || 0;
    wasPlaying = !video.paused;
    viewer = document.createElement('dialog');
    viewer.className = 'to-media-dialog';
    viewer.setAttribute('aria-label', 'Vídeo Connect em tela cheia');
    const overlay = frame.cloneNode(true);
    fullscreenTarget = overlay;
    overlay.classList.add('is-connect-fullscreen-fallback');
    expandedVideo = overlay.querySelector('video');
    expandedVideo.autoplay = false;
    expandedVideo.muted = video.muted;
    expandedVideo.volume = video.volume;
    expandedVideo.playbackRate = video.playbackRate;
    const close = overlay.querySelector('[data-connect-fullscreen]');
    close.setAttribute('aria-label', 'Fechar tela cheia do vídeo Connect');
    close.setAttribute('aria-pressed', 'true');
    close.querySelector('.connect-fullscreen-label').textContent = 'Fechar · Esc';
    close.addEventListener('click', exitExpanded);
    viewer.addEventListener('cancel', event => { event.preventDefault(); exitExpanded(); });
    viewer.addEventListener('close', () => { if (expanded) exitExpanded(); });
    viewer.appendChild(overlay);
    document.body.appendChild(viewer);
    expanded = true;
    video.pause();
    document.documentElement.classList.add('connect-fallback-active');
    if (viewer.showModal) viewer.showModal();
    else viewer.setAttribute('open', '');
    const currentViewer = viewer;
    const seek = () => {
      if (viewer !== currentViewer) return;
      try { expandedVideo.currentTime = position; } catch { /* Aguarda metadados. */ }
    };
    if (expandedVideo.readyState >= 1) seek();
    else expandedVideo.addEventListener('loadedmetadata', seek, {once:true});
    if (wasPlaying) expandedVideo.play()?.catch(() => {});
    syncButton();
    close.focus({preventScroll:true});
    // A expansão já está visível; a API nativa não bloqueia o botão.
    try {
      if (fullscreenTarget.requestFullscreen) fullscreenTarget.requestFullscreen({navigationUI:'hide'})?.catch(() => {});
      else fullscreenTarget.webkitRequestFullscreen?.();
    } catch { /* O diálogo ocupa a janela quando a API nativa é recusada. */ }
  };
  fullscreenButton?.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation();
    if (expanded) exitExpanded(); else enterExpanded();
  });
  const fullscreenChanged = () => {
    const current = document.fullscreenElement || document.webkitFullscreenElement;
    if (expanded && current && viewer?.contains(current)) nativeEntered = true;
    else if (expanded && nativeEntered) {
      nativeEntered = false;
      if (document.hasFocus() && !document.hidden) exitExpanded();
    }
  };
  document.addEventListener('fullscreenchange', fullscreenChanged);
  document.addEventListener('webkitfullscreenchange', fullscreenChanged);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) { event.preventDefault(); exitExpanded(); }
  }, true);
  syncButton();

  video.muted = true; video.defaultMuted = true;
  const playIfVisible = () => {
    if (expanded || !inView || document.hidden || !video.paused) return;
    loadSources();
    video.play()?.catch(() => {});
  };
  const pauseIfHidden = () => { if (!video.paused) video.pause(); };
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === video);
      if (!entry) return;
      inView = entry.isIntersecting && entry.intersectionRatio >= .15;
      if (inView) playIfVisible(); else pauseIfHidden();
    }, {threshold:[0,.15,.5]});
    observer.observe(video);
  } else { inView = true; playIfVisible(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseIfHidden(); expandedVideo?.pause(); }
    else playIfVisible();
  });
  video.addEventListener('canplay', playIfVisible);
  window.addEventListener('pageshow', playIfVisible);
})();
