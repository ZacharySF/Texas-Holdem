<script lang="ts">
  import { learningFacts } from '../../content/facts';
  import { replay, type Street } from '../../engine/game';
  import { evaluateReference } from '../../engine/evaluator';
  import type { PayoutResult } from '../../engine/payouts';
  import Histogram from '../../ui/Histogram.svelte';
  import type { PayoutResponse } from '../../workers/payout.worker';
  import { percent } from '../../ui/Probability';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import { analysisSeed, verifyCommitment, type SavedHand } from './storage';
  import { untrack } from 'svelte';

  let { hand }: { hand: SavedHand } = $props();
  let revealHidden = $state(false);
  let step = $state.raw(untrack(() => hand.actions.length));
  let street = $state.raw<Street>('preflop');
  let result = $state.raw<PayoutResult | null>(null);
  let running = $state.raw(false);
  let verification = $state.raw('');
  let seed = $state.raw(untrack(() => hand.config.seed));
  let error = $state.raw('');
  let worker: Worker | null | null = null;
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      return () => worker?.terminate();
    });
  });
  let final = $derived(replay(hand.config, hand.actions));
  let shown = $derived(replay(hand.config, hand.actions, step));
  async function run() {
    worker?.terminate();
    setRunning(true);
    setResult(null);
    setError('');
    const current = new Worker(
      new URL('../../workers/payout.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = current;
    current.onmessage = (event: MessageEvent<PayoutResponse>) => {
      if (worker !== current) return;
      const m = event.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        current.terminate();
        return;
      }
      setResult(m.result);
      if (m.type === 'result') {
        setRunning(false);
        current.terminate();
      }
    };
    current.onerror = () => {
      setError('Runout worker failed.');
      setRunning(false);
      current.terminate();
    };
    const runSeed = await analysisSeed(hand.config.seed, `runout:${street}`);
    if (worker === current)
      current.postMessage({
        players: final.players.map((p) => p.hand),
        contributions: final.finalContributions,
        folded: final.players.map(() => false),
        button: hand.config.button,
        board: final.boards[street] ?? [],
        method: 'monteCarlo',
        samples: 10000,
        seed: runSeed,
      });
  }
  function setStep(
    value: typeof step | ((previous: typeof step) => typeof step),
  ) {
    step = typeof value === 'function' ? value(step) : value;
  }
  function setStreet(
    value: typeof street | ((previous: typeof street) => typeof street),
  ) {
    street = typeof value === 'function' ? value(street) : value;
  }
  function setResult(
    value: typeof result | ((previous: typeof result) => typeof result),
  ) {
    result = typeof value === 'function' ? value(result) : value;
  }
  function setRunning(
    value: typeof running | ((previous: typeof running) => typeof running),
  ) {
    running = typeof value === 'function' ? value(running) : value;
  }
  function setVerification(
    value:
      | typeof verification
      | ((previous: typeof verification) => typeof verification),
  ) {
    verification = typeof value === 'function' ? value(verification) : value;
  }
  function setSeed(
    value: typeof seed | ((previous: typeof seed) => typeof seed),
  ) {
    seed = typeof value === 'function' ? value(seed) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<section class="panel history-panel">
  <h2>Hand history, replay, and x-ray</h2>
  <p>{new Date(hand.date).toLocaleString()} · {hand.persona}</p>
  <p class="hint">
    Replays preserve the recorded actions. Folded and uncontested hands stay
    hidden unless you reveal them for post-hand study.
  </p>
  <label
    ><input type="checkbox" bind:checked={revealHidden} /> Reveal hidden hands for
    post-hand study</label
  >
  <div class="replay-hands">
    {#each final.players as p, i (i)}{@const visible =
        i === 0 ||
        revealHidden ||
        (!p.folded &&
          final.players.filter((player) => !player.folded).length > 1)}
      <div>
        <h3>{i === 0 ? 'You' : `Seat ${i + 1}`}</h3>
        <PlayingCards cards={visible ? p.hand : []} hidden={visible ? 0 : 2}
        ></PlayingCards>{#if visible && final.board.length >= 3}<p>
            {evaluateReference([...p.hand, ...final.board]).name}
          </p>{/if}
      </div>{/each}
  </div>
  <p>Board at replay step {step}: {shown.street}</p>
  <PlayingCards cards={shown.board}></PlayingCards>{#if shown.runouts}<p>
      Second runout
    </p>
    <PlayingCards cards={shown.runouts[1]}></PlayingCards>{/if}
  <div class="play-actions">
    <button onclick={() => setStep(0)}>Replay this exact deal</button><button
      disabled={step === 0}
      onclick={() => setStep((n) => n - 1)}>Previous action</button
    ><button
      disabled={step === hand.actions.length}
      onclick={() => setStep((n) => n + 1)}>Next action</button
    ><button onclick={() => setStep(hand.actions.length)}
      >Show final result</button
    >
  </div>
  <ol class="action-history">
    {#each hand.actions as action, i (i)}<li
        aria-current={i === step - 1 ? 'step' : undefined}
      >
        <strong>{action.seat === 0 ? 'You' : `Seat ${action.seat + 1}`}</strong>
        · {action.street} · {action.action.type}{action.action.type === 'raise'
          ? ` to ${action.action.to}`
          : ''} · pot before action {action.pot}
      </li>{/each}
  </ol>
  <p>
    Returned uncalled chips: {final.returns.length
      ? final.returns
          .map(
            (r) => `${r.seat === 0 ? 'you' : `seat ${r.seat + 1}`} ${r.amount}`,
          )
          .join(', ')
      : 'none'}. Final awards: {final.awards
      .map((v, i) => `seat ${i + 1}: ${v}`)
      .join(', ')}.
  </p>
  <details>
    <summary>Verify the committed deal</summary>
    <p>Pre-deal SHA-256 commitment:</p>
    <code class="seed-code">{hand.commitment}</code><label for="verify-seed"
      >Revealed seed</label
    ><input
      id="verify-seed"
      value={seed}
      oninput={(e) => setSeed(e.currentTarget.value)}
    /><button
      onclick={() => {
        void verifyCommitment(seed, hand.commitment)
          .then((ok) =>
            setVerification(
              ok
                ? 'Verified: this seed matches the pre-deal commitment.'
                : 'Mismatch: this seed does not match the commitment.',
            ),
          )
          .catch(() => setVerification('Web Crypto is unavailable.'));
      }}>Verify seed</button
    >
    <p role="status">{verification}</p>
    <p class="hint">
      The seed replays the shuffle, hole cards, burns, and board. A local
      browser commitment checks consistency; it does not provide an independent
      server or prevent someone inspecting their own browser state.
    </p>
  </details>
  <details>
    <summary>Bot reasoning and your decision grades</summary
    >{#each hand.notes as note (note.index)}<div class="decision-note">
        <h3>
          Action {note.index + 1} · {note.seat === 0
            ? 'Your decision'
            : 'Bot x-ray'}
        </h3>
        <p>{note.reason}</p>
        <p>
          Estimated equity {percent(note.equity.players[0].equity.value)} · {note.equity.samples.toLocaleString()}
          samples · {learningFacts.confidence().display().percent} interval {percent(
            note.equity.players[0].equity.interval[0],
          )}–{percent(note.equity.players[0].equity.interval[1])}.
        </p>
        {#if note.reference}<p>
            Exact range equity {percent(note.reference.players[0].equity.value)} ·
            gap {(
              (note.equity.players[0].equity.value -
                note.reference.players[0].equity.value) *
              100
            ).toFixed(3)} percentage points.
          </p>{/if}{#if note.guess !== undefined}<p>
            Your pre-reveal estimate: {percent(note.guess)}.
          </p>{/if}<code class="seed-code"
          >Analysis seed: {note.analysisSeed}</code
        >
      </div>{/each}
  </details>
  <h3>Run this street out 10,000 times</h3>
  <p>
    This comparison deals one board per trial, even for a hand originally run
    twice.
  </p>
  <label for="runout-street">Start from</label><select
    id="runout-street"
    value={street}
    disabled={running}
    onchange={(e) => {
      setStreet(e.currentTarget.value as Street);
      setResult(null);
    }}
    >{#each Object.keys(final.boards) as Street[] as s (s)}<option value={s}
        >{s}</option
      >{/each}</select
  ><button disabled={running} onclick={() => void run()}
    >Run out 10,000 times</button
  >{#if running}<button
      onclick={() => {
        worker?.terminate();
        worker = null;
        setRunning(false);
      }}>Cancel runout</button
    >{/if}{#if error}<p role="alert">{error}</p>{/if}
  <p class="hint">
    All revealed hands stay fixed; future board cards are re-dealt without
    replacement. This is a showdown experiment using the final matched
    contributions, including for a hand that originally ended in a fold. It does
    not replay future betting.
  </p>
  {#if result}<p>
      {result.method} · {result.samples.toLocaleString()} samples. Expected net chips:
      {(result.meanAwards[0] - final.finalContributions[0]).toFixed(
        2,
      )}.{learningFacts.confidence().display().percent} interval: {result.intervals[0]
        .map((v) => (v - final.finalContributions[0]).toFixed(2))
        .join(' to ')}.
    </p>
    <Histogram
      label="Net chip outcome frequencies"
      items={result.heroOutcomes.map((b) => ({
        value: b.award - final.finalContributions[0],
        count: b.count,
      }))}
    ></Histogram>
    <p>
      This comparison runs one board per trial, even for a hand dealt twice.
      Each sampled deal settles every main and side pot using its eligibility
      and odd-chip order.
    </p>{/if}
</section>
