<script lang="ts">
  let { title }: { title: string } = $props();
</script>

<div class="decor-window-title decor decor-micro" aria-hidden="true">
  <span>❯ {title}</span><span>− &nbsp; [ ] &nbsp; ×</span>
</div>
