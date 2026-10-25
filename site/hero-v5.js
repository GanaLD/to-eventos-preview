/* TO EVENTOS — HERO V5. O vídeo é o PRIMEIRO conteúdo; textos só após a conclusão.
   Não altera a passagem papoulas → competências nem o trilho horizontal dos projetos. */
(() => {
  const stage = document.querySelector('.hero-scroll-stage');
  const hero = document.getElementById('hero');
  const film = hero?.querySelector('.hero-film-screen');
  const video = hero?.querySelector('[data-role="hero-film"]');
  const title = hero?.querySelector('#hero-heading');
  const destination = hero?.querySelector('.hero-visual');
  const copy = [...(hero?.querySelector('.hero-copy')?.children ?? [])];
  const foot = hero?.querySelector('.hero-foot');
  // Reuse the single scroll indicator authored in index.html.
  const cue = hero?.querySelector('.to-hero-scroll-cue');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!stage || !hero || !film || !video || !destination) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !gsap || !ScrollTrigger) {
    stage.classList.add('is-static-hero');
    destination.appendChild(video);
    video.controls = true;
    video.removeAttribute('aria-hidden');
    video.removeAttribute('tabindex');
    film.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  stage.classList.add('is-motion-hero');
  const videoPhaseEnd = 0.7;
  const revealStart = 85;
  let duration = 10;
  let wantedTime = 0;
  let raf = 0;

  video.muted = true;
  video.pause();
  video.preload = 'auto';
  if (video.readyState >= 1 && Number.isFinite(video.duration)) duration = video.duration;
  video.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(video.duration) && video.duration > 0) duration = video.duration;
    scheduleSeek(wantedTime);
  });

  function scheduleSeek(time) {
    wantedTime = Math.max(0, Math.min(duration - .015, time));
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (video.readyState < 1 || video.seeking) return;
      if (Math.abs(video.currentTime - wantedTime) > 1 / 28) {
        try { video.currentTime = wantedTime; } catch { /* metadata may still load */ }
      }
    });
  }
  video.addEventListener('seeked', () => {
    if (Math.abs(video.currentTime - wantedTime) > 1 / 28) scheduleSeek(wantedTime);
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.set(copy, {y: 60, opacity: 0});
    gsap.set(foot, {opacity: 0});
    gsap.set(film, {top: 0, left: 0, width: '100%', height: '100%', opacity: 1});

    const slot = () => {
      const outer = hero.getBoundingClientRect();
      const rect = destination.getBoundingClientRect();
      return {
        left: rect.left - outer.left,
        top: rect.top - outer.top,
        width: rect.width,
        height: rect.height
      };
    };
    const proxy = {hold: 0};
    const timeline = gsap.timeline({paused: true, defaults: {ease: 'none'}});
    timeline.to(proxy, {hold: 1, duration: 70}, 0);
    timeline.to(film, {
      left: () => slot().left, top: () => slot().top,
      width: () => slot().width, height: () => slot().height,
      duration: 14, ease: 'power2.inOut', borderWidth: 1
    }, 70);
    timeline.to(copy, {y: 0, opacity: 1, duration: 11, stagger: 1.1, ease: 'power2.out'}, revealStart);
    if (title) {
      const steps = Math.max(12, Math.min(42, [...title.textContent.trim()].length));
      gsap.set(title, {clipPath: 'inset(0 100% 0 0)'});
      timeline.to(title, {clipPath: 'inset(0 0% 0 0)', duration: 8, ease: 'steps(' + steps + ')'}, revealStart);
    }
    timeline.to(foot, {opacity: 1, duration: 7}, 91);

    const trigger = ScrollTrigger.create({
      id: 'to-hero-film-and-copy',
      trigger: stage,
      start: 'top top',
      end: () => '+=' + Math.round(innerHeight * 3.3),
      scrub: .3,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 8,
      onUpdate: self => {
        timeline.progress(self.progress);
        // O vídeo só muda de 'cover' para 'contain' quando o quadro 16:9 está formado.
        stage.classList.toggle('is-hero-framed', self.progress >= .84);
        if (cue) { cue.style.opacity = String(Math.max(0, 1 - self.progress/.075)); cue.style.visibility = self.progress > .075 ? 'hidden' : 'visible'; }
        scheduleSeek(Math.min(1, self.progress / videoPhaseEnd) * (duration - .015));
      }
    });

    return () => {
      trigger.kill();
      timeline.kill();
      stage.classList.remove('is-hero-framed');
      gsap.set([...copy, foot, film], {clearProps: 'all'});
    };
  });

  mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.set(copy, {y: 44, opacity: 0});
    gsap.set(foot, {opacity: 0});
    gsap.set(film, {top: 0, left: 0, width: '100%', height: '100%', opacity: 1, visibility: 'visible'});

    // Mesmo enquadramento que o desktop: o vídeo termina em seu card,
    // sem fade e sem alterar a proporção da arte original.
    const slot = () => {
      const outer = hero.getBoundingClientRect();
      const rect = destination.getBoundingClientRect();
      return {
        left: rect.left - outer.left,
        top: rect.top - outer.top,
        width: rect.width,
        height: rect.height
      };
    };
    const proxy = {hold: 0};
    const timeline = gsap.timeline({paused: true, defaults: {ease: 'none'}});
    timeline.to(proxy, {hold: 1, duration: 70}, 0);
    timeline.to(film, {
      left: () => slot().left,
      top: () => slot().top,
      width: () => slot().width,
      height: () => slot().height,
      duration: 14,
      ease: 'power2.inOut',
      borderWidth: 1
    }, 70);
    timeline.to(copy, {y: 0, opacity: 1, duration: 11, stagger: 1.1, ease: 'power2.out'}, revealStart);
    if (title) {
      const steps = Math.max(12, Math.min(42, [...title.textContent.trim()].length));
      gsap.set(title, {clipPath: 'inset(0 100% 0 0)'});
      timeline.to(title, {clipPath: 'inset(0 0% 0 0)', duration: 8, ease: 'steps(' + steps + ')'}, revealStart);
    }
    timeline.to(foot, {opacity: 1, duration: 7}, 91);

    const trigger = ScrollTrigger.create({
      id: 'to-hero-mobile-film-and-copy',
      trigger: stage, start: 'top top',
      end: () => '+=' + Math.round(innerHeight * 1.9),
      scrub: .3, pin: true, pinSpacing: true,
      invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 8,
      onUpdate: self => {
        timeline.progress(self.progress);
        stage.classList.toggle('is-hero-framed', self.progress >= .84);
        if (cue) { cue.style.opacity = String(Math.max(0, 1 - self.progress/.075)); cue.style.visibility = self.progress > .075 ? 'hidden' : 'visible'; }
        scheduleSeek(Math.min(1, self.progress / videoPhaseEnd) * (duration - .015));
      }
    });
    return () => {
      trigger.kill();
      timeline.kill();
      stage.classList.remove('is-hero-framed');
      gsap.set([...copy, foot, film], {clearProps: 'all'});
    };
  });

  const sync = () => ScrollTrigger.refresh();
  document.fonts?.ready?.then(sync).catch(() => {});
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), {once:true});
})();
