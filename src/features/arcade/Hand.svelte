<script lang="ts">
  import {
    kuhnDeal,
    kuhnBot,
    kuhnTerminal,
    kuhnEquilibrium,
  } from '../../engine/kuhn';
  import { Rng } from '../../engine/rng';

  let { seed }: { seed: string } = $props();
  let cards = $state.raw((() => kuhnDeal(seed))());
  let history = $state.raw('');
  let transcript = $state.raw<string[]>([]);
  let result = $derived(kuhnTerminal(cards, history));
  let facing = $derived(history.endsWith('b'));
  function submit(action: 'p' | 'b') {
    if (result !== null) return;
    let h = history + action;
    const notes = [
      ...transcript,
      `You ${action === 'b' ? (facing ? 'call' : 'bet') : facing ? 'fold' : 'check'}.`,
    ];
    if (kuhnTerminal(cards, h) === null && h.length % 2 === 1) {
      const rng = new Rng(seed);
      for (let i = 0; i < 8 + h.length; i++) rng.nextUint32();
      const a = kuhnBot(cards[1], h, rng);
      notes.push(
        `Bot ${a === 'b' ? (h.endsWith('b') ? 'calls' : 'bets') : h.endsWith('b') ? 'folds' : 'checks'}.`,
      );
      h += a;
    }
    setHistory(h);
    setTranscript(notes);
  }
  function setHistory(
    value: typeof history | ((previous: typeof history) => typeof history),
  ) {
    history = typeof value === 'function' ? value(history) : value;
  }
  function setTranscript(
    value:
      typeof transcript | ((previous: typeof transcript) => typeof transcript),
  ) {
    transcript = typeof value === 'function' ? value(transcript) : value;
  }
</script>

<section class="panel">
  <h2>Your card: {['Q', 'K', 'A'][cards[0]]}</h2>
  <p>Bot card: {result === null ? 'hidden' : ['Q', 'K', 'A'][cards[1]]}</p>
  <div class="tool-actions">
    <button disabled={result !== null} onclick={() => submit('p')}
      >{facing ? 'Fold' : 'Check'}</button
    ><button disabled={result !== null} onclick={() => submit('b')}
      >{facing ? 'Call' : 'Bet one'}</button
    >
  </div>
  <ol>
    {#each transcript as line, i (i)}<li>{line}</li>{/each}
  </ol>
  {#if result !== null}<p role="status">
      Your net result: {result} chips. Bot result: {-result}.
    </p>
    <p>Revealed seed: <code>{seed}</code></p>
    <details>
      <summary>Bot policy at every public information set</summary
      >{#each Object.entries(kuhnEquilibrium()) as [key, p] (key)}<p>
          {key}: bet/call frequency {p.toFixed(4)}.
        </p>{/each}
    </details>
    <button
      onclick={() => {
        setHistory('');
        setTranscript([]);
      }}>Replay this exact deal</button
    >{/if}
</section>
