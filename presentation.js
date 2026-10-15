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
