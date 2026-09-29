/** Prevent a repeated chapter graphic from dominating the viewport. DOM-only presentation state. */
const visible = new Set<HTMLElement>();
function arrange() {
  [...visible]
    .sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    )
    .forEach((node, i) => {
      node.style.visibility = i < 2 ? 'visible' : 'hidden';
    });
}
export function chapterBudget(node: HTMLElement) {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) visible.add(node);
    else visible.delete(node);
    arrange();
  });
  observer.observe(node);
  return {
    destroy() {
      observer.disconnect();
      visible.delete(node);
      arrange();
    },
  };
}
