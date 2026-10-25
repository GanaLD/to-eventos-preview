/* TO Eventos V7.3 — motion legível, deliberado e sem piscadas.
   Sobre: entradas lentas; Competências e card CINZA: digitação;
   Projetos e Contato: revelação suave. O HERO e PDF não são modificados. */
(() => {
  'use strict';
  const gsap=window.gsap, ST=window.ScrollTrigger;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!gsap || !ST || reduced) return;
  gsap.registerPlugin(ST);

  const triggers=[], observers=[];
  const seen=new WeakSet();
  function onceTrigger(id,element,animate,config={}) {
    if(!element || !animate) return;
    let played=false;
    function playOnce() {
      if (played) return;
      played=true;
      seen.add(element);
      element.dataset.toMotionPlayed='yes';
      animate();
    }
    const options={
      id,trigger:element,
      start:config.containerAnimation?'left 88%':'top 86%',
      end:config.containerAnimation?'right 8%':'bottom 12%',
      onEnter:playOnce,onEnterBack:playOnce,
      invalidateOnRefresh:true
    };
    if(config.containerAnimation)options.containerAnimation=config.containerAnimation;
    const trigger=ST.create(options);
    triggers.push(trigger);
    if('IntersectionObserver' in window) {
      const io=new IntersectionObserver(entries=>{
        if(entries.some(e=>e.isIntersecting)){
          playOnce();
          io.disconnect();
        }
      },{threshold:.18});
      io.observe(element);observers.push(io);
    }
    // Handles hash links and browser restoring scroll into the middle of a section.
    requestAnimationFrame(()=>{
      const bounds=element.getBoundingClientRect();
      if(bounds.top<innerHeight*.86 && bounds.bottom>innerHeight*.12)playOnce();
    });
    return trigger;
  }

  function reveal(groups,opts={}) {
    const nodes=groups.filter(Boolean);
    if(!nodes.length)return null;
    gsap.set(nodes,{y:opts.offset??35,autoAlpha:0});
    const tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
    tl.to(nodes,{y:0,autoAlpha:1,duration:opts.duration??1.25,
      stagger:opts.stagger??.22,overwrite:'auto'},0);
    return tl;
  }

  // Rebuild a typing effect that never changes box dimensions, wraps by words,
  // never replaces text with flashing opacity chars, and keeps accessible copy.
  function prepareWords(heading,mode) {
    if(!heading)return [];
    const original=[...heading.childNodes].map(node=>
      node.nodeName==='BR'?' ':node.textContent).join('').replace(/\s+/gu,' ').trim();
    heading.setAttribute('aria-label',original);
    const wrapped=[];
    for(const node of [...heading.childNodes]) {
      if(node.nodeType!==Node.TEXT_NODE)continue;
      const fragment=document.createDocumentFragment();
      const pieces=node.textContent.split(/(\s+)/u);
      for(const word of pieces){
        if(!word)continue;
        if(/^\s+$/u.test(word)){fragment.appendChild(document.createTextNode(word));continue;}
        const span=document.createElement('span');
        span.className=mode==='gray'?'to-v72-type-line to-v73-typed':'to-v73-typed to-v73-typed-word';
        span.textContent=word;
        span.setAttribute('aria-hidden','true');
        span.dataset.letters=String([...word].length);
        fragment.appendChild(span);
        wrapped.push(span);
      }
      node.replaceWith(fragment);
    }
    gsap.set(wrapped,{clipPath:'inset(0 100% 0 0)'});
    heading.dataset.typeTarget=mode;
    return wrapped;
  }

  function typeWords(timeline,words,at=0,msPerChar=.08) {
    let playhead=at;
    words.forEach(word=>{
      const count=Number(word.dataset.letters)||1;
      const seconds=Math.max(.26,count*msPerChar);
      timeline.to(word,{
        clipPath:'inset(0 0% 0 0)',
        duration:seconds,
        ease:'steps('+Math.max(2,count)+')',
        overwrite:'auto'
      },playhead);
      playhead+=seconds+.085;
    });
    return playhead;
  }

  // 1 — SOBRE: animação perceptível de cerca de 5 segundos, sempre uma vez.
  const about=document.getElementById('sobre');
  const video=about?.querySelector('.about-floral-video');
  const copy=about?.querySelector('.about-copy');
  const aboutCopy=copy?[
    copy.querySelector('.overline'),
    copy.querySelector('#sobre-heading'),
    copy.querySelector('.intro'),
    [...copy.children].find(node=>node.tagName==='P'&&!node.matches('.overline,.intro')),
    copy.querySelector('.microproof')
  ].filter(Boolean):[];
  if(about && video && aboutCopy.length) {
    const tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
    gsap.set(aboutCopy,{y:66,autoAlpha:0});
    gsap.set(video,{y:20,autoAlpha:0});
    aboutCopy.forEach((node,i)=>{
      tl.to(node,{y:0,autoAlpha:1,duration:2.1,overwrite:'auto'},i*.66);
    });
    tl.to(video,{y:0,autoAlpha:1,duration:2.2},.36);
    onceTrigger('to-v73-reveal-about',about,()=>{
      tl.play(0);
      // Video starts from frame zero ONCE, never flashes/restarts on scrolling back.
      try{video.pause();video.currentTime=0;}catch(_){}
      video.play()?.catch?.(()=>{});
    });
    ST.create({
      id:'to-v73-floral-pause',trigger:about,start:'top 90%',end:'bottom 10%',
      onEnter:()=>{if(about.dataset.toMotionPlayed)video.play()?.catch?.(()=>{});},
      onEnterBack:()=>{if(about.dataset.toMotionPlayed)video.play()?.catch?.(()=>{});},
      onLeave:()=>video.pause(),onLeaveBack:()=>video.pause()
    });
  }

  // 2 — COMPETÊNCIAS: title arrives; three skill headings are really TYPED
  // as each individual row enters view (not all at once).
  const solutions=document.getElementById('solucoes');
  if(solutions){
    const kicker=solutions.querySelector('.section-kicker');
    const heading=solutions.querySelector('#solucoes-heading');
    const tl=reveal([kicker,heading],{duration:1.5,stagger:.35,offset:42});
    if(tl)onceTrigger('to-v71-solutions',solutions,()=>tl.play(0));
    const rows=[...solutions.querySelectorAll('.solution')];
    rows.forEach((row,i)=>{
      const title=row.querySelector('h3'), desc=row.querySelector('p');
      const words=prepareWords(title,'solution');
      if(!words.length)return;
      if(desc)gsap.set(desc,{y:18,autoAlpha:0});
      const typing=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      const done=typeWords(typing,words,.05,.09);
      if(desc)typing.to(desc,{y:0,autoAlpha:1,duration:.85},done+.10);
      onceTrigger('to-v73-type-solutions-'+i,row,()=>typing.play(0));
    });
  }

  // 3 — PROJECTS: keep GSAP horizontal travel untouched; animate only copy.
  const projects=document.getElementById('projetos');
  const track=projects?.querySelector('.projects-track');
  const gallery=ST.getAll().find(t=>t.trigger===projects&&t.animation);
  const container=gallery?.animation;
  const bindPanel=(id,element,run)=>onceTrigger(id,element,run,{containerAnimation:container});
  const summit=projects?.querySelector('.project-panel-summit');
  if(summit){
    const items=[
      summit.querySelector('.section-kicker'),
      summit.querySelector('#projetos-heading'),
      summit.querySelector('.projects-top > p'),
      ...summit.querySelectorAll('.case-caption > span,.case-caption h3,.case-caption p,.case-caption strong')
    ];
    const tl=reveal(items,{duration:1.2,stagger:.24,offset:37});
    if(tl)bindPanel('to-v71-projects',summit,()=>tl.play(0));
  }

  // 4 — OPERATIONS: only gray headline is typed. Dark card gets a plain reveal.
  const cases=projects?.querySelector('.project-panel-cases');
  if(cases){
    const gray=cases.querySelector('.case-text:not(.case-text-contrast)');
    const dark=cases.querySelector('.case-text-contrast');
    const title=gray?.querySelector('.case-text-main h3');
    const words=prepareWords(title,'gray');
    if(words.length){
      const pre=gray.querySelector('.case-index');
      const desc=gray.querySelector('.case-text-main p');
      const foot=gray.querySelector('.case-text-foot');
      const darkCopy=[...dark.querySelectorAll('.case-index,.case-text-main h3,.case-text-main p,.case-numbers')];
      const other=[pre,desc,foot,...darkCopy].filter(Boolean);
      gsap.set(other,{y:28,autoAlpha:0});
      const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      if(pre)tl.to(pre,{y:0,autoAlpha:1,duration:.75},0);
      const end=typeWords(tl,words,.55,.108);
      if(desc)tl.to(desc,{y:0,autoAlpha:1,duration:1.05},end+.12);
      if(foot)tl.to(foot,{y:0,autoAlpha:1,duration:.85},end+.48);
      if(darkCopy.length)tl.to(darkCopy,{y:0,autoAlpha:1,duration:1.05,stagger:.23},.95);
      bindPanel('to-v73-type-gray',cases,()=>tl.play(0));
    }
  }

  // 5 — CONTACT: smooth, readable, never typed and never repeated.
  const contact=document.getElementById('contato');
  if(contact){
    const lead=contact.querySelector('.contact-grid > div:first-child');
    const items=[
      lead?.querySelector('#contato-heading'),
      lead?.querySelector('p'),
      lead?.querySelector('.button-accent'),
      ...contact.querySelectorAll('.contact-aside > *,.footer > *')
    ].filter(Boolean);
    const tl=reveal(items,{duration:1.35,stagger:.27,offset:38});
    if(tl)onceTrigger('to-v71-contact',contact,()=>tl.play(0));
  }

  document.fonts?.ready?.then(()=>ST.refresh()).catch(()=>{});
  addEventListener('pagehide',()=>{
    triggers.forEach(t=>t.kill());
    observers.forEach(io=>io.disconnect());
  },{once:true});
})();
