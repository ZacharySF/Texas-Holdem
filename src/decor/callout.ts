/** Layout-only DOM observation. Reads existing text; never changes target nodes. */
export function attachCallout(
  node: SVGSVGElement,
  options: { selector: string; label: string },
) {
  let target: HTMLElement | null = null,
    frame = 0;
  const line = node.querySelector('path')!,
    text = node.querySelector('text')!;
  const paint = () => {
    frame = 0;
    const next = document.querySelector<HTMLElement>(options.selector);
    if (next !== target) {
      if (target) resize.unobserve(target);
      target = next;
      if (target) resize.observe(target);
    }
    node.style.display = 'none';
    if (!target || innerWidth < 1700) return;
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.top < 35 || r.bottom > innerHeight - 40) return;
    const labelX = r.left - 160;
    if (labelX < 12) return;
    // Only use an actual outer gutter, never cross a reading column or controls.
    const content = target.closest('.course-main,.coach-sidebar');
    const boundary = content?.getBoundingClientRect();
    if (!boundary || boundary.left - 140 < 0) return;
    const x = boundary.left - 140,
      y = r.top + r.height / 2;
    if (content?.classList.contains('coach-sidebar')) return;
    node.style.display = 'block';
    line.setAttribute(
      'd',
      `M ${x},${y - 10} H ${boundary.left - 14} V ${y} H ${r.left - 5}`,
    );
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y - 18));
    text.textContent = `${options.label} / ${target.textContent?.trim().slice(0, 32) ?? ''}`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver(schedule);
  const main = document.getElementById('main-content');
  if (main)
    mutations.observe(main, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
  return {
    destroy() {
      resize.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    },
  };
}
