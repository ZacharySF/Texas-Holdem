import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import {
  seedHash,
  analysisSeed,
  verifyCommitment,
  saveHand,
  loadHands,
  awardHand,
  emptyProfile,
  parseProfile,
  type SavedHand,
} from './storage';
import { act, newGame, replay } from '../../engine/game';
it('commits, reveals, and verifies seeds using SHA-256 with separated analysis seeds', async () => {
  expect(await seedHash('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  const seed = '0123456789abcdef0123456789abcdef',
    hash = await seedHash(seed);
  expect(await verifyCommitment(seed, hash)).toBe(true);
  expect(await verifyCommitment('00000001000000020000000300000004', hash)).toBe(
    false,
  );
  expect(await verifyCommitment('invalid', hash)).toBe(false);
  expect(await analysisSeed(seed, 'decision:1')).toBe(
    await analysisSeed(seed, 'decision:1'),
  );
  expect(await analysisSeed(seed, 'decision:1')).not.toBe(
    await analysisSeed(seed, 'runout:flop'),
  );
});
it('round-trips a completed hand through IndexedDB and replays every recorded action', async () => {
  const config = {
    seed: '0123456789abcdef0123456789abcdef',
    stacks: [100, 100],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
  };
  const game = act(newGame(config), { type: 'fold' }),
    hand: SavedHand = {
      version: 1,
      id: config.seed,
      date: new Date(0).toISOString(),
      config,
      actions: game.history,
      notes: [],
      commitment: await seedHash(config.seed),
      persona: 'tight-passive',
    };
  await saveHand(hand);
  await saveHand(hand);
  const rows = await loadHands();
  expect(rows.filter((h) => h.id === hand.id)).toHaveLength(1);
  expect(rows[0]).toEqual(hand);
  expect(replay(rows[0].config, rows[0].actions)).toEqual(game);
});
it('awards bankroll and XP once per completed hand, and handles corrupt storage', () => {
  const p = awardHand(emptyProfile(), 'id', 100, 90, 2);
  expect(p.bankroll).toBe(1990);
  expect(p.xp).toBe(30);
  expect(p.hands).toBe(1);
  expect(awardHand(p, 'id', 100, 90, 2)).toEqual(p);
  expect(parseProfile(JSON.stringify(p))).toEqual(p);
  for (const value of [
    'null',
    '{',
    '{"bankroll":-1}',
    '{"bankroll":0,"xp":0,"hands":0,"settled":[2]}',
  ])
    expect(parseProfile(value)).toEqual(emptyProfile());
});
