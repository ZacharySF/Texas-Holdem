<script lang="ts">
  import GeneratorLab from './GeneratorLab.svelte';
  import WindowFrame from './WindowFrame.svelte';
  import Fetch from './Fetch.svelte';
  import { sitePath } from './site';
  import { readouts } from './readouts';
</script>

<main class="decor-lab" id="main-content" tabindex="-1">
  <h1>Decor laboratory</h1>
  <p>
    Seeded imagery, type, and graphic objects. Controls affect this development
    preview only.
  </p>
  <GeneratorLab />
  <section class="lab-chrome">
    <h2>Shared window chrome</h2>
    <WindowFrame title={sitePath('decor-lab')} active
      ><Fetch {...readouts()} /></WindowFrame
    >
  </section>
</main>
