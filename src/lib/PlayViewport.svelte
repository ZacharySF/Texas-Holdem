<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import FullscreenStars from './FullscreenStars.svelte';

  let { enabled, children }: { enabled: boolean; children: Snippet } = $props();
  let viewport: HTMLDivElement;
  let toggle = $state<HTMLButtonElement>();
  let expanded = $state(false);
  let pending = $state(false);
  let notice = $state('');
  let mounted = false;

  async function leave() {
    if (document.fullscreenElement === viewport) {
      try {
        await document.exitFullscreen();
      } catch {
        notice = 'Use your browser’s Escape key to exit fullscreen.';
        return;
      }
    }
    expanded = false;
    notice = '';
    toggle?.focus({ preventScroll: true });
  }

  async function toggleFullscreen() {
    if (expanded) return leave();
    pending = true;
    notice = '';
    expanded = true;
    if (viewport.requestFullscreen && document.fullscreenEnabled) {
      try {
        await viewport.requestFullscreen();
        if (!mounted && document.fullscreenElement === viewport)
          await document.exitFullscreen();
      } catch {
        if (mounted)
          notice =
            'Browser fullscreen is unavailable. The table is expanded in this window.';
      }
    } else {
      notice =
        'Browser fullscreen is unavailable. The table is expanded in this window.';
    }
    pending = false;
  }

  onMount(() => {
    mounted = true;
    const sync = () => {
      expanded = document.fullscreenElement === viewport;
      if (!expanded) {
        notice = '';
        toggle?.focus({ preventScroll: true });
      }
    };
    const escape = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), #display-settings[open]',
        );
      if (
        event.key.toLowerCase() === 'f' &&
        enabled &&
        !pending &&
        !typing &&
        !event.repeat &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        void toggleFullscreen();
      }
      if (event.key === 'Escape' && expanded && !document.fullscreenElement) {
        event.preventDefault();
        void leave();
      }
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('keydown', escape);
    return () => {
      mounted = false;
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('keydown', escape);
      if (document.fullscreenElement === viewport)
        void document.exitFullscreen().catch(() => {});
    };
  });

  // Isolate only the presentation while expanded. The hand and its worker stay mounted.
  $effect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const outside: Array<[HTMLElement, boolean]> = [];
    for (
      let node: HTMLElement | null = viewport;
      node?.parentElement;
      node = node.parentElement
    ) {
      for (const sibling of node.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== node) {
          outside.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      if (node.parentElement === document.body) break;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const [element, inert] of outside) element.inert = inert;
    };
  });
</script>

<div bind:this={viewport} class="play-viewport" class:play-expanded={expanded}>
  {#if expanded}<FullscreenStars />{/if}
  {#if enabled}
    <div class="play-view-controls">
      {#if notice}<span role="status">{notice}</span>{/if}
      <button
        bind:this={toggle}
        type="button"
        aria-pressed={expanded}
        aria-keyshortcuts="F"
        title={expanded ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        disabled={pending}
        onclick={() => void toggleFullscreen()}
        >{expanded ? 'Exit fullscreen' : 'Fullscreen'}</button
      >
    </div>
  {/if}
  {@render children()}
</div>
