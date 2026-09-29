<script lang="ts">
  let { value, total }: { value: number; total: number } = $props();
</script>

<div class="stripe-value drill-stripe" aria-hidden="true">
  <span
    style:width={`${total > 0 ? Math.max(0, Math.min(1, value / total)) * 100 : 0}%`}
  ></span>
</div>
