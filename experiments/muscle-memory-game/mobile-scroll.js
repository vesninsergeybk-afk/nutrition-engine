// A dedicated touch lane scrolls the page without changing OrbitControls.
const rail = document.getElementById('mobile-page-scroll');
const thumb = rail?.querySelector('.mobile-page-scroll-thumb');
const mobile = matchMedia('(max-width: 920px)');
if (rail && thumb) {
  let frame = 0;
  let drag = null;
  let maxScroll = 0;
  let travel = 0;
  function update() {
    frame = 0;
    const page = document.scrollingElement;
    maxScroll = Math.max(0, page.scrollHeight - page.clientHeight);
    rail.hidden = !mobile.matches || maxScroll < 24;
    if (rail.hidden) { drag = null; return; }
    const height = rail.clientHeight;
    const thumbHeight = Math.min(height, Math.max(52, height * page.clientHeight / page.scrollHeight));
    travel = Math.max(1, height - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${travel * Math.min(1, Math.max(0, page.scrollTop / maxScroll))}px)`;
    rail.setAttribute('aria-valuenow', String(Math.round(page.scrollTop)));
    rail.setAttribute('aria-valuemax', String(Math.round(maxScroll)));
    rail.setAttribute('aria-valuetext', `${Math.round(100 * page.scrollTop / maxScroll)}% страницы`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function scrollToPointer(y) {
    if (!drag || !maxScroll) return;
    const track = rail.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (y - track.top - drag.offset) / travel));
    // Explicit auto keeps dragging direct even if other UI uses smooth scroll.
    window.scrollTo({ top: progress * maxScroll, behavior: 'instant' });
  }
  rail.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    update();
    if (rail.hidden) return;
    event.preventDefault();
    const box = thumb.getBoundingClientRect();
    drag = { id: event.pointerId, offset: event.target === thumb ? event.clientY - box.top : box.height / 2 };
    rail.setPointerCapture(event.pointerId);
    rail.dataset.dragging = 'true';
    scrollToPointer(event.clientY);
  });
  rail.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    event.preventDefault();
    scrollToPointer(event.clientY);
  });
  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    rail.dataset.dragging = 'false';
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) rail.addEventListener(type, endDrag);
  rail.addEventListener('keydown', event => {
    const page = document.scrollingElement;
    const steps = { ArrowDown: 64, ArrowUp: -64, PageDown: page.clientHeight * .8, PageUp: -page.clientHeight * .8 };
    let target;
    if (event.key in steps) target = page.scrollTop + steps[event.key];
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = maxScroll;
    if (target === undefined) return;
    event.preventDefault();
    window.scrollTo({ top: target, behavior: 'instant' });
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  mobile.addEventListener('change', schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(document.body);
  resize.observe(document.documentElement);
  update();
}
