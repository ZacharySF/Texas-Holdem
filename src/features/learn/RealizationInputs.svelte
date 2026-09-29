<script lang="ts">
  import { advancedFacts } from '../../content/facts';

  let s = $derived(advancedFacts.realizationSetup());
</script>

In the example, raw equity {s.equity.toString()} of a {s.pot}-chip pot is the
benchmark expected award; the model captures {s.capture.toString()} of that award
before subtracting a {s.cost}-chip cost.
