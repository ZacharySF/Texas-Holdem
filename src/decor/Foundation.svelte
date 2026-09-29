<script lang="ts">
  import '../styles/decor.css';
  import displayFont from '../styles/fonts/archivo-latin.woff2?url';
  import { SITE_NAME } from './site';
  import Atmosphere from '../lib/softclub/Atmosphere.svelte';
</script>

<svelte:head
  ><title>{SITE_NAME}</title><link
    rel="preload"
    href={displayFont}
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  /></svelte:head
>

<span aria-hidden="true" class="decor-foundation"></span>
<Atmosphere />

<style>
  .decor-foundation {
    display: none;
    pointer-events: none;
  }
</style>
