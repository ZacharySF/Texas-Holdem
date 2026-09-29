<script lang="ts">
  import { SITE_NAME } from './site';
  let { n }: { n: string | number } = $props();
</script>

<div class="decor-issue decor" aria-hidden="true">
  <span class="decor-micro">{SITE_NAME} / vol.</span><b
    >{String(n).padStart(2, '0')}</b
  >
</div>
