/* TO Eventos — HERO edge extension, responsive and synchronized with scroll-controlled MP4.
   Preserve the complete 16:9 video. Only the unused viewport strips are mirrored.
   Never scale/stretch the main video or clip the original title/logo. */
(() => {
  const film = document.querySelector('#hero .hero-film-screen');
  const video = film?.querySelector('[data-role="hero-film"]');
  const canvas = film?.querySelector('.hero-edge-canvas');
  if (!film || !video || !canvas) return;

  const ctx = canvas.getContext('2d', {alpha: false});
  if (!ctx) return;
  let requested = false;
  let lastSize = '';

  function draw() {
    requested = false;
    const cssWidth = film.clientWidth;
    const cssHeight = film.clientHeight;
    if (cssWidth < 1 || cssHeight < 1) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const pxWidth = Math.round(cssWidth * pixelRatio);
    const pxHeight = Math.round(cssHeight * pixelRatio);
    const size = pxWidth + 'x' + pxHeight;
    if (size !== lastSize) {
      canvas.width = pxWidth;
      canvas.height = pxHeight;
      lastSize = size;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = '#ff6108';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      canvas.dataset.frameRendered = 'false';
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const scale = Math.min(cssWidth / videoWidth, cssHeight / videoHeight);
    const displayWidth = videoWidth * scale;
    const displayHeight = videoHeight * scale;
    const blankX = Math.max(0, (cssWidth - displayWidth) / 2);
    const blankY = Math.max(0, (cssHeight - displayHeight) / 2);

    try {
      if (blankX > 0.5) {
        // A faixa da esquerda é o reflexo da borda esquerda do frame.
        // Na emenda a cor e o movimento correspondem ao pixel original.
        const sourceWidth = Math.min(videoWidth / 3, blankX / scale);
        ctx.save();
        ctx.translate(blankX, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, sourceWidth, videoHeight,
                      0, blankY, blankX, displayHeight);
        ctx.restore();

        // Mesmo princípio na borda direita; nenhuma região original é perdida.
        ctx.save();
        ctx.translate(cssWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, videoWidth - sourceWidth, 0, sourceWidth, videoHeight,
                      0, blankY, blankX, displayHeight);
        ctx.restore();
        canvas.dataset.bleedMode = 'sides';
      } else if (blankY > 0.5) {
        // Viewport mais alta (mobile/tablet): prolonga apenas as bordas verticais.
        const sourceHeight = Math.min(videoHeight / 3, blankY / scale);
        ctx.save();
        ctx.translate(0, blankY);
        ctx.scale(1, -1);
        ctx.drawImage(video, 0, 0, videoWidth, sourceHeight,
                      0, 0, displayWidth, blankY);
        ctx.restore();

        ctx.save();
        ctx.translate(0, cssHeight);
        ctx.scale(1, -1);
        ctx.drawImage(video, 0, videoHeight - sourceHeight, videoWidth, sourceHeight,
                      0, 0, displayWidth, blankY);
        ctx.restore();
        canvas.dataset.bleedMode = 'top-bottom';
      } else {
        canvas.dataset.bleedMode = 'none';
      }
      canvas.dataset.frameRendered = 'true';
    } catch {
      // If a browser has not decoded a seek yet, keep the original video intact.
      canvas.dataset.frameRendered = 'false';
    }
  }

  function scheduleDraw() {
    if (requested) return;
    requested = true;
    window.requestAnimationFrame(draw);
  }

  video.addEventListener('loadeddata', scheduleDraw);
  video.addEventListener('seeked', scheduleDraw);
  video.addEventListener('resize', scheduleDraw);
  window.addEventListener('resize', scheduleDraw, {passive: true});

  let resizeObserver;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(film);
  }
  // The video is paused during GSAP scrub; seeked redraws the lateral
  // extensions at the same video.currentTime as the full foreground frame.
  if (video.readyState >= 2) scheduleDraw();
  window.addEventListener('pagehide', () => {
    resizeObserver?.disconnect();
    window.removeEventListener('resize', scheduleDraw);
  }, {once: true});
})();