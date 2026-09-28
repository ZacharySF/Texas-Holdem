import { expect, it } from 'vitest';
import {
  decodeJourney,
  emptyJourney,
  lessonGameLink,
  lessonReturnLink,
} from './journey';
it('keeps reading and played-hand progress separate and sanitizes saved course state', () => {
  const value = decodeJourney(
    JSON.stringify({
      version: 1,
      current: '1-2',
      read: ['1-1', '1-1', 'bad'],
      played: ['1-2', 7],
    }),
  );
  expect(value).toEqual({
    version: 1,
    current: '1-2',
    read: ['1-1'],
    played: ['1-2'],
  });
  for (const raw of [null, '{', 'null', '{"version":2}'])
    expect(decodeJourney(raw)).toEqual(emptyJourney());
  expect(
    decodeJourney('{"version":1,"current":"//evil","read":{},"played":null}'),
  ).toEqual(emptyJourney());
});
it('preserves lesson identity and seed across the practice-game round trip', () => {
  const seed = '0123456789abcdef0123456789abcdef';
  const params = new URLSearchParams(lessonGameLink('1-1', seed).split('?')[1]);
  expect(params.get('lesson')).toBe('1-1');
  expect(lessonReturnLink('1-1', params.get('lessonSeed'))).toBe(
    `/learn/1-1?seed=${seed}`,
  );
});
