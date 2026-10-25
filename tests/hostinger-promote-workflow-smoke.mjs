import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync(new URL('../.github/workflows/hostinger-promote.yml', import.meta.url), 'utf8');
const production = workflow.slice(workflow.indexOf('      - name: Copy the approved site into the production branch'));
const stashHero = production.indexOf('cp site/assets/media/motion-hero.mp4 "$generated_assets/"');
const stashFlowers = production.indexOf('cp site/assets/media/animacao-papoulas-fundo-infinito-v77.mp4 "$generated_assets/"');
const cleanup = production.indexOf('rm -f site/assets/media/motion-hero.mp4');
const checkout = production.indexOf('git checkout -B hostinger-production');
const archive = production.indexOf('git archive "${source_sha}:site" | tar -x');
const restoreHero = production.indexOf('cp "$generated_assets/motion-hero.mp4" assets/media/');
const restoreFlowers = production.indexOf('cp "$generated_assets/animacao-papoulas-fundo-infinito-v77.mp4" assets/media/');
const push = production.indexOf('git push origin HEAD:hostinger-production');

assert(stashHero >= 0 && stashFlowers > stashHero, 'Preservar os vídeos gerados antes da troca de branch');
assert(cleanup > stashFlowers && cleanup < checkout, 'Limpar cópias temporárias antes do checkout da produção');
assert(production.slice(cleanup, checkout).includes('site/assets/media/animacao-papoulas-fundo-infinito-v77.mp4'),
  'Limpar os dois arquivos gerados que bloqueiam a troca de árvore');
assert(checkout < archive && archive < restoreHero && restoreHero < restoreFlowers && restoreFlowers < push,
  'Montar a branch de produção, restaurar os vídeos e enviar a branch');
console.log('PASS: promoção preserva os vídeos gerados e troca para a branch de produção sem conflito');
