<script lang="ts">
  import DisplayPlate from '../../lib/DisplayPlate.svelte';
  import LoungeArtwork from '../../lib/LoungeArtwork.svelte';
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
    <p>heads-up or six-max.</p>
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
      <a class="button" href="#/play/tournament">Tournament · timed, no coach</a
      >
    </div>
  </div>
  <LoungeArtwork />
  <DisplayPlate />
  <HomeNavigation {onplay} disabled={dealing || bankroll < 1} />
</section>
