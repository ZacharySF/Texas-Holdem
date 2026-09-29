/** Animation visibility only; never touches application state. */
export function visibleMotion(node: HTMLElement) {
  const observer = new IntersectionObserver(([entry]) => {
    node.dataset.decorVisible = String(entry.isIntersecting);
  });
  node.dataset.decorVisible = 'false';
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
export function coordinates(node: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const paint = () => {
    frame = 0;
    if (!reduced.matches)
      node.textContent = `x:0041 y:${String(Math.round(window.scrollY)).padStart(4, '0')}`;
  };
  const scroll = () => {
    if (!frame && !reduced.matches) frame = requestAnimationFrame(paint);
  };
  window.addEventListener('scroll', scroll, { passive: true });
  return {
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
    },
  };
}
