<script lang="ts">
  import { untrack, type Snippet } from 'svelte';

  let {
    odds,
    feedback,
    course,
    decision,
  }: {
    odds: Snippet<[topic: 'odds' | 'equity']>;
    feedback: string;
    course?: Snippet;
    decision?: Snippet;
  } = $props();
  let open = $state.raw(false);
  let tab = $state.raw<'odds' | 'equity' | 'review'>('odds');
  let panel: HTMLElement | null = $state(null);
  let trigger: HTMLButtonElement | null = $state(null);
  $effect(() => {
    const dependencies = { d0: open };
    void dependencies;
    return untrack(() => {
      const open = dependencies.d0;
      if (open) panel?.focus();
    });
  });
  function close() {
    setOpen(false);
    trigger?.focus();
  }
  function setOpen(
    value: typeof open | ((previous: typeof open) => typeof open),
  ) {
    open = typeof value === 'function' ? value(open) : value;
  }
  function setTab(value: typeof tab | ((previous: typeof tab) => typeof tab)) {
    tab = typeof value === 'function' ? value(tab) : value;
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && open) close();
  }}
/>
<button
  bind:this={trigger}
  class="mobile-coach-button"
  aria-expanded={open}
  aria-controls="table-coach"
  onclick={() => setOpen(true)}>Open coach · help with this hand</button
>
<aside
  bind:this={panel}
  id="table-coach"
  class={`coach-sidebar ${open ? 'coach-is-open' : ''}`}
  aria-label="Table coach"
  tabindex="-1"
>
  <header>
    <div><h2>Your coach</h2></div>
    <button class="close-coach" onclick={close}>Back to table</button>
  </header>
  <p class="coach-intro">The price to stay in. How the numbers work.</p>
  <div class="coach-tabs" role="group" aria-label="Coach topics">
    {#each ['odds', 'equity', 'review'] as const as t (t)}<button
        aria-pressed={tab === t}
        onclick={() => setTab(t)}
        >{t === 'odds'
          ? 'Pot odds'
          : t === 'equity'
            ? 'Equity'
            : 'Last decision'}</button
      >{/each}
  </div>
  <div class="coach-topic">
    {#if tab !== 'review'}{@render course?.()}
      <p>
        These estimates use your cards, the shared cards, and guesses about what
        opponents might hold. The coach cannot see their hidden cards.
      </p>
      {@render odds(tab)}
      <p>
        <a href="#/lab/charts">Hand charts & poker reference →</a>
      </p>{/if}{#if tab === 'review'}<h3>Your last choice</h3>
      {@render decision?.()}
      <p>
        {feedback ||
          'Make a decision first. When an estimate is ready, I’ll compare your choice with the simple model here.'}
      </p>
      <p class="hint">
        A model grade is not a verdict. Later bets and different opponent hands
        can change the result.
      </p>{/if}
  </div>
</aside>
