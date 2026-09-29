<script lang="ts">
  import { untrack } from 'svelte';
  import { Rng } from '../engine/rng';

  let {
    seed,
    onCommit,
  }: {
    seed: string;
    onCommit: (seed: string) => void;
  } = $props();
  let draft = $state.raw(untrack(() => seed));
  let error = $state.raw('');
  function commit() {
    try {
      new Rng(draft);
      setError('');
      if (draft !== seed) onCommit(draft);
    } catch {
      setDraft(seed);
      setError('Seed unchanged. Use 32 hexadecimal digits, not all zero.');
    }
  }
  function setDraft(
    value: typeof draft | ((previous: typeof draft) => typeof draft),
  ) {
    draft = typeof value === 'function' ? value(draft) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<input
  id="seed"
  value={draft}
  spellcheck={false}
  maxlength={32}
  aria-invalid={!!error}
  aria-describedby={error ? 'seed-error' : undefined}
  oninput={(e) => {
    setDraft(e.currentTarget.value);
    setError('');
  }}
  onblur={commit}
  onkeydown={(e) => {
    if (e.key === 'Enter') commit();
  }}
/>{#if error}<p id="seed-error" role="alert" class="error">{error}</p>{/if}
