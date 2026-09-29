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
