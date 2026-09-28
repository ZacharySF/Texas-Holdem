import { assertCards, type Card } from '../../engine/cards';
import { Rng } from '../../engine/rng';
import type { Method } from '../../engine/equity';
export interface LabState {
  players: (Card[] | 'random')[];
  board: Card[];
  dead: Card[];
  seed: string;
  samples: number;
  method: Method;
}
export function newSeed(): string {
  let words: Uint32Array;
  do {
    words = crypto.getRandomValues(new Uint32Array(4));
  } while (words.every((w) => w === 0));
  return [...words].map((w) => w.toString(16).padStart(8, '0')).join('');
}
export function decodeState(
  raw: string | null,
  fallback: LabState,
): { state: LabState; error?: string } {
  if (!raw) return { state: fallback };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error();
    const v = value as Record<string, unknown>;
    const cards = (x: unknown): x is Card[] =>
      Array.isArray(x) && x.every((c) => typeof c === 'number');
    if (
      !Array.isArray(v.players) ||
      v.players.length < 2 ||
      v.players.length > 9 ||
      !v.players.every((p) => p === 'random' || (cards(p) && p.length <= 2)) ||
      v.players[0] === 'random' ||
      !cards(v.board) ||
      v.board.length > 5 ||
      !cards(v.dead) ||
      typeof v.seed !== 'string' ||
      typeof v.samples !== 'number' ||
      !Number.isInteger(v.samples) ||
      v.samples < 1 ||
      v.samples > 1000000 ||
      !['exact', 'monteCarlo', 'auto'].includes(String(v.method))
    )
      throw new Error();
    new Rng(v.seed);
    assertCards([
      ...v.players.flatMap((p) => (p === 'random' ? [] : (p as Card[]))),
      ...v.board,
      ...v.dead,
    ]);
    return { state: v as unknown as LabState };
  } catch {
    return {
      state: fallback,
      error:
        'This link contains an invalid setup. The default cards are shown.',
    };
  }
}
