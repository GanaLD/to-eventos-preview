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
    let played=false;
    const playOnce=()=>{
      if (played) return;
      played=true;
      timeline.play(0);
    };
    const opts = {
      id, trigger:element, start, end,
      invalidateOnRefresh:true,
      onEnter:playOnce,
      onEnterBack:playOnce
    };
    if (containerAnimation) opts.containerAnimation=containerAnimation;
    const trigger=ST.create(opts);
    activeTriggers.push(trigger);
    // Fallback crucial: a user can scroll over a short trigger zone in one frame.
    // IntersectionObserver recognizes an actually visible section/panel without
    // hiding or restarting content when revisiting it.
    if ('IntersectionObserver' in window) {
      const io=new IntersectionObserver(entries=>{
        if (entries.some(entry=>entry.isIntersecting)){
          playOnce();
          io.disconnect();
        }
      },{threshold:0.05});
      io.observe(element);
    }
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
      gsap.set(groups,{y:24,autoAlpha:0});
      timeline.to(groups,{y:0,autoAlpha:1,duration:1.05,stagger:.14},0);
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
    gsap.set(groups,{y:30,autoAlpha:0});
    timeline.to(groups,{y:0,autoAlpha:1,duration:1.05,stagger:.17},0);
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
    const lines=[];
    for(const textNode of [...heading.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE)){
      if(!textNode.textContent.trim())continue;
      const wrapper=document.createElement('span');
      wrapper.className='to-v72-type-line';
      wrapper.setAttribute('aria-hidden','true');
      wrapper.textContent=textNode.textContent.trim();
      textNode.replaceWith(wrapper);
      lines.push(wrapper);
    }
    return lines;
  };

  if (cases) {
    const gray=cases.querySelector('.case-text:not(.case-text-contrast)');
    const dark=cases.querySelector('.case-text-contrast');
    const heading=gray?.querySelector('.case-text-main h3');
    const lines=splitAccessibleTitle(heading);
    if (gray && lines.length) {
      const kicker=gray.querySelector('.case-index');
      const desc=gray.querySelector('.case-text-main p');
      const footer=gray.querySelector('.case-text-foot');
      const darkGroups=dark?[...dark.querySelectorAll('.case-index, .case-text-main h3, .case-text-main p, .case-numbers')]:[];
      const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      gsap.set(lines,{clipPath:'inset(0 100% 0 0)'});
      const ancillary=[kicker,desc,footer,...darkGroups].filter(Boolean);
      gsap.set(ancillary,{y:14,autoAlpha:0});
      if (kicker) timeline.to(kicker,{y:0,autoAlpha:1,duration:.6},0);
      let titleEnd=.35;
      lines.forEach((line,i)=>{
        const duration=Math.max(.45,line.textContent.length*.055);
        timeline.to(line,{
          clipPath:'inset(0 0% 0 0)',
          duration,
          ease:'steps('+Math.max(2,Array.from(line.textContent).length)+')'
        },titleEnd);
        titleEnd+=duration+.1;
      });
      if (desc) timeline.to(desc,{y:0,autoAlpha:1,duration:.78},titleEnd+.05);
      if (footer) timeline.to(footer,{y:0,autoAlpha:1,duration:.65},titleEnd+.30);
      if (darkGroups.length) timeline.to(darkGroups,{
        y:0,autoAlpha:1,duration:.86,stagger:.14
      },.85);
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
    gsap.set(groups,{y:28,autoAlpha:0});
    timeline.to(groups,{y:0,autoAlpha:1,duration:1.05,stagger:.16},0);
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
