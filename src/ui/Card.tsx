import type { Card as CardValue } from '../engine/cards';
import { SvelteView } from '../bridge/SvelteView';
import CardFace from './CardFace.svelte';
export const suitSymbols = ['♣', '♦', '♥', '♠'];
export const suitNames = ['clubs', 'diamonds', 'hearts', 'spades'];
export function Card({
  card,
  onClick,
  label,
}: {
  card?: CardValue;
  onClick: () => void;
  label: string;
}) {
  return (
    <SvelteView
      className="card-face-host"
      component={CardFace}
      props={{ card, onclick: onClick, label }}
    />
  );
}
