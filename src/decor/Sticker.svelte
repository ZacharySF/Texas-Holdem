<script lang="ts">
  let { text, tilt = -3 }: { text: string; tilt?: number } = $props();
</script>

<span
  class="graphic-sticker decor decor-micro"
  aria-hidden="true"
  style:rotate={`${tilt}deg`}>{text}</span
>
