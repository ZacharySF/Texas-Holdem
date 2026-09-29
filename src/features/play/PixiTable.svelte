<script lang="ts">
  import { onMount } from 'svelte';
  let host: HTMLDivElement;
  onMount(() => {
    const controller = new AbortController();
    let dispose: (() => void) | undefined;
    void import('../../visual/pokerScene')
      .then(({ mountPokerScene }) =>
        mountPokerScene(
          host,
          host.closest<HTMLElement>('.felt-table')!,
          controller.signal,
        ),
      )
      .then((cleanup) => {
        if (controller.signal.aborted) cleanup();
        else dispose = cleanup;
      })
      .catch(() => {
        /* Semantic HTML remains fully playable when WebGL is unavailable. */
      });
    return () => {
      controller.abort();
      dispose?.();
    };
  });
</script>

<div class="pixi-table" bind:this={host} aria-hidden="true"></div>
