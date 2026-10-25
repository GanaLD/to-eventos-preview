import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const html=read('site/index.html');
const css=read('site/mobile-v9.css');
const hero=read('site/hero-v5.js');

assert(existsSync(new URL('../site/assets/media/motion-hero-mobile.mp4',import.meta.url)), 'Asset portrait deve existir fisicamente no site publicado');
assert(/<source\s+[^>]*media="\(max-width: 899px\) and \(orientation: portrait\)"[^>]*src="assets\/media\/motion-hero-mobile\.mp4"/.test(html),
  'Versão 9:16 DEVE ser o primeiro source selecionado no mobile (não só criada na branch)');
assert(/@media\s*\(max-width:\s*899px\)\s*and\s*\(orientation:\s*portrait\)/.test(css),
  'Mobile portrait precisa de composição própria');
assert(/\.hero-scroll-stage \.hero-film-screen video\s*\{[^}]*object-fit:\s*cover/s.test(css),
  'Vídeo vertical real deve preencher o HeroScroll ao longo de toda a tela');
assert(/\.hero-scroll-stage\.is-hero-framed \.hero-film-screen video\s*\{[^}]*object-fit:\s*contain/s.test(css),
  'No fechamento manter o vídeo integral');
assert(hero.includes('to-hero-mobile-film-and-copy'),'Scrub mobile deve existir');
assert(hero.includes('scheduleSeek(Math.min(1, self.progress / videoPhaseEnd)'),'Scroll precisa dirigir o tempo do vídeo');
console.log('PASS: HeroScroll 9:16 selecionado e fullscreen no mobile');
