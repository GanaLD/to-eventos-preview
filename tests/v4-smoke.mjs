import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const style=readFileSync(new URL('../site/ui-v4.css',import.meta.url),'utf8');
const script=readFileSync(new URL('../site/ui-v4.js',import.meta.url),'utf8');
assert(!/[↗→↓↑]/.test(html), 'Setas decorativas não devem estar presentes');
assert(!/class="(section-number|solution-num|hero-counter)"/.test(html), 'Seções não devem exibir numeração decorativa');
assert(html.includes('ui-v4.css')&&html.includes('ui-v4.js'), 'Recursos V4 devem ser carregados');
assert(html.includes('aria-label="Conversar com a TO Eventos pelo WhatsApp"'), 'Cabeçalho deve ter botão WhatsApp acessível');
assert(html.includes('class="to-whatsapp-float"'), 'Botão flutuante WhatsApp deve existir');
assert(html.includes('https://wa.me/5567998532167'), 'WhatsApp deve ter telefone oficial TO Eventos');
assert(!html.includes('wa.me/5541999999937'), 'Nunca utilizar telefone da Mensagem Studio');
for(const id of ['hero','sobre','solucoes','projetos','contato']){
 assert(html.includes('id="'+id+'"'),'Falta seção '+id);
 assert(html.includes('data-section="'+id+'"'),'Falta âncora lateral '+id);
}
assert(html.includes('300 PARTICIPANTES'), 'Métrica real de case deve ser preservada');
assert(/papoulas-(preview\.webp|original\.png)/.test(html),'Arte original deve continuar no layout');
assert(html.includes('apresentacao-completa.mp4'), 'Apresentação original deve continuar no layout');
assert(style.includes('.hero-title{font-size:clamp'), 'HERO deve ter escala tipográfica responsiva');
assert(style.includes('grid-template-columns:minmax(0,1.03fr) minmax(0,1fr)'), 'HERO deve manter colunas independentes');
assert(style.includes('--to-rail:#FF4D00'), 'Cor do progresso lateral deve ser laranja TO');
assert(script.includes('window.ScrollTrigger?.refresh()'), 'Navegação precisa sincronizar com GSAP');
assert(script.includes('aria-current'), 'Navegação precisa identificar seção ativa');
console.log('TO Eventos V4 — testes de regressão estrutural aprovados');
