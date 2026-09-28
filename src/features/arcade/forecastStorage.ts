import type { Forecast } from '../../engine/decisionDrills';
export const FORECAST_KEY = 'holdem-forecast-v1';
export function readForecasts(): Forecast[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(FORECAST_KEY) ?? '[]',
    );
    return Array.isArray(data)
      ? data.filter(
          (f): f is Forecast =>
            !!f &&
            typeof f === 'object' &&
            'id' in f &&
            typeof f.id === 'string' &&
            'mode' in f &&
            ['call', 'guess', 'combo'].includes(String(f.mode)) &&
            'date' in f &&
            typeof f.date === 'string' &&
            'correct' in f &&
            typeof f.correct === 'boolean' &&
            ['prediction', 'truth', 'outcome'].every(
              (k) =>
                k in f &&
                typeof f[k] === 'number' &&
                Number.isFinite(f[k]) &&
                f[k] >= 0 &&
                f[k] <= 1,
            ),
        )
      : [];
  } catch {
    return [];
  }
}
export function saveForecasts(
  previous: Forecast[],
  fresh: Forecast[],
): Forecast[] {
  const map = new Map(previous.map((f) => [f.id, f]));
  for (const f of fresh) if (!map.has(f.id)) map.set(f.id, f);
  const records = [...map.values()];
  localStorage.setItem(FORECAST_KEY, JSON.stringify(records));
  return records;
}
export function forecastXp(records: readonly Forecast[]): number {
  return records.filter((r) => r.correct).length * 5;
}
