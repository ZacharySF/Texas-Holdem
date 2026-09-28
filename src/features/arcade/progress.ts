export const OUTS_PROGRESS_KEY = 'holdem-outs-rush-v1';
export interface DrillProgress {
  version: 1;
  best: Record<string, number>;
}
export function decodeDrill(raw: string | null): DrillProgress {
  const clean: DrillProgress = { version: 1, best: {} };
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (
      value &&
      typeof value === 'object' &&
      'version' in value &&
      value.version === 1 &&
      'best' in value &&
      value.best &&
      typeof value.best === 'object'
    )
      for (const [seed, score] of Object.entries(value.best))
        if (
          /^[a-f0-9]{32}$/.test(seed) &&
          typeof score === 'number' &&
          Number.isInteger(score) &&
          score >= 0 &&
          score <= 5
        )
          clean.best[seed] = score;
  } catch {
    /* Invalid local data does not prevent practice. */
  }
  return clean;
}
export function recordDrill(
  progress: DrillProgress,
  seed: string,
  correct: number,
): DrillProgress {
  return {
    ...progress,
    best: {
      ...progress.best,
      [seed]: Math.max(progress.best[seed] ?? 0, correct),
    },
  };
}
export const drillXp = (progress: DrillProgress): number =>
  Object.values(progress.best).reduce((a, b) => a + b, 0) * 5;
export function readDrill(): DrillProgress {
  try {
    return decodeDrill(localStorage.getItem(OUTS_PROGRESS_KEY));
  } catch {
    return decodeDrill(null);
  }
}
