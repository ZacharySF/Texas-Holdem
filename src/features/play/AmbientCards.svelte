<script lang="ts">
  import { onMount } from 'svelte';
  import { Rng } from '../../engine/rng';
  import { assetUrl, visualConfig } from '../../visual/config';

  const config = visualConfig.motion.heroCards;
  const art = [
    ...['ace', 'king', 'queen', 'jack'].flatMap((rank) =>
      ['spades', 'hearts', 'clubs', 'diamonds'].map(
        (suit) => `${rank}_of_${suit}`,
      ),
    ),
    'black_joker',
    'red_joker',
  ];
  let slots = $state(
    Array.from({ length: config.count }, (_, i) => ({
      art: art[i],
      x: config.columns[i],
      y: config.topMin,
      duration: config.durationMinMs,
      delay: 0,
      version: 0,
    })),
  );
  let active = $state(false);
  let host: HTMLDivElement;
  let rng: Rng;

  function next(index: number) {
    if (!rng) return;
    const previous = art.indexOf(slots[index].art);
    const card = (previous + 1 + rng.int(art.length - 1)) % art.length;
    slots[index] = {
      art: art[card],
      x: config.columns[index] + rng.int(config.horizontalSpread),
      y: config.topMin + rng.int(config.verticalSpread),
      duration: config.durationMinMs + rng.int(config.durationSpreadMs),
      delay: rng.int(config.gapMaxMs),
      version: slots[index].version + 1,
    };
  }
  onMount(() => {
    // Decorative randomness is independent of the game's seed/crypto stream.
    rng = new Rng(Date.now().toString(16).padStart(32, '0'));
    slots.forEach((_, i) => next(i));
    let visible = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      active = visible && !document.hidden && !reduced.matches;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(host);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  });
</script>

<div class="ambient-cards" bind:this={host} aria-hidden="true">
  {#each slots as slot, i (i)}
    {#key slot.version}
      <img
        class="ambient-card"
        src={assetUrl(`cards/art/${slot.art}.svg`)}
        alt=""
        draggable="false"
        style:left={`${slot.x}%`}
        style:top={`${slot.y}%`}
        style:animation-duration={`${slot.duration}ms`}
        style:animation-delay={`${slot.delay}ms`}
        style:animation-play-state={active ? 'running' : 'paused'}
        onanimationend={() => next(i)}
      />
    {/key}
  {/each}
</div>
