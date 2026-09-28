import { expect, it } from 'vitest';
import katex from 'katex';
import {
  facts,
  learningFacts,
  lessonDerivation,
  shortcutProbability,
  experimentProbability,
  orderedLabels,
  rankingExamples,
} from '../../content/facts';
import { lessons } from '../../content/lessons';
import { Rational } from '../../engine/math';
import { makePractice, isCorrect, parseAnswer } from './practice';
import {
  chapterUnlocked,
  decodeProgress,
  emptyProgress,
  mastered,
  recordAttempt,
} from './progress';
import { notebookTex } from './NotebookBlock';
it('proves Phase 2 anchors and all new registry counting claims', () => {
  expect(facts.startingCombos()).toBe(1326n);
  expect(facts.handClasses()).toEqual({
    pairs: 13,
    suited: 78,
    offsuit: 78,
    total: 169,
  });
  expect(facts.combosPerClass()).toEqual({
    pair: 6n,
    suited: 4n,
    offsuit: 12n,
  });
  expect(facts.pocketPair().toString()).toBe('1/17');
  expect(facts.pocketAces().toString()).toBe('1/221');
  expect(facts.suited().toString()).toBe('4/17');
  expect(facts.offsuitNonPair().toString()).toBe('12/17');
  expect(
    facts
      .pocketPair()
      .add(facts.suited())
      .add(facts.offsuitNonPair())
      .toNumber(),
  ).toBe(1);
  expect(facts.atLeastOneAce().toString()).toBe('33/221');
  expect(learningFacts.mastery().toString()).toBe('4/5');
  expect(learningFacts.confidence().toString()).toBe('19/20');
  expect(learningFacts.deck()).toEqual({
    cards: 52,
    ranks: 13,
    suits: 4,
    perRank: 4,
    perSuit: 13,
  });
  expect(learningFacts.orderedSelections(52, 2)).toBe(2652n);
  expect(learningFacts.combinations(4, 2)).toBe(6n);
  expect(learningFacts.permutations(0)).toBe(1n);
  expect(learningFacts.permutations(3)).toBe(6n);
  expect(learningFacts.complement(facts.atLeastOneAce()).toString()).toBe(
    '188/221',
  );
  expect(learningFacts.union(4, 13, 1, 52).toString()).toBe('4/13');
  expect(learningFacts.union(13, 13, 0, 52).toString()).toBe('1/2');
  expect(() => learningFacts.union(4, 13, 5, 52)).toThrow();
  expect(learningFacts.roundPercent(new Rational(1, 13)).toString()).toBe(
    '2/25',
  );
  expect(
    learningFacts.gap(new Rational(2, 25), new Rational(1, 13)).toString(),
  ).toBe('1/325');
  expect(learningFacts.callAmount(30, 10)).toBe(20);
  expect(() => learningFacts.callAmount(10, 30)).toThrow();
  expect(learningFacts.boardAfter('river')).toBe(5);
  expect(learningFacts.nextButton(6, 6)).toBe(1);
  expect(() => learningFacts.nextButton(0, 2)).toThrow();
  expect(orderedLabels(3)).toHaveLength(6);
  expect(orderedLabels(4, 2)).toHaveLength(12);
  expect(() => orderedLabels(7)).toThrow();
  expect(rankingExamples().map((r) => r.category)).toHaveLength(9);
});
it('validates every notebook and seeded practice solution, including generated variants', () => {
  for (const lesson of lessons) {
    expect(lesson.objectives.length).toBeGreaterThanOrEqual(2);
    expect(() =>
      katex.renderToString(notebookTex(lessonDerivation(lesson.experiment)), {
        throwOnError: true,
      }),
    ).not.toThrow();
    expect(
      shortcutProbability(lesson.experiment).toNumber(),
    ).toBeGreaterThanOrEqual(0);
    expect(
      experimentProbability(lesson.experiment).toNumber(),
    ).toBeLessThanOrEqual(1);
    for (let n = 1; n <= 20; n++) {
      const seed = n.toString(16).padStart(32, '0'),
        a = makePractice(lesson.id, seed);
      expect(a).toEqual(makePractice(lesson.id, seed));
      expect(a).toHaveLength(5);
      for (const problem of a) {
        expect(isCorrect(problem.answer.toString(), problem)).toBe(true);
        expect(isCorrect('999999', problem)).toBe(false);
        expect(problem.explanation.length).toBeGreaterThan(40);
        expect(() =>
          katex.renderToString(notebookTex(problem.lines), {
            throwOnError: true,
          }),
        ).not.toThrow();
      }
    }
  }
});
it('grades equivalent representations and rejects malformed answers', () => {
  for (const s of ['1/4', '2/8', '25%', '0.25', '1 in 4', '3 : 1 against'])
    expect(parseAnswer(s)?.toString()).toBe('1/4');
  expect(parseAnswer('-1')?.toString()).toBe('-1/1');
  expect(parseAnswer('-0.25')?.toString()).toBe('-1/4');
  for (const s of [
    '',
    'NaN',
    '1/0',
    '1 in 0',
    'Infinity',
    '1e5',
    '2/3/4',
    '-1 : 1 against',
  ])
    expect(parseAnswer(s)).toBeNull();
});
it('persists mastery, permits optional intro skipping, and sanitizes storage', () => {
  let p = emptyProgress();
  expect(chapterUnlocked(0, p)).toBe(true);
  expect(chapterUnlocked(1, p)).toBe(false);
  expect(chapterUnlocked(1, { ...p, skippedIntro: true })).toBe(true);
  p = recordAttempt(p, '1-1', [true, true, true, true, false]);
  expect(mastered(p.results['1-1'])).toBe(true);
  p = recordAttempt(p, '1-1', [false, false, false, false, false]);
  expect(p.results['1-1']?.bestCorrect).toBe(4);
  expect(p.results['1-1']?.attempts).toBe(2);
  expect(chapterUnlocked(2, p)).toBe(false);
  expect(decodeProgress(JSON.stringify(p))).toEqual(p);
  for (let n = 0; n < 5; n++)
    expect(() =>
      recordAttempt(p, '1-1', Array<boolean>(n).fill(true)),
    ).toThrow();
  expect(
    mastered(
      recordAttempt(emptyProgress(), '1-1', [true, true, true, false, false])
        .results['1-1'],
    ),
  ).toBe(false);
  for (const raw of [
    '{',
    'null',
    '{"version":2}',
    '{"version":1,"results":{"1-1":{"bestCorrect":9,"total":5,"attempts":1}}}',
  ])
    expect(decodeProgress(raw)).toEqual(emptyProgress());
});
