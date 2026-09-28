import { test } from 'node:test';
import { sevenCardCounts, drawingFacts } from '../src/content/facts';
import assert from 'node:assert/strict';
import { deck } from '../src/engine/cards';
import {
  categoryOf,
  evaluateFast,
  evaluateReference,
  strengthName,
} from '../src/engine/evaluator';
import { Rng, shuffle } from '../src/engine/rng';
test('exhausts all 133,784,560 seven-card sets with category and royal anchors', () => {
  const expected = [
    23294460, 58627800, 31433400, 6461620, 6180020, 4047644, 3473184, 224848,
    41584,
  ];
  const counts = Array<number>(9).fill(0),
    hand = Array<number>(7).fill(0);
  let total = 0,
    royals = 0;
  console.time('Exhaustive seven-card evaluation');
  for (let a = 0; a < 46; a++) {
    hand[0] = a;
    for (let b = a + 1; b < 47; b++) {
      hand[1] = b;
      for (let c = b + 1; c < 48; c++) {
        hand[2] = c;
        for (let d = c + 1; d < 49; d++) {
          hand[3] = d;
          for (let e = d + 1; e < 50; e++) {
            hand[4] = e;
            for (let f = e + 1; f < 51; f++) {
              hand[5] = f;
              for (let g = f + 1; g < 52; g++) {
                hand[6] = g;
                const strength = evaluateFast(hand),
                  category = categoryOf(strength);
                counts[category]++;
                total++;
                if (category === 8 && strengthName(strength) === 'Royal flush')
                  royals++;
              }
            }
          }
        }
      }
    }
    if (a % 5 === 0) console.log(`${total.toLocaleString()} hands checked`);
  }
  assert.deepEqual(counts, expected);
  assert.deepEqual(counts.map(BigInt), sevenCardCounts());
  assert.equal(
    drawingFacts.royal(7).numerator * BigInt(total),
    BigInt(royals) * drawingFacts.royal(7).denominator,
  );
  assert.equal(total, 133784560);
  assert.equal(royals, 4324);
  console.timeEnd('Exhaustive seven-card evaluation');
  console.table(
    counts.map((observed, category) => ({
      category: [
        'High card',
        'One pair',
        'Two pair',
        'Three of a kind',
        'Straight',
        'Flush',
        'Full house',
        'Four of a kind',
        'Straight flush',
      ][category],
      anchor: expected[category],
      observed,
    })),
  );
  console.log({ total, royals });
});
test('agrees with the reference on 1,000,000 seeded seven-card hands', () => {
  console.time('One million reference comparisons');
  const rng = new Rng('0123456789abcdef0123456789abcdef');
  for (let i = 0; i < 1000000; i++) {
    const cards = shuffle(deck(), rng).slice(0, 7);
    assert.equal(evaluateFast(cards), evaluateReference(cards).strength);
  }
  console.timeEnd('One million reference comparisons');
});
