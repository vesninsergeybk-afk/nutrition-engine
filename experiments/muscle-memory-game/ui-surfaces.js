// Reversible surface transitions. Logical state changes immediately; an exiting
// surface is inert until its short visual transition has finished.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const states = new WeakMap();
const active = new Set();
const easing = 'cubic-bezier(.2,.7,.2,1)';

export function setSurfaceVisible(element, visible, { drawer = false, onFinish } = {}) {
  if (!element) return;
  const previous = states.get(element);
  if (previous?.visible === visible) return;
  previous?.animation?.cancel();
  active.delete(previous);
  const state = { visible, animation: null };
  states.set(element, state);
  const wasVisible = !element.hidden && element.getClientRects().length > 0;
  element.inert = !visible;
  if (visible) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', 'true');
  function finish() {
    active.delete(state);
    if (states.get(element) !== state) return;
    element.hidden = !visible;
    element.dataset.uiState = visible ? 'open' : 'closed';
    onFinish?.();
  }
  if (visible) element.hidden = false;
  if (reducedMotion.matches || document.hidden || typeof element.animate !== 'function' ||
      (!visible && !wasVisible) || !element.getClientRects().length) {
    finish();
    return;
  }
  element.dataset.uiState = visible ? 'opening' : 'closing';
  const offset = drawer ? 'translateX(-14px)' : 'translateY(6px)';
  const frames = [{ opacity: 0, transform: offset }, { opacity: 1, transform: 'none' }];
  state.animation = element.animate(visible ? frames : [...frames].reverse(), {
    duration: visible ? 220 : 180, easing,
  });
  active.add(state);
  state.animation.finished.then(finish, () => active.delete(state));
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) for (const state of active) state.animation.finish();
});
