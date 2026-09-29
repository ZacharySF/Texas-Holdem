import type { Persona } from '../../engine/bots';
import { type Action } from '../../engine/game';
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
