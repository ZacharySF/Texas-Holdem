<script lang="ts">
  import { SITE_NAME } from '../../decor/site';
  import HomeNavigation from '../../decor/HomeNavigation.svelte';
  let {
    seats,
    dealing,
    bankroll,
    onplay,
  }: {
    seats: number;
    dealing: boolean;
    bankroll: number;
    onplay: (tableSeats: number) => void;
  } = $props();
</script>

<section class="home-hero">
  <div class="home-title">
    <h2 aria-label="contemprorary">{SITE_NAME}</h2>
    <p>heads-up or six-max. the math is on screen.</p>
    <div class="home-actions">
      <button
        class="primary start-game"
        disabled={dealing || bankroll < 1}
        onclick={() => onplay(seats)}
        >{dealing ? 'Shuffling…' : 'Take a seat & play'}</button
      >
      <button disabled={dealing || bankroll < 1} onclick={() => onplay(6)}
        >Six-player table</button
      >
    </div>
  </div>
  <HomeNavigation {onplay} disabled={dealing || bankroll < 1} />
</section>
