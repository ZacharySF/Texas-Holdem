<script lang="ts">
  let {
    onplay,
    disabled = false,
  }: { onplay: (seats: number) => void; disabled?: boolean } = $props();
</script>

<nav class="home-graphic-nav" aria-label="Explore poker">
  <button {disabled} onclick={() => onplay(2)}>heads-up</button>
  <button {disabled} onclick={() => onplay(6)}>six-max</button>
  <a href="#/arcade">outs</a>
  <a href="#/lab">equity</a>
</nav>
