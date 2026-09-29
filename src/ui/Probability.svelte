<script lang="ts">
  import { learningFacts } from '../content/facts';
  import { Rational } from '../engine/math';
  import type { Probability as Value } from '../engine/equity';
  import { percent } from './Probability';
  let {
    label,
    value,
    sampled,
  }: {
    label: string;
    value: Value;
    sampled: boolean;
  } = $props();
  let display = $derived(
    new Rational(BigInt(value.numerator), BigInt(value.denominator)).display(),
  );
</script>

<div class="probability">
  <span class="field-label">{label}</span><strong>{display.percent}</strong
  ><span class="fraction">{display.fraction}</span><span>{display.oneIn}</span
  ><span>{display.against}</span><small
    >{sampled
      ? `${learningFacts.confidence().display().percent} CI`
      : 'Exact interval'}: {percent(value.interval[0])}–{percent(
      value.interval[1],
    )}</small
  >
</div>
