<script lang="ts">
  import { attachCallout } from './callout';
  let { selector, label }: { selector: string; label: string } = $props();
</script>

<svg
  class="graphic-callout decor"
  aria-hidden="true"
  use:attachCallout={{ selector, label }}><path /><text /></svg
>
