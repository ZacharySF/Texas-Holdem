<script lang="ts">
  import { visibleMotion } from './motion';
  let { march = true }: { march?: boolean } = $props();
</script>

<div
  class="decor-chevrons decor decor-micro"
  class:march
  aria-hidden="true"
  use:visibleMotion
>
  <span
    >&gt;&gt;&gt; &gt;&gt; &gt;&gt;&gt; &nbsp; &gt;&gt; &gt;&gt;&gt; &gt;&gt;</span
  >
</div>
