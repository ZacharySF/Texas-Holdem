<script lang="ts">
  import { Rational } from '../../engine/math';
  import ExactValue from './ExactValue.svelte';
</script>

<ExactValue
  label="Impossible: a fifth suit in this deck"
  value={new Rational(0)}
></ExactValue><ExactValue
  label="Certain: the card has one of the four suits"
  value={new Rational(1)}
></ExactValue>
