<script lang="ts">
  import { sectionFor } from './sections';
  let { path }: { path: string } = $props();
  let section = $derived(sectionFor(path));
</script>

<header class="page-masthead sc-masthead-surface">
  <div class="panel-label">{section.code} / {section.name}</div>
  <h1
    data-masthead={path.startsWith('/lab')
      ? 'glass'
      : path.startsWith('/arcade')
        ? 'glow'
        : 'chrome'}
  >
    {path === '/play/tournament' ? 'tournament' : section.name}
  </h1>
</header>
