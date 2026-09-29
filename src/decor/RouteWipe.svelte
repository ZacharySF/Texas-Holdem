<script lang="ts">
  import { navigation } from '../navigation.svelte';
  import { visibleMotion } from './motion';
</script>

{#key navigation.path}<div
    class="decor-route-wipe decor"
    aria-hidden="true"
    use:visibleMotion
  >
    <i></i>
  </div>{/key}
