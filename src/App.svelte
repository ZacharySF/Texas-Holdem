<script lang="ts">
  import { SITE_NAME } from './decor/site';
  import DecorShell from './decor/DecorShell.svelte';
  import Foundation from './decor/Foundation.svelte';
  import { onMount } from 'svelte';
  import Routes from './Routes.svelte';
  import { navigation, navigate } from './navigation.svelte';
  import { fourColorDeck, theme } from './visual/display';
  import { themes, isTheme, type ThemeId } from './lib/themes';
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
  function readTheme(): ThemeId {
    try {
      const saved = JSON.parse(
        localStorage.getItem('holdem-settings') ?? '{}',
      ).theme;
      return isTheme(saved) ? saved : 'dark';
    } catch {
      return 'dark';
    }
  }
  let selectedTheme = $state(readTheme());
  let fourColor = $state(readDeck());
  $effect(() => {
    document.documentElement.dataset.theme = selectedTheme;
    // Preserve the legacy renderer's two palettes; DOM materials use the full theme tokens.
    theme.set(
      selectedTheme === 'blue' || selectedTheme === 'ocean' ? 'blue' : 'dark',
    );
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
  function surpriseTheme() {
    const choices = themes.filter((item) => item.id !== selectedTheme);
    const random = crypto.getRandomValues(new Uint32Array(1))[0];
    selectedTheme = choices[random % choices.length].id;
  }
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
<header class="app-header sc-glass sc-glass--live">
  <a
    href="#/play"
    class="brand"
    aria-label="contemprorary home"
    onclick={goHome}>{SITE_NAME}</a
  >
  <nav aria-label="Main navigation">
    {#each modes as [route, label], i (route)}<a
        href={`#/${route}`}
        class:active={path.startsWith('/' + route)}
        aria-current={path.startsWith('/' + route) ? 'page' : undefined}
        ><span class="section-code" aria-hidden="true">0{i + 1}</span>{label}</a
      >{/each}
  </nav>
</header>
<DecorShell><Routes {homeVisit} /></DecorShell>

<div class="display-dock">
  <details class="settings" id="display-settings">
    <summary>Display</summary>
    <div class="display-menu sc-glass sc-glass--live">
      <span>Choose a theme</span>
      <div class="theme-options" role="group" aria-label="Color theme">
        {#each themes as option (option.id)}
          <button
            aria-pressed={selectedTheme === option.id}
            onclick={() => (selectedTheme = option.id)}>{option.label}</button
          >
        {/each}
      </div>
      <button class="surprise-theme" onclick={surpriseTheme}>Surprise me</button
      >
      <label
        ><input type="checkbox" bind:checked={fourColor} /> Four-color deck</label
      >
    </div>
  </details>
</div>
