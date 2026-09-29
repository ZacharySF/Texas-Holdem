import { readouts } from './readouts';
/** Updates decorative text only. No stores, dispatches, history or persistence writes. */
export function liveReadout(
  node: HTMLElement,
  key: keyof ReturnType<typeof readouts> | 'clock',
) {
  const paint = () => {
    if (document.hidden) return;
    node.textContent =
      key === 'clock'
        ? new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : readouts()[key].toLocaleString();
  };
  paint();
  const timer = window.setInterval(paint, 1000);
  return { destroy: () => clearInterval(timer) };
}
/** Local animation telemetry. Stops while hidden, offscreen or under reduced motion. */
export function frameMeter(node: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0,
    frames = 0,
    since = 0,
    visible = false;
  const tick = (now: number) => {
    frames += 1;
    if (now - since >= 1000) {
      node.textContent = String(Math.round((frames * 1000) / (now - since)));
      frames = 0;
      since = now;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && !reduced.matches) {
      since = performance.now();
      frames = 0;
      frame = requestAnimationFrame(tick);
    } else node.textContent = '—';
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(node);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  return {
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
