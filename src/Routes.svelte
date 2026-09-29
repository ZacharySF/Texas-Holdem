<script lang="ts">
  import type { Component } from 'svelte';
  import { navigation, navigate } from './navigation.svelte';
  let { homeVisit = 0 }: { homeVisit?: number } = $props();
  const routes: [RegExp, () => Promise<{ default: Component }>][] = [
    [/^\/play$/, () => import('./features/play/Play.svelte')],
    [
      /^\/play\/tournament$/,
      () => import('./features/tournament/Tournament.svelte'),
    ],
    [/^\/learn(?:\/[^/]+)?$/, () => import('./features/learn/Learn.svelte')],
    [/^\/lab$/, () => import('./features/lab/Lab.svelte')],
    [/^\/lab\/charts$/, () => import('./features/lab/HandCharts.svelte')],
    [/^\/lab\/events$/, () => import('./features/lab/EventBuilder.svelte')],
    [/^\/lab\/bankroll$/, () => import('./features/lab/BankrollLab.svelte')],
    [/^\/lab\/ranges$/, () => import('./features/lab/RangeLab.svelte')],
    [/^\/lab\/shuffle$/, () => import('./features/lab/ShuffleLab.svelte')],
    [
      /^\/lab\/tools\/[^/]+$/,
      () => import('./features/lab/FinalCalculators.svelte'),
    ],
    [/^\/arcade$/, () => import('./features/arcade/OutsRush.svelte')],
    [/^\/arcade\/streak$/, () => import('./features/arcade/StreakTrap.svelte')],
    [/^\/arcade\/akq$/, () => import('./features/arcade/Akq.svelte')],
    [
      /^\/arcade\/[^/]+$/,
      () => import('./features/arcade/DecisionDrills.svelte'),
    ],
    [/^\/stats$/, () => import('./features/stats/Stats.svelte')],
  ];
  let route = $derived(
    routes.find(([pattern]) => pattern.test(navigation.path)),
  );
  let page = $derived(route?.[1]());
  $effect(() => {
    if (!route) navigate('/play', true);
  });
  let links = $derived(
    navigation.path.startsWith('/lab')
      ? [
          ['/lab', 'Equity'],
          ['/lab/charts', 'Hand charts'],
          ['/lab/events', 'Event builder'],
          ['/lab/bankroll', 'Bankroll paths'],
          ['/lab/ranges', 'Ranges'],
          ['/lab/shuffle', 'Shuffle Lab'],
          ['/lab/tools/insurance', 'Insurance'],
          ['/lab/tools/push', 'Push/fold'],
          ['/lab/tools/icm', 'ICM'],
          ['/lab/tools/sizing', 'Kelly'],
        ]
      : navigation.path.startsWith('/arcade')
        ? [
            ['/arcade', 'Outs Rush'],
            ['/arcade/call', 'Call or Fold'],
            ['/arcade/guess', 'Guess the Equity'],
            ['/arcade/combo', 'Combo Counter'],
            ['/arcade/streak', 'Streak Trap'],
            ['/arcade/akq', 'AKQ game'],
          ]
        : [],
  );
  let help = $derived(
    navigation.path.startsWith('/lab')
      ? 'Tools let you explore a specific poker question. Choose one below, or follow the course for a guided introduction.'
      : navigation.path.startsWith('/arcade')
        ? 'Drills are short games for practicing one skill at a time. Pick a game below; your scores are saved on this device.'
        : navigation.path.startsWith('/stats')
          ? 'Your completed hands and forecasts appear here. Play a hand or finish a drill to start building your history.'
          : '',
  );
</script>

<div id="main-content" tabindex="-1">
  {#if help}<div class="mode-guide">
      <p>{help}</p>
      <a href="#/learn">Find your next lesson →</a>
    </div>{/if}
  {#if links.length}<nav class="tool-nav" aria-label="Tools">
      {#each links as [to, label] (to)}<a
          href={'#' + to}
          class:active={navigation.path === to}
          aria-current={navigation.path === to ? 'page' : undefined}>{label}</a
        >{/each}
    </nav>{/if}
  {#await page}<p role="status">
      Loading…
    </p>{:then module}{#if module}{#key homeVisit}<module.default
        />{/key}{/if}{:catch error}<p role="alert">
      This page could not load. Reload to try again. {error instanceof Error
        ? error.message
        : ''}
    </p>{/await}
</div>
