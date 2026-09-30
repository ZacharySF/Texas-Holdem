import { expect, it } from 'vitest';
import { newGame, playerView } from '../engine/game';
import { PERSONAS, botActionValues, chooseBot } from '../engine/bots';

const seed = '0123456789abcdef0123456789abcdef';
const config = {
  seed,
  stacks: [2000, 2000, 2000, 2000, 2000, 2000],
  button: 0,
  smallBlind: 5,
  bigBlind: 10,
};

it('posts real blinds and starts with the correct preflop actor at two and six seats', () => {
  const six = newGame(config);
  expect(six.players.map((p) => p.contributed)).toEqual([0, 5, 10, 0, 0, 0]);
  expect(six.players[1].stack).toBe(1995);
  expect(six.players[2].stack).toBe(1990);
  expect(six.actor).toBe(3);
  const two = newGame({ ...config, stacks: [2000, 2000] });
  expect(two.players.map((p) => p.contributed)).toEqual([5, 10]);
  expect(two.actor).toBe(0);
});

it('every player view ignores all other private cards, deal seed and future deck order', () => {
  const game = newGame(config);
  for (let seat = 0; seat < game.players.length; seat++) {
    const otherHands = game.players.flatMap((p, i) =>
      i === seat ? [] : [p.hand],
    );
    let index = 0;
    const changed = {
      ...game,
      config: { ...game.config, seed: 'ffffffffffffffffffffffffffffffff' },
      deck: [...game.deck].reverse(),
      players: game.players.map((p, i) =>
        i === seat
          ? p
          : { ...p, hand: otherHands[++index % otherHands.length] },
      ),
    };
    const view = playerView(game, seat);
    expect(playerView(changed, seat)).toEqual(view);
    expect(view.hand).toEqual(game.players[seat].hand);
    expect(view).not.toHaveProperty('deck');
    expect(view).not.toHaveProperty('config');
    for (const player of view.players)
      expect(player).not.toHaveProperty('hand');
  }
});

it('each persona picks the highest estimated return from its legal candidate moves', () => {
  const game = newGame(config);
  const view = playerView(game, game.actor);
  for (const persona of PERSONAS) {
    const values = botActionValues(view, persona, seed, 40);
    const best = values.reduce((a, b) => (b.mean > a.mean + 1e-9 ? b : a));
    expect(chooseBot(view, persona, seed, 40).action).toEqual(best.action);
  }
});
