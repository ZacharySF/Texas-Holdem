import { Rng } from '../../engine/rng';
import { finalExample } from '../../content/finalLessonFacts';
import type { Problem } from './practice';
export function finalPractice(id: string, seed: string): Problem[] {
  const rng = new Rng(seed);
  return Array.from({ length: 5 }, () => {
    const n = id === '24-2' ? 1 + rng.int(4) : 3 + rng.int(6),
      e = finalExample(id, n);
    return {
      prompt: e.label + '. Give an exact fraction or integer.',
      answer: e.answer,
      lines: e.lines,
      explanation:
        'Use the stated event, payoff, or decision rule. Substitute the supplied inputs before reducing the fraction. The notebook counts the model outcomes or weights each payoff by its probability; an approximation changes that model and its signed error must be kept separate.',
    };
  });
}
