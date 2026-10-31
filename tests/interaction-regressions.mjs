import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Exercises the actual pinned projects and hero on a range-capable server.
const base = process.env.TO_PREVIEW_URL || 'http://127.0.0.1:8765/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const failures = [];

async function scenario(name, action) {
  if (process.env.TO_TEST_FILTER && !name.includes(process.env.TO_TEST_FILTER)) return;
  try { await action(); console.log('PASS', name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL', name, error.message); }
}
async function open(page, hash = '', { blockPdf = false } = {}) {
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/**', route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    if (blockPdf && name === 'pdf.min.js') return route.abort();
    if (['gsap.min.js','ScrollTrigger.min.js','pdf.min.js','pdf.worker.min.js'].includes(name)) {
      return route.fulfill({ path: fileURLToPath(new URL('../site/vendor/' + name, import.meta.url)), contentType: 'application/javascript' });
    }
    return route.continue();
  });
  await page.goto(new URL(hash || './', base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.ScrollTrigger?.getAll().some(t => t.trigger?.id === 'projetos'), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
}
async function projectPosition(page, end = false) {
  await page.evaluate(end => {
    const t = ScrollTrigger.getAll().find(item => item.trigger?.id === 'projetos');
    scrollTo({ top: end ? t.end - 10 : t.start + 20, behavior: 'instant' });
  }, end);
  await page.waitForTimeout(1800);
}

async function checkConnect(viewport, fallback) {
  const page = await browser.newPage({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
  try {
    if (fallback) await page.addInitScript(() => {
      Element.prototype.requestFullscreen = undefined;
      Element.prototype.webkitRequestFullscreen = undefined;
      HTMLVideoElement.prototype.webkitEnterFullscreen = undefined;
    });
    await open(page); await projectPosition(page);
    if (fallback) {
      await page.waitForFunction(() => document.querySelector('.case-featured video').readyState >= 1, null, { timeout: 20000 });
      await page.locator('.case-featured video').evaluate(async video => { video.muted = true; video.currentTime = 10; await video.play(); });
    }
    const before = await page.evaluate(() => {
      window.__connectOriginal = document.querySelector('.case-featured video');
      return { y: scrollY };
    });
    await page.locator('[data-connect-fullscreen]').click();
    await page.waitForTimeout(1200);
    const result = await page.evaluate(() => {
      const frame = document.querySelector('.case-featured .case-image');
      const overlay = document.querySelector('body > .is-connect-fullscreen-fallback');
      const active = document.fullscreenElement === frame || !!overlay;
      const r = (overlay || frame).getBoundingClientRect();
      return { active, overlay: !!overlay, pressed: frame.querySelector('button').getAttribute('aria-pressed'), width: r.width, height: r.height, viewport: [innerWidth, innerHeight], y: scrollY };
    });
    assert(result.active && result.pressed === 'true', JSON.stringify(result));
    assert.equal(result.overlay, fallback, JSON.stringify(result));
    assert(result.width >= result.viewport[0] - 2 && result.height >= result.viewport[1] - 2, JSON.stringify(result));
    assert(Math.abs(result.y - before.y) < 5, JSON.stringify({ before, result }));
    if (fallback) {
      await page.waitForFunction(() => {
        const video = document.querySelector('body > .is-connect-fullscreen-fallback video');
        return video && video.readyState >= 2 && !video.paused && video.currentTime >= 9.5;
      }, null, { timeout: 15000 });
    }
    const close = fallback ? page.locator('body > .is-connect-fullscreen-fallback [data-connect-fullscreen]') : page.locator('[data-connect-fullscreen]');
    await close.click();
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => !!document.fullscreenElement || !!document.querySelector('.is-connect-fullscreen-fallback')), false);
    assert(await page.evaluate(() => document.querySelector('.case-featured video') === window.__connectOriginal));
    if (fallback) assert(await page.evaluate(() => { const video = document.querySelector('.case-featured video'); return video.currentTime >= 9.5 && !video.paused; }), 'Connect did not resume at the same point');
    assert(Math.abs(await page.evaluate(() => scrollY) - before.y) < 5, 'Connect changed scroll position');
  } finally { await page.close(); }
}

async function checkPdf(viewport, fallback) {
  const page = await browser.newPage({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
  try {
    if (fallback) {
      await page.addInitScript(() => {
        Element.prototype.requestFullscreen = undefined;
        Element.prototype.webkitRequestFullscreen = undefined;
        HTMLElement.prototype.showPopover = undefined;
      });
    }
    await open(page, '', { blockPdf: fallback }); await projectPosition(page, true);
    await page.locator('#to-pdf-showcase.is-ready').waitFor({ timeout: 30000 });
    await page.locator('#to-pdf-showcase [data-pdf-action="next"]').click();
    await page.waitForFunction(() => document.querySelector('#to-pdf-showcase output').textContent.startsWith('02'));
    await page.waitForTimeout(1000);
    const before = await page.evaluate(() => {
      const x = document.querySelector('#to-pdf-showcase');
      const frame = x.querySelector('iframe');
      window.__pdfOriginal = frame;
      window.__pdfLoads = 0;
      frame.addEventListener('load', () => window.__pdfLoads++);
      return { y: scrollY, counter: x.querySelector('output').textContent, navigation: performance.getEntriesByType('navigation').length };
    });
    await page.locator('#to-pdf-showcase [data-pdf-action="fullscreen"]').click();
    await page.waitForTimeout(500);
    const openState = await page.evaluate(() => {
      const original = document.querySelector('#to-pdf-showcase');
      const copy = document.querySelector('body > .to-pdf-showcase.is-fullscreen-fallback');
      const active = document.fullscreenElement === original || !!copy;
      const r = (copy || original).getBoundingClientRect();
      return { active, copy: !!copy, width: r.width, height: r.height, viewport: [innerWidth, innerHeight] };
    });
    assert(openState.active && openState.copy === fallback, JSON.stringify(openState));
    assert(openState.width >= openState.viewport[0] - 2 && openState.height >= openState.viewport[1] - 2, JSON.stringify(openState));
    const exit = fallback ? page.locator('body > .to-pdf-showcase.is-fullscreen-fallback [data-pdf-action="exit-fullscreen"]') : page.locator('#to-pdf-showcase [data-pdf-action="exit-fullscreen"]');
    await exit.click(); await page.waitForTimeout(1000);
    const after = await page.evaluate(() => {
      const x = document.querySelector('#to-pdf-showcase');
      return { y: scrollY, counter: x.querySelector('output').textContent, navigation: performance.getEntriesByType('navigation').length, sameFrame: x.querySelector('iframe') === window.__pdfOriginal, loads: window.__pdfLoads };
    });
    assert(Math.abs(after.y - before.y) < 5, 'PDF changed scroll position: ' + JSON.stringify({ before, after }));
    assert.equal(after.counter, before.counter, 'PDF page changed');
    assert.equal(after.navigation, before.navigation, 'Page navigated');
    assert(after.sameFrame && after.loads === 0, 'Original PDF iframe reloaded: ' + JSON.stringify(after));
  } finally { await page.close(); }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  await scenario('Connect native fullscreen at ' + viewport.width, () => checkConnect(viewport, false));
  await scenario('Connect fallback fullscreen at ' + viewport.width, () => checkConnect(viewport, true));
  await scenario('PDF preserves page and position at ' + viewport.width, () => checkPdf(viewport, false));
  await scenario('PDF fallback keeps its original iframe at ' + viewport.width, () => checkPdf(viewport, true));
  await scenario('Hero returns from a direct #contato visit at ' + viewport.width, async () => {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
    try {
      await open(page, '#contato'); await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => location.hash), '#contato');
      assert(await page.evaluate(() => scrollY > innerHeight), 'Direct contact link did not reach the contact section');
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(800);
      const result = await page.evaluate(() => {
        const trigger = ScrollTrigger.getById('to-hero-film-and-copy') || ScrollTrigger.getById('to-hero-mobile-film-and-copy');
        const stage = document.querySelector('.hero-scroll-stage');
        const film = document.querySelector('.hero-film-screen');
        const r = film.getBoundingClientRect();
        return { y: scrollY, start: trigger.start, progress: trigger.progress, stageTop: stage.getBoundingClientRect().top, film: { x: r.x, y: r.y, width: r.width, height: r.height }, viewport: [innerWidth, innerHeight] };
      });
      assert(Math.abs(result.start) <= 1 && result.progress < 0.01 && Math.abs(result.stageTop) < 2, JSON.stringify(result));
      assert(result.film.width >= result.viewport[0] - 2 && result.film.height >= result.viewport[1] - 2, JSON.stringify(result));
      await page.waitForFunction(() => document.querySelector('[data-role="hero-film"]').readyState >= 1, null, { timeout: 20000 });
      const sample = async fraction => {
        await page.evaluate(fraction => {
          const t = ScrollTrigger.getById('to-hero-film-and-copy') || ScrollTrigger.getById('to-hero-mobile-film-and-copy');
          scrollTo({ top: t.start + (t.end - t.start) * fraction, behavior: 'instant' });
        }, fraction);
        await page.waitForFunction(() => {
          const t = ScrollTrigger.getById('to-hero-film-and-copy') || ScrollTrigger.getById('to-hero-mobile-film-and-copy');
          const video = document.querySelector('[data-role="hero-film"]');
          const expected = Math.min(1, t.progress / .7) * (video.duration - .015);
          return video.readyState >= 2 && !video.seeking && Number.isFinite(expected) && Math.abs(video.currentTime - expected) < .5;
        }, null, { timeout: 15000 });
        return page.evaluate(() => {
          const t = ScrollTrigger.getById('to-hero-film-and-copy') || ScrollTrigger.getById('to-hero-mobile-film-and-copy');
          const stage = document.querySelector('.hero-scroll-stage');
          const film = document.querySelector('.hero-film-screen').getBoundingClientRect();
          const video = document.querySelector('[data-role="hero-film"]');
          return { progress: t.progress, top: stage.getBoundingClientRect().top, width: film.width, height: film.height, time: video.currentTime, duration: video.duration };
        });
      };
      const forward = await sample(.65), reverse = await sample(.2);
      assert(Math.abs(reverse.top) < 2 && reverse.width >= viewport.width - 2 && reverse.height >= viewport.height - 2, JSON.stringify(reverse));
      assert(forward.time > reverse.time + 2, 'Video did not follow the reverse scroll: ' + JSON.stringify({ forward, reverse }));
    } finally { await page.close(); }
  });
}

await browser.close();
if (failures.length) { console.error('\n' + failures.join('\n')); process.exitCode = 1; }
