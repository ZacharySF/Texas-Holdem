import { expect, it } from 'vitest';
import { decodeState, newSeed, type LabState } from './state';
import { Rng } from '../../engine/rng';
const fallback: LabState = {
  players: [[51, 50], 'random'],
  board: [],
  dead: [],
  seed: '0123456789abcdef0123456789abcdef',
  method: 'monteCarlo',
  samples: 10000,
};
it('round-trips a full reproducible setup and permits an unfinished hand', () => {
  expect(decodeState(JSON.stringify(fallback), fallback)).toEqual({
    state: fallback,
  });
  const state = {
    ...fallback,
    players: [[51], [], 'random'],
    board: [1, 3],
    dead: [5, 7],
  };
  expect(decodeState(JSON.stringify(state), fallback)).toEqual({ state });
  expect(decodeState(null, fallback)).toEqual({ state: fallback });
});
it('rejects malformed, duplicate, and impossible URL values without crashing', () => {
  for (const input of [
    '{',
    'null',
    '42',
    JSON.stringify({ ...fallback, players: ['random', 'random'] }),
    JSON.stringify({
      ...fallback,
      players: [
        [51, 50],
        [51, 49],
      ],
    }),
    JSON.stringify({ ...fallback, seed: '0'.repeat(32) }),
    JSON.stringify({ ...fallback, board: [52] }),
    JSON.stringify({ ...fallback, samples: 1.5 }),
    JSON.stringify({ ...fallback, method: 'unknown' }),
  ]) {
    const decoded = decodeState(input, fallback);
    expect(decoded.state).toEqual(fallback);
    expect(decoded.error).toBeTruthy();
  }
});
it('creates a valid cryptographic seed outside the engine', () => {
  const seed = newSeed();
  expect(seed).toMatch(/^[0-9a-f]{32}$/);
  expect(() => new Rng(seed)).not.toThrow();
});
