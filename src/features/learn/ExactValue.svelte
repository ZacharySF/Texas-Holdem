<script lang="ts">
  import { Rational } from '../../engine/math';
  let {
    value,
    label = 'Exact probability',
  }: {
    value: Rational;
    label?: string;
  } = $props();
  let display = $derived(value.display());
</script>

<div class="exact-value">
  <h4>{label}</h4>
  <dl>
    <div>
      <dt>Fraction</dt>
      <dd>{display.fraction}</dd>
    </div>
    <div>
      <dt>Percent</dt>
      <dd>{display.percent}</dd>
    </div>
    <div>
      <dt>One in</dt>
      <dd>{display.oneIn}</dd>
    </div>
    <div>
      <dt>Odds against</dt>
      <dd>{display.against}</dd>
    </div>
  </dl>
</div>
