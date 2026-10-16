(() => {
  const slides = [...document.querySelectorAll('[data-slide]')];
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const counter = document.querySelector('#page-count');
  let active = 0;
  let pending = false;
  const cover = document.querySelector('.cover');
  const coverCard = cover?.querySelector('.polaroid');
  const coverNote = cover?.querySelector('.cover-note');
  function alignCoverNote() {
    if (!coverCard || !coverNote) return;
    if (matchMedia('(max-width:900px)').matches) {
      coverNote.style.removeProperty('top');
      coverNote.style.removeProperty('bottom');
      return;
    }
    const cardBottom = coverCard.offsetTop + coverCard.offsetHeight;
    coverNote.style.top = `${cardBottom + (cover.clientHeight - cardBottom - coverNote.offsetHeight) / 2}px`;
    coverNote.style.bottom = 'auto';
  }
  function update() {
    pending = false;
    const reference = Math.min(innerHeight * .5, 360);
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      const value = rect.top <= reference && rect.bottom > reference ? 0 : Math.abs(rect.top - reference);
      if (value < distance) { distance = value; active = index; }
    });
    counter.textContent = `${String(active + 1).padStart(2, '0')} / ${slides.length}`;
    previous.disabled = active === 0;
    next.disabled = active === slides.length - 1;
  }
  function go(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    slides[index].scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    history.replaceState(null, '', `#${slides[index].id}`);
  }
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); go(active + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); go(active - 1); }
    if (event.key === 'Home') { event.preventDefault(); go(0); }
    if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
  });
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, {passive: true});
  addEventListener('resize', update);
  addEventListener('resize', alignCoverNote);
  if (coverCard && typeof ResizeObserver !== 'undefined') new ResizeObserver(alignCoverNote).observe(coverCard);
  document.fonts.ready.then(alignCoverNote);
  alignCoverNote();
  document.fonts.ready.then(update);
  update();
})();

// Rebuild portrait stamp outlines from actual dimensions: every notch is circular.
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.querySelector('body>svg defs');
  if (!defs) return;
  const mobile = matchMedia('(max-width:900px)');
  const targets = [...document.querySelectorAll('.cover-paper,.planting-copy,.org-copy,.care-card,.contact-card,.when-back,.group-card,.circle-photo')];
  const entries = targets.map((element,index) => {
    const clip = document.createElementNS(ns,'clipPath');
    clip.id = `portrait-stamp-${index}`;
    clip.setAttribute('clipPathUnits','objectBoundingBox');
    const path = document.createElementNS(ns,'path');
    clip.append(path); defs.append(clip);
    return {element,clip,path};
  });
  function draw({element,clip,path}) {
    if (!mobile.matches) { element.style.removeProperty('clip-path'); return; }
    const w=element.offsetWidth,h=element.offsetHeight;
    if (!w || !h) return;
    if(element.classList.contains('circle-photo')){
      const center=53/w,rx=28/w,ry=28/h;
      path.setAttribute('d',`M0 0H${center-rx}A${rx} ${ry} 0 0 0 ${center+rx} 0H1V1H0Z`);
      element.style.clipPath=`url(#${clip.id})`;
      return;
    }
    const coverStamp=element.classList.contains('cover-paper');
    const groupStamp=element.classList.contains('group-card');
    const radius=coverStamp||groupStamp?6:4.5,corner=coverStamp?7.8:6,pitch=coverStamp?18:groupStamp?20:21;
    const rx=radius/w,ry=radius/h,cx=corner/w,cy=corner/h;
    const centers=(size)=>{const margin=radius*2.7;const count=Math.max(2,Math.floor((size-2*margin)/pitch)+1);return Array.from({length:count},(_,i)=>(margin+(size-2*margin)*i/(count-1))/size);};
    const xs=centers(w),ys=centers(h);
    const bottomOnly=element.classList.contains('care-card');
    const rightOnly=element.classList.contains('group-card');
    let d=bottomOnly?'M0 0H1V1':rightOnly?'M0 0H1':`M${cx} 0`;
    if (!bottomOnly && !rightOnly) {
      for(const c of xs){d+=`H${c-rx}A${rx} ${ry} 0 0 0 ${c+rx} 0`;}
      d+=`H${1-cx}A${cx} ${cy} 0 0 0 1 ${cy}`;
    }
    if(!bottomOnly){
      for(const c of ys){d+=`V${c-ry}A${rx} ${ry} 0 0 0 1 ${c+ry}`;}
      d+=rightOnly?'V1H0Z':`V${1-cy}A${cx} ${cy} 0 0 0 ${1-cx} 1`;
    }
    if(!rightOnly){
      for(const c of [...xs].reverse()){d+=`H${c+rx}A${rx} ${ry} 0 0 0 ${c-rx} 1`;}
      if(bottomOnly)d+='H0Z';
      else{
        d+=`H${cx}A${cx} ${cy} 0 0 0 0 ${1-cy}`;
        for(const c of [...ys].reverse()){d+=`V${c+ry}A${rx} ${ry} 0 0 0 0 ${c-ry}`;}
        d+=`V${cy}A${cx} ${cy} 0 0 0 ${cx} 0Z`;
      }
    }
    path.setAttribute('d',d);
    element.style.clipPath=`url(#${clip.id})`;
  }
  const refresh=()=>entries.forEach(draw);
  const observer=new ResizeObserver(refresh);
  targets.forEach(el=>observer.observe(el));
  mobile.addEventListener('change',refresh);
  document.fonts.ready.then(refresh);
  refresh();
})();

// Native horizontal scroll remains usable by touch, keyboard, and the case buttons.
(() => {
 const track=document.querySelector('.case-grid');
 const previous=document.querySelector('.case-previous');
 const next=document.querySelector('.case-next');
 const counter=document.querySelector('.case-position');
 if(!track||!previous||!next||!counter)return;
 const cards=[...track.querySelectorAll('.case-card')];
 let current=0;
 function update(){
  const center=track.getBoundingClientRect().left+track.clientWidth/2;
  let distance=Infinity;
  cards.forEach((card,i)=>{const r=card.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;current=i;}});
  counter.textContent=`${current+1} / ${cards.length}`;
  previous.disabled=current===0;next.disabled=current===cards.length-1;
 }
 function move(step){
  const card=cards[Math.max(0,Math.min(cards.length-1,current+step))];
  track.scrollTo({left:card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
 }
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 track.addEventListener('scroll',update,{passive:true});addEventListener('resize',update);
 document.fonts.ready.then(update);update();
})();
