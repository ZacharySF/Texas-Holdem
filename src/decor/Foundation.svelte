<script lang="ts">
  import '../styles/decor.css';
  import { SITE_NAME } from './site';
</script>

<svelte:head><title>{SITE_NAME}</title></svelte:head>

<span aria-hidden="true" class="decor-foundation"></span>

<style>
  .decor-foundation {
    display: none;
    pointer-events: none;
  }
</style>
