import { visualConfig } from './config';
type Layer = {
  element: HTMLElement;
  speed: number;
  pointer: number;
  axis?: 'x' | 'y';
  fixed?: boolean;
  visible: boolean;
  origin: number;
  x: number;
  y: number;
};
const layers = new Set<Layer>();
let frame = 0,
  pointerX = 0,
  pointerY = 0,
  scrollY = 0,
  dispose: (() => void) | undefined;
const motion = visualConfig.motion;
/** One shared rAF loop for all DOM layers; Pixi uses its own existing ticker. */
export function parallax(
  element: HTMLElement,
  options: {
    speed: number;
    pointer: number;
    axis?: 'x' | 'y';
    fixed?: boolean;
  },
) {
  if (!dispose) start();
  const layer: Layer = {
    element,
    ...options,
    visible: false,
    origin: Math.max(
      0,
      element.getBoundingClientRect().top + window.scrollY - innerHeight / 2,
    ),
    x: 0,
    y: 0,
  };
  layers.add(layer);
  const observer = new IntersectionObserver(
    ([entry]) => {
      layer.visible = entry.isIntersecting;
      if (!layer.visible) {
        element.style.willChange = '';
        element.style.transform = '';
      }
      wake();
    },
    { rootMargin: '0px' },
  );
  observer.observe(element);
  return {
    destroy() {
      observer.disconnect();
      layers.delete(layer);
      element.style.transform = '';
      element.style.willChange = '';
      if (!layers.size) {
        dispose?.();
        dispose = undefined;
      }
    },
  };
}
function wake() {
  if (!frame) frame = requestAnimationFrame(update);
}
function update() {
  frame = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollEnabled = innerWidth >= motion.minimumScrollWidth;
  const pointerEnabled = matchMedia(
    '(hover: hover) and (pointer: fine)',
  ).matches;
  let unsettled = false;
  for (const l of layers) {
    if (!l.visible || reduced || (!scrollEnabled && !pointerEnabled)) {
      l.element.style.transform = '';
      l.element.style.willChange = '';
      l.x = l.y = 0;
      continue;
    }
    const travel = scrollEnabled
      ? l.fixed
        ? -scrollY * l.speed
        : (scrollY - l.origin) * (l.axis === 'x' ? l.speed : 1 - l.speed)
      : 0;
    const tx =
      (l.axis === 'x' ? travel : 0) -
      (pointerEnabled ? pointerX * l.pointer : 0);
    const ty =
      (l.axis === 'x' ? 0 : travel) -
      (pointerEnabled ? pointerY * l.pointer : 0);
    l.x += (tx - l.x) * motion.lerp;
    l.y += (ty - l.y) * motion.lerp;
    l.element.style.willChange = 'transform';
    l.element.style.transform = `translate3d(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px, 0)`;
    unsettled ||=
      Math.abs(tx - l.x) + Math.abs(ty - l.y) > motion.settleEpsilon;
  }
  if (unsettled) wake();
}
function start() {
  scrollY = window.scrollY;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    fine = matchMedia('(hover: hover) and (pointer: fine)');
  const scroll = () => {
    scrollY = window.scrollY;
    wake();
  };
  const pointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !fine.matches) return;
    pointerX = (e.clientX / innerWidth) * 2 - 1;
    pointerY = (e.clientY / innerHeight) * 2 - 1;
    wake();
  };
  const leave = (event: Event) => {
    if (event instanceof PointerEvent && event.relatedTarget) return;
    pointerX = pointerY = 0;
    wake();
  };
  const resize = () => {
    for (const l of layers)
      l.origin = Math.max(
        0,
        l.element.getBoundingClientRect().top +
          window.scrollY -
          l.y -
          innerHeight / 2,
      );
    wake();
  };
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('pointermove', pointer, { passive: true });
  window.addEventListener('pointerout', leave, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', wake);
  fine.addEventListener('change', leave);
  dispose = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('pointermove', pointer);
    window.removeEventListener('pointerout', leave);
    window.removeEventListener('resize', resize);
    reduced.removeEventListener('change', wake);
    fine.removeEventListener('change', leave);
  };
}
