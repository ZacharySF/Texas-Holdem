<script lang="ts">
  import { Rational } from '../../engine/math';
  import { fractionTex } from '../../content/facts';
  import Formula from './Formula.svelte';
  let { value }: { value: bigint | number } = $props();
</script>

<Formula tex={fractionTex(new Rational(value))}></Formula>
