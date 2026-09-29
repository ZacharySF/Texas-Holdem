<script lang="ts">
  import type { Card as CardValue } from '../engine/cards';
  import CardFace from './CardFace.svelte';
  let {
    card,
    onClick,
    label,
  }: {
    card?: CardValue;
    onClick: () => void;
    label: string;
  } = $props();
</script>

<div class="card-face-host">
  <CardFace {...{ card, onclick: onClick, label }} />
</div>
