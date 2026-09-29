import type { Persona } from '../../engine/bots';
import { evaluateReference } from '../../engine/evaluator';
import { potSize, type Game, type Action } from '../../engine/game';
import { SvelteView } from '../../bridge/SvelteView';
import TableView from './Table.svelte';

const names = ['You', 'River', 'Jules', 'Ash', 'Morgan', 'Quinn'];
export const seatName = (seat: number) => names[seat] ?? `Seat ${seat + 1}`;
export const botStyles: Record<Persona, { name: string; description: string }> =
  {
    'tight-passive': {
      name: 'The patient player',
      description:
        'Compares chip returns against tighter estimated opponent ranges.',
    },
    'loose-aggressive': {
      name: 'The pressure player',
      description:
        'Compares chip returns against wider ranges and looser raise responses.',
    },
    'calling-station': {
      name: 'The curious caller',
      description:
        'Assumes opponents call raises more often; still folds losing calls.',
    },
    'equity-driven': {
      name: 'The calculator',
      description:
        'Compares folding, checking or calling, and several legal raise sizes.',
    },
  };
export function actionText(action: Action) {
  return action.type === 'raise'
    ? `Raised to ${action.to}`
    : { fold: 'Folded', check: 'Checked', call: 'Called' }[action.type];
}
export function Table({ game, persona }: { game: Game; persona: Persona }) {
  const total = game.complete
    ? game.finalContributions.reduce((a, b) => a + b, 0)
    : potSize(game);
  const handLabel =
    game.board.length >= 3 && !game.players[0].folded
      ? evaluateReference([...game.players[0].hand, ...game.board]).name
      : undefined;
  return (
    <SvelteView
      component={TableView}
      props={{
        game,
        total,
        handLabel,
        botDescription: botStyles[persona].name,
        seatName,
        actionText,
      }}
    />
  );
}
