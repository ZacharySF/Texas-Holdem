import { sectionFor } from './sections';
/** Presentation-only chrome, copied from existing panel headings. No application nodes or data are changed. */
export function panelLabels(host: HTMLElement) {
  let queued = false;
  const refresh = () => {
    queued = false;
    const section = sectionFor(location.hash.slice(1).split('?')[0]);
    for (const panel of host.querySelectorAll<HTMLElement>(
      '.panel,.coach-sidebar',
    )) {
      if (panel.querySelector(':scope > .panel-label')) continue;
      const heading = panel.querySelector('h2,h3,label');
      const label = document.createElement('div');
      label.className = 'panel-label';
      label.setAttribute('aria-hidden', 'true');
      label.dataset.panelChrome = '';
      label.textContent = `${section.code} / ${panel.getAttribute('aria-label') ?? heading?.textContent?.trim().slice(0, 48) ?? section.name}`;
      panel.prepend(label);
    }
  };
  const observer = new MutationObserver((records) => {
    if (
      records.every(
        (r) =>
          [...r.addedNodes].every(
            (n) =>
              n instanceof HTMLElement && n.hasAttribute('data-panel-chrome'),
          ) && !r.removedNodes.length,
      )
    )
      return;
    if (!queued) {
      queued = true;
      queueMicrotask(refresh);
    }
  });
  observer.observe(host, { childList: true, subtree: true });
  refresh();
  return { destroy: () => observer.disconnect() };
}
