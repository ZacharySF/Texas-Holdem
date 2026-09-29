<script lang="ts">
  let { reflection = false }: { reflection?: boolean } = $props();
</script>

<span class="sc-terminal-field" aria-hidden="true">
  <span class="sc-terminal-exposures" aria-hidden="true"
    ><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"
    ></i></span
  >
  <span class="sc-terminal-mesh" aria-hidden="true"></span>
  <span
    class="sc-terminal-streaks"
    class:sc-reflected-streaks={reflection}
    aria-hidden="true"
    ><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"
    ></i></span
  >
</span>
