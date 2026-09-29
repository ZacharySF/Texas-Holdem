import './PlayingCards.css';
import type { Card } from '../engine/cards';
import { SvelteView } from '../bridge/SvelteView';
import CardRow from './PlayingCards.svelte';
export function PlayingCards(props: {
  cards: readonly Card[];
  hidden?: number;
  highlight?: readonly Card[];
}) {
  return (
    <SvelteView className="card-row-host" component={CardRow} props={props} />
  );
}
