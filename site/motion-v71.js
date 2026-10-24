/* TO Eventos V7.1 — motions editoriais sem alterar o HERO ou o pin dos projetos.
   Uma fonte de verdade: GSAP já carregado pelo site. Sem novos pins. */
(() => {
  'use strict';
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (!gsap || !ST || reduced) return;
  gsap.registerPlugin(ST);

  const activeTriggers = [];
  const createEnterTrigger = ({id,element,timeline,start='top 82%',end='bottom 18%',containerAnimation}) => {
    if (!element || !timeline) return null;
    const opts = {
      id, trigger:element, start, end,
      invalidateOnRefresh:true,
      onEnter:()=>timeline.restart(),
      onEnterBack:()=>timeline.restart()
    };
    if (containerAnimation) opts.containerAnimation=containerAnimation;
    const trigger=ST.create(opts);
    activeTriggers.push(trigger);
    return trigger;
  };

  // SESSÃO COMPETÊNCIAS — o texto revela junto às flores, sem alterar o seu GSAP lateral.
  const solutions=document.getElementById('solucoes');
  if (solutions) {
    const kicker=solutions.querySelector('.section-kicker');
    const title=solutions.querySelector('.solutions-title');
    const fields=[...solutions.querySelectorAll('.solution h3, .solution p')];
    const groups=[kicker,title,...fields].filter(Boolean);
    if (groups.length) {
      const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      timeline.fromTo(groups,{y:30,autoAlpha:0},
        {y:0,autoAlpha:1,duration:.93,stagger:.125,immediateRender:false},0);
      createEnterTrigger({
        id:'to-v71-solutions',element:solutions,timeline,
        start:'top 78%',end:'bottom 16%'
      });
    }
  }

  // Os projetos deslizam horizontalmente no desktop. Usa o movimento já criado
  // em main.js como containerAnimation, evitando ScrollTriggers verticais precoces.
  const projects=document.getElementById('projetos');
  const summit=projects?.querySelector('.project-panel-summit');
  const cases=projects?.querySelector('.project-panel-cases');
  const gallery=ST.getAll().find(t=>t.trigger===projects && t.animation);
  const horizontal=window.matchMedia('(min-width:900px)').matches && !!gallery?.animation;
  const sharedContainer=horizontal?gallery.animation:null;
  const bindPanel=(id,element,timeline)=>{
    createEnterTrigger({
      id,element,timeline,
      start:horizontal?'left 86%':'top 84%',
      end:horizontal?'right 12%':'bottom 12%',
      containerAnimation:sharedContainer
    });
  };

  if (summit) {
    const kicker=summit.querySelector('.section-kicker');
    const headline=summit.querySelector('#projetos-heading');
    const description=summit.querySelector('.projects-top > p');
    const captions=[...summit.querySelectorAll('.case-caption > span, .case-caption h3, .case-caption p, .case-caption strong')];
    // Exclusão expressa da mídia Connect para evitar escala/corte do vídeo.
    const groups=[kicker,headline,description,...captions].filter(Boolean);
    const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    timeline.fromTo(groups,{y:35,autoAlpha:0},
      {y:0,autoAlpha:1,duration:.98,stagger:.15,immediateRender:false},0);
    bindPanel('to-v71-projects',summit,timeline);
  }

  // Digitação do card cinza, mantendo dimensões e todo o texto original no DOM.
  // O título continua com o nome acessível, sem leitura letra a letra.
  const splitAccessibleTitle = heading => {
    if (!heading) return [];
    const accessibleName=[...heading.childNodes].map(node =>
      node.nodeName==='BR'?' ':node.textContent).join('').replace(/\s+/g,' ').trim();
    if (!accessibleName) return [];
    heading.setAttribute('aria-label',accessibleName);
    const chars=[];
    const textNodes=[...heading.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE);
    for (const textNode of textNodes) {
      const fragment=document.createDocumentFragment();
      const parts=textNode.textContent.split(/(\s+)/u);
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/u.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          continue;
        }
        const word=document.createElement('span');
        word.className='to-v71-type-word';
        word.setAttribute('aria-hidden','true');
        for (const char of Array.from(part)) {
          const letter=document.createElement('span');
          letter.className='to-v71-type-char';
          letter.textContent=char;
          word.appendChild(letter);
          chars.push(letter);
        }
        fragment.appendChild(word);
      }
      textNode.replaceWith(fragment);
    }
    return chars;
  };

  if (cases) {
    const gray=cases.querySelector('.case-text:not(.case-text-contrast)');
    const dark=cases.querySelector('.case-text-contrast');
    const heading=gray?.querySelector('.case-text-main h3');
    const chars=splitAccessibleTitle(heading);
    if (gray && chars.length) {
      const kicker=gray.querySelector('.case-index');
      const desc=gray.querySelector('.case-text-main p');
      const footer=gray.querySelector('.case-text-foot');
      const darkGroups=dark?[...dark.querySelectorAll('.case-index, .case-text-main h3, .case-text-main p, .case-numbers')]:[];
      const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      if (kicker) timeline.fromTo(kicker,{y:14,autoAlpha:0},
        {y:0,autoAlpha:1,duration:.5,immediateRender:false},0);
      timeline.fromTo(chars,{opacity:0},{opacity:1,duration:.02,stagger:.037,
        ease:'none',immediateRender:false},.35);
      const titleEnd=.35+chars.length*.037;
      if (desc) timeline.fromTo(desc,{y:18,autoAlpha:0},
        {y:0,autoAlpha:1,duration:.65,immediateRender:false},titleEnd+.15);
      if (footer) timeline.fromTo(footer,{y:12,autoAlpha:0},
        {y:0,autoAlpha:1,duration:.55,immediateRender:false},titleEnd+.48);
      if (darkGroups.length) timeline.fromTo(darkGroups,{y:22,autoAlpha:0},
        {y:0,autoAlpha:1,duration:.75,stagger:.14,immediateRender:false},.8);
      bindPanel('to-v71-cases',cases,timeline);
    }
  }

  // CONTATO — sequência do título ao rodapé; CTA e dados permanecem clicáveis.
  const contact=document.getElementById('contato');
  if (contact) {
    const lead=contact.querySelector('.contact-grid > div:first-child');
    const heading=lead?.querySelector('#contato-heading');
    const paragraph=lead?.querySelector('p');
    const cta=lead?.querySelector('.button-accent');
    const aside=[...contact.querySelectorAll('.contact-aside > *')];
    const foot=[...contact.querySelectorAll('.footer > *')];
    const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    const groups=[heading,paragraph,cta,...aside,...foot].filter(Boolean);
    timeline.fromTo(groups,{y:32,autoAlpha:0},
      {y:0,autoAlpha:1,duration:.95,stagger:.16,immediateRender:false},0);
    createEnterTrigger({
      id:'to-v71-contact',element:contact,timeline,
      start:'top 80%',end:'bottom 10%'
    });
  }

  // Fonte disponível, âncoras e scroll reverso sempre recalculam o layout real.
  document.fonts?.ready?.then(()=>ST.refresh()).catch(()=>{});
  window.addEventListener('pagehide',()=>{
    activeTriggers.forEach(t=>t.kill());
  },{once:true});
})();
