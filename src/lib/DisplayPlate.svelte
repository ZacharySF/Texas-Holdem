<script lang="ts">
  import PhotoPlate from '../decor/PhotoPlate.svelte';
  import { parallax } from '../visual/parallax';

  function openDisplay() {
    const settings = document.getElementById('display-settings');
    if (!(settings instanceof HTMLDetailsElement)) return;
    settings.open = true;
    settings.scrollIntoView({ block: 'start', behavior: 'instant' });
    settings.querySelector('summary')?.focus({ preventScroll: true });
  }
</script>

<button
  type="button"
  class="display-plate"
  aria-label="Change display"
  aria-controls="display-settings"
  onclick={openDisplay}
>
  <span
    class="plate-depth"
    aria-hidden="true"
    use:parallax={{ speed: 0.985, pointer: 3 }}><PhotoPlate /></span
  >
  <span class="display-plate-label">Change display</span>
</button>
