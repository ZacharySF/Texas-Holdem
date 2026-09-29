<script lang="ts">
  import DecorShell from './decor/DecorShell.svelte';
  import Foundation from './decor/Foundation.svelte';
  import { onMount } from 'svelte';
  import Routes from './Routes.svelte';
  import { navigation, navigate } from './navigation.svelte';
  import { fourColorDeck, theme } from './visual/display';
  import { parallax } from './visual/parallax';
  import { visualConfig } from './visual/config';
  const modes = [
    ['play', 'Play'],
    ['learn', 'Course'],
    ['arcade', 'Drills'],
    ['lab', 'Tools'],
    ['stats', 'Progress'],
  ];
  let path = $derived(navigation.path);
  let homeVisit = $state(0);
  function goHome(event: MouseEvent) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate('/play');
    // The table and lobby share a URL. A home visit must also reset page state.
    homeVisit += 1;
    window.scrollTo(0, 0);
  }
  function readDeck() {
    try {
      return (
        JSON.parse(localStorage.getItem('holdem-settings') ?? '{}')
          .fourColor === true
      );
    } catch {
      return false;
    }
  }
  function readTheme(): 'dark' | 'blue' {
    try {
      return JSON.parse(localStorage.getItem('holdem-settings') ?? '{}')
        .theme === 'blue'
        ? 'blue'
        : 'dark';
    } catch {
      return 'dark';
    }
  }
  let selectedTheme = $state(readTheme());
  let fourColor = $state(readDeck());
  $effect(() => {
    document.documentElement.dataset.theme = selectedTheme;
    theme.set(selectedTheme);
    document.documentElement.dataset.fourColor = String(fourColor);
    fourColorDeck.set(fourColor);
    try {
      localStorage.setItem(
        'holdem-settings',
        JSON.stringify({ theme: selectedTheme, fourColor }),
      );
    } catch {
      /* Memory-only settings remain available. */
    }
  });
  onMount(() => {
    if (!location.hash) navigate('/play', true);
    const change = () => {
      navigation.sync();
    };
    change();
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  });
</script>

<Foundation />

<div class="page-atmosphere" aria-hidden="true">
  <div
    class="tunnel-light"
    use:parallax={{ ...visualConfig.motion.tunnel, fixed: true }}
  ></div>
  <div class="corner-light"></div>
</div>
<svg class="filter-definitions" aria-hidden="true">
  <defs>
    <linearGradient id="chart-ink" x1="0" y1="1" x2="0" y2="0">
      <stop offset={0} stop-color="var(--violet)" />
      <stop offset={1} stop-color="var(--ice)" />
    </linearGradient>
  </defs>
</svg>
<svg class="film-grain" aria-hidden="true"
  ><filter id="film-grain"
    ><feTurbulence
      type="fractalNoise"
      baseFrequency="0.85"
      numOctaves="3"
      stitchTiles="stitch"
      seed="21"
    /></filter
  ><rect width="100%" height="100%" filter="url(#film-grain)" /></svg
>
<a
  class="skip-link"
  href="#main-content"
  onclick={(e) => {
    e.preventDefault();
    document.getElementById('main-content')?.focus();
  }}>Skip to content</a
>
<header class="app-header">
  <a
    href="#/play"
    class="brand"
    aria-label="contemprorary home"
    onclick={goHome}>contemprorary</a
  >
  <nav aria-label="Main navigation">
    {#each modes as [route, label] (route)}<a
        href={`#/${route}`}
        class:active={path.startsWith('/' + route)}
        aria-current={path.startsWith('/' + route) ? 'page' : undefined}
        >{label}</a
      >{/each}
  </nav>
  <details class="settings">
    <summary>Display</summary>
    <div class="display-menu">
      <span>Dark theme</span>
      <div class="theme-options" role="group" aria-label="Color theme">
        <button
          aria-pressed={selectedTheme === 'dark'}
          onclick={() => (selectedTheme = 'dark')}>Violet</button
        >
        <button
          aria-pressed={selectedTheme === 'blue'}
          onclick={() => (selectedTheme = 'blue')}>Blue</button
        >
      </div>
      <label
        ><input type="checkbox" bind:checked={fourColor} /> Four-color deck</label
      >
    </div>
  </details>
</header>
<DecorShell><Routes {homeVisit} /></DecorShell>
