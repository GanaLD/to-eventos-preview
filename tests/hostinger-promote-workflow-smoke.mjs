import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync(new URL('../.github/workflows/hostinger-promote.yml', import.meta.url), 'utf8');
const production = workflow.slice(workflow.indexOf('      - name: Copy the approved site into the production branch'));
const stashHero = production.indexOf('cp site/assets/media/motion-hero.mp4 "$generated_assets/"');
const cleanup = production.indexOf('rm -f site/assets/media/motion-hero.mp4');
const checkout = production.indexOf('git checkout -B hostinger-production');
const archive = production.indexOf('git archive "${source_sha}:site" | tar -x');
const restoreHero = production.indexOf('cp "$generated_assets/motion-hero.mp4" assets/media/');
const push = production.indexOf('git push origin HEAD:hostinger-production');

assert(stashHero >= 0, 'Preservar o vídeo gerado do Hero antes da troca de branch');
assert(cleanup > stashHero && cleanup < checkout, 'Limpar a cópia temporária antes do checkout da produção');
assert(checkout < archive && archive < restoreHero && restoreHero < push,
  'Montar a branch de produção, restaurar o vídeo do Hero e enviar o site completo');
assert(production.includes('git archive "${source_sha}:site" | tar -x'), 'Incluir o vídeo original novo das papoulas no site de produção');
console.log('PASS: promoção inclui o vídeo original no site de produção sem transformar as pétalas');
