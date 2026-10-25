/* TO EVENTOS V7.4 — typography as editorial motion, one controlled source.
   About uses a slow introduction. Step-typing appears only on selected headings:
   Competências, Experiência em Ação, Convenções and Contato.
   Existing side poppies, video HERO, Connect and PDF remain untouched. */
(() => {
  'use strict';

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const about = document.getElementById('sobre');
  const flower = about?.querySelector('.about-floral-video');

  const playFlower = () => {
    if (!flower || flower.ended) return;
    flower.play()?.catch(() => {});
  };
  const pauseFlower = () => flower?.pause();

  // People who opt out of motion get fully readable copy and final floral artwork.
  if (reduced || !gsap || !ST) {
    if (flower) {
      const showFinal = () => {
        if (flower.duration > 0) {
          try { flower.currentTime = Math.max(0, flower.duration - .08); } catch {}
        }
      };
      flower.addEventListener('loadedmetadata', showFinal, {once:true});
      if (flower.readyState >= 1) showFinal();
    }
    return;
  }
  gsap.registerPlugin(ST);

  const triggers = [];
  const onetime = ({id, element, timeline, containerAnimation, start='top 80%', end='bottom 15%'}) => {
    if (!element || !timeline) return;
    let started = false;
    const launch = () => {
      if (started) return;
      started = true;
      element.dataset.toV74Revealed = 'true';
      timeline.play(0);
    };
    const options = {id,trigger:element,start,end,invalidateOnRefresh:true,
      onEnter:launch,onEnterBack:launch};
    if (containerAnimation) options.containerAnimation = containerAnimation;
    triggers.push(ST.create(options));
    // Prevent skipping entrance when a user navigates by hash, swipes fast, or
    // scrolls over a panel's trigger boundary in a single frame.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          launch();
          io.disconnect();
        }
      }, {threshold:.16});
      io.observe(element);
    }
    const r=element.getBoundingClientRect();
    if (r.top < innerHeight*.8 && r.bottom > innerHeight*.16) {
      requestAnimationFrame(launch);
    }
    return launch;
  };

  // Preserve source text, em/BR markup and intrinsic line layout for SEO/AT.
  // These spans reveal a stable width; no letters are inserted or removed.
  const splitTitle = (heading, className='to-v74-type-line') => {
    if (!heading || heading.querySelector('.to-v74-type-line, .to-v72-type-line')) return [];
    const accessible = heading.textContent.replace(/\s+/g,' ').trim();
    if (!accessible) return [];
    heading.setAttribute('aria-label',accessible);
    const fragment=document.createDocumentFragment();
    let line=document.createElement('span');
    line.className=className;
    line.setAttribute('aria-hidden','true');
    for (const node of [...heading.childNodes]) {
      if (node.nodeName==='BR') {
        fragment.appendChild(line);
        line=document.createElement('span');
        line.className=className;
        line.setAttribute('aria-hidden','true');
      } else {
        line.appendChild(node);
      }
    }
    fragment.appendChild(line);
    heading.replaceChildren(fragment);
    return [...heading.querySelectorAll('.'+className)];
  };

  const typeLines = (timeline, lines, start=0, maxDuration=1.8) => {
    let time=start;
    for (const line of lines) {
      const letters=Array.from(line.textContent.trim()).length;
      const duration=Math.min(maxDuration,Math.max(.72,letters*.065));
      timeline.to(line,{clipPath:'inset(0 0% 0 0)',duration,
        ease:'steps('+Math.max(5,letters)+')'},time);
      time+=duration+.18;
    }
    return time;
  };

  // SOBRE — much slower, unmistakable introduction, one time only.
  // It must not fight with the GSAP transition between About and Competências.
  if (about && flower) {
    const overline=about.querySelector('.about-copy .overline');
    const headline=about.querySelector('#sobre-heading');
    const intro=about.querySelector('.about-copy .intro');
    const second=[...about.querySelectorAll('.about-copy > p')]
      .find(p => !p.classList.contains('intro') && !p.classList.contains('overline'));
    const proof=about.querySelector('.about-copy .microproof');

    const paragraphs=[headline,intro,second,proof].filter(Boolean);
    gsap.set(paragraphs,{y:65,autoAlpha:0});
    gsap.set(flower,{y:18,autoAlpha:0});
    if (overline) gsap.set(overline,{clipPath:'inset(0 100% 0 0)',autoAlpha:1});

    const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    if (overline) timeline.to(overline,{clipPath:'inset(0 0% 0 0)',
      duration:1.72,ease:'steps(40)'},.10);
    timeline.to(flower,{y:0,autoAlpha:1,duration:1.85},.34);
    if (headline) timeline.to(headline,{y:0,autoAlpha:1,duration:2.25},.72);
    if (intro) timeline.to(intro,{y:0,autoAlpha:1,duration:1.75},2.04);
    if (second) timeline.to(second,{y:0,autoAlpha:1,duration:1.70},2.91);
    if (proof) timeline.to(proof,{y:0,autoAlpha:1,duration:1.42},3.86);

    const reveal=onetime({id:'to-v74-about',element:about,timeline,start:'top 70%',end:'bottom 18%'});
    const st=ST.create({id:'to-v74-botanical-playback',trigger:about,
      start:'top 78%',end:'bottom 12%',onEnter:playFlower,
      onEnterBack:playFlower,onLeave:pauseFlower,onLeaveBack:pauseFlower});
    triggers.push(st);
    // At a direct #sobre arrival, the video must follow the same trigger.
    if (location.hash==='#sobre') {
      requestAnimationFrame(() => {reveal?.(); playFlower();});
    }
  }

  // COMPETÊNCIAS — title + each of the three service titles gets typing.
  // Descriptions use calm reveal, never character flickering.
  const solutions=document.getElementById('solucoes');
  if (solutions) {
    const kicker=solutions.querySelector('.section-kicker');
    const heading=solutions.querySelector('#solucoes-heading');
    const lines=splitTitle(heading);
    const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    if (kicker) {
      gsap.set(kicker,{y:18,autoAlpha:0});
      timeline.to(kicker,{y:0,autoAlpha:1,duration:1.05},0);
    }
    gsap.set(lines,{clipPath:'inset(0 100% 0 0)'});
    typeLines(timeline,lines,.65,2.0);
    onetime({id:'to-v74-solutions',element:solutions,timeline,
      start:'top 75%',end:'bottom 16%'});

    [...solutions.querySelectorAll('.solution')].forEach((row,index)=>{
      const h=row.querySelector('h3'), p=row.querySelector('p');
      const bits=splitTitle(h);
      if (!bits.length) return;
      gsap.set(bits,{clipPath:'inset(0 100% 0 0)'});
      if (p) gsap.set(p,{y:18,autoAlpha:0});
      const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      const end=typeLines(tl,bits,.10,1.28);
      if (p) tl.to(p,{y:0,autoAlpha:1,duration:1.04},Math.max(.45,end-.45));
      onetime({id:'to-v74-solution-'+(index+1),element:row,timeline:tl,
        start:'top 84%',end:'bottom 14%'});
    });
  }

  // Desktop AND touch carousel: use the existing GSAP containerAnimation.
  // No new pin or scroll-hijacking motion in the project gallery.
  const projects=document.getElementById('projetos');
  const summit=projects?.querySelector('.project-panel-summit');
  const cases=projects?.querySelector('.project-panel-cases');
  const gallery=ST.getAll().find(t => t.trigger===projects && t.animation);
  const containerAnimation=gallery?.animation || undefined;
  const bindPanel=(id,panel,timeline) => onetime({
    id,element:panel,timeline,containerAnimation,
    start:containerAnimation?'left 84%':'top 84%',
    end:containerAnimation?'right 14%':'bottom 15%'
  });

  // EXPERIÊNCIA EM AÇÃO — typed section heading, staggered supporting copy.
  if (summit) {
    const kicker=summit.querySelector('.section-kicker');
    const heading=summit.querySelector('#projetos-heading');
    const lines=splitTitle(heading);
    const description=summit.querySelector('.projects-top > p');
    const detail=[...summit.querySelectorAll('.case-caption > span, .case-caption h3, .case-caption p, .case-caption strong')];
    const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    if (kicker) {
      gsap.set(kicker,{y:20,autoAlpha:0});
      timeline.to(kicker,{y:0,autoAlpha:1,duration:.9},0);
    }
    gsap.set(lines,{clipPath:'inset(0 100% 0 0)'});
    const last=typeLines(timeline,lines,.35,1.55);
    const supporting=[description,...detail].filter(Boolean);
    gsap.set(supporting,{y:25,autoAlpha:0});
    timeline.to(supporting,{y:0,autoAlpha:1,duration:1.07,stagger:.19},last-.35);
    bindPanel('to-v74-projects',summit,timeline);
  }

  // CONVENÇÕES CORPORATIVAS — primary typewriter on the GREY card only.
  // Dark card keeps a separate opacity/movement reveal.
  if (cases) {
    const gray=cases.querySelector('.case-text:not(.case-text-contrast)');
    const dark=cases.querySelector('.case-text-contrast');
    const heading=gray?.querySelector('.case-text-main h3');
    const lines=splitTitle(heading,'to-v72-type-line');
    if (lines.length) {
      const kicker=gray.querySelector('.case-index');
      const desc=gray.querySelector('.case-text-main p');
      const foot=gray.querySelector('.case-text-foot');
      const darkText=dark?[...dark.querySelectorAll('.case-index,.case-text-main h3,.case-text-main p,.case-numbers')]:[];
      gsap.set(lines,{clipPath:'inset(0 100% 0 0)'});
      const supporting=[kicker,desc,foot,...darkText].filter(Boolean);
      gsap.set(supporting,{y:16,autoAlpha:0});
      const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
      if (kicker) tl.to(kicker,{y:0,autoAlpha:1,duration:.9},0);
      const end=typeLines(tl,lines,.45,1.8);
      if (desc) tl.to(desc,{y:0,autoAlpha:1,duration:1.0},end);
      if (foot) tl.to(foot,{y:0,autoAlpha:1,duration:.85},end+.43);
      if (darkText.length) tl.to(darkText,{y:0,autoAlpha:1,duration:1.0,stagger:.17},.95);
      bindPanel('to-v74-cases',cases,tl);
    }
  }

  // CONTATO — typed heading, graceful CTA/contacts/footer sequence.
  const contact=document.getElementById('contato');
  if (contact) {
    const lead=contact.querySelector('.contact-grid > div:first-child');
    const heading=lead?.querySelector('#contato-heading');
    const lines=splitTitle(heading);
    const paragraph=lead?.querySelector('p');
    const button=lead?.querySelector('.button-accent');
    const links=[...contact.querySelectorAll('.contact-aside > *,.footer > *')];
    const supporting=[paragraph,button,...links].filter(Boolean);
    gsap.set(lines,{clipPath:'inset(0 100% 0 0)'});
    gsap.set(supporting,{y:24,autoAlpha:0});
    const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
    const end=typeLines(tl,lines,.2,1.65);
    tl.to(supporting,{y:0,autoAlpha:1,duration:1.0,stagger:.16},end-.1);
    onetime({id:'to-v74-contact',element:contact,timeline:tl,start:'top 77%',end:'bottom 12%'});
  }

  document.fonts?.ready?.then(()=>ST.refresh()).catch(()=>{});
  window.addEventListener('pagehide',()=>{
    triggers.forEach(t=>t.kill());
    pauseFlower();
  },{once:true});
})();
