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
    const next =
      [...document.querySelectorAll<HTMLElement>(options.selector)].find(
        (element) =>
          /\d/.test(element.textContent ?? '') &&
          (!options.selector.includes('.katex-html') ||
            element.children.length === 0),
      ) ?? null;
    if (next !== target) {
      if (target) resize.unobserve(target);
      target = next;
      if (target) resize.observe(target);
    }
    node.style.display = 'none';
    if (!target) return;
    const demo = target.closest('.graphic-objects');
    if (innerWidth < 1700 && !demo) return;
    const r = target.getBoundingClientRect();
    if (
      r.width === 0 ||
      r.height === 0 ||
      r.top < 35 ||
      r.bottom > innerHeight - 40
    )
      return;
    const content = target.closest(
      '.course-main,.coach-sidebar,.graphic-objects',
    );
    if (!content) return;
    const boundary = content.getBoundingClientRect(),
      right = content.classList.contains('coach-sidebar'),
      y = r.top + r.height / 2;
    if (r.top < boundary.top || r.bottom > boundary.bottom) return;
    const x = demo
      ? r.left - 110
      : right
        ? boundary.right + 16
        : boundary.left - 140;
    if (x < 10 || x + 130 > innerWidth) return;
    const origin = right ? r.right + 4 : r.left - 4;
    const elbow = right ? boundary.right + 8 : boundary.left - 10;
    node.style.display = 'block';
    line.setAttribute(
      'd',
      demo
        ? `M ${x},${y} H ${origin}`
        : `M ${origin},${y} H ${elbow} V ${y - 12} H ${x}`,
    );
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y - 20));
    const samples = target
      .closest('.probability')
      ?.querySelector('.field-label')
      ?.textContent?.match(/([\d,]+) SAMPLES/);
    text.textContent = `${options.label} / ${target.textContent?.trim().slice(0, 25) ?? ''}${samples ? ` / n=${samples[1]}` : ''}`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver((records) => {
    if (
      records.some(
        (record) =>
          !(
            record.target instanceof Element
              ? record.target
              : record.target.parentElement
          )?.closest('.graphic-callout'),
      )
    )
      schedule();
  });
  const main = document.getElementById('main-content');
  if (main)
    mutations.observe(main, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
  return {
    destroy() {
      resize.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    },
  };
}
