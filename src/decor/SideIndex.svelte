<script lang="ts">
  import { onMount } from 'svelte';
  import { navigation } from '../navigation.svelte';
  import { sectionFor } from './sections';
  type Entry = { label: string; href?: string; node?: HTMLElement };
  let entries = $state<Entry[]>([]);
  let section = $derived(sectionFor(navigation.path));
  onMount(() => {
    const host = document.querySelector('.site-main');
    if (!host) return;
    let queued = false;
    const refresh = () => {
      queued = false;
      const links = [
        ...host.querySelectorAll<HTMLAnchorElement>('.tool-nav a'),
      ];
      const next: Entry[] = links.length
        ? links.map((node) => ({
            label: node.textContent?.trim() ?? '',
            href: node.getAttribute('href') ?? '',
          }))
        : [...host.querySelectorAll<HTMLElement>('main h2')]
            .filter(
              (node) => node.getClientRects().length && !node.closest('.seat'),
            )
            .slice(0, 12)
            .map((node) => ({ label: node.textContent?.trim() ?? '', node }));
      if (
        next.length !== entries.length ||
        next.some(
          (item, i) =>
            item.label !== entries[i]?.label ||
            item.href !== entries[i]?.href ||
            item.node !== entries[i]?.node,
        )
      )
        entries = next;
    };
    const observer = new MutationObserver(() => {
      if (!queued) {
        queued = true;
        queueMicrotask(refresh);
      }
    });
    observer.observe(host, { childList: true, subtree: true });
    refresh();
    return () => observer.disconnect();
  });
</script>

<aside class="side-index" aria-label="Section index">
  <div class="panel-label">{section.code} / index</div>
  <nav aria-label="Page sections">
    {#each entries as entry, i (entry.label + i)}
      {#if entry.href}<a
          href={entry.href}
          aria-current={entry.href === '#' + navigation.path
            ? 'page'
            : undefined}
          ><span aria-hidden="true" class="index-code"
            >{Number(section.code)}.{i + 1}</span
          >{entry.label}</a
        >
      {:else}<button
          onclick={() =>
            entry.node?.scrollIntoView({ block: 'start', behavior: 'instant' })}
          ><span aria-hidden="true" class="index-code"
            >{String(i + 1).padStart(2, '0')}</span
          >{entry.label}</button
        >{/if}
    {:else}<button
        onclick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >Overview</button
      >{/each}
  </nav>
</aside>
