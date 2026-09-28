/** xoshiro128** 1.1, Blackman/Vigna: https://prng.di.unimi.it/xoshiro128starstar.c */
export class Rng {
  private state: number[];
  constructor(seed: string) {
    if (!/^[0-9a-f]{32}$/i.test(seed) || /^0{32}$/.test(seed))
      throw new Error('Seed must be 32 hexadecimal digits, not all zero.');
    this.state = [0, 8, 16, 24].map(
      (i) => Number.parseInt(seed.slice(i, i + 8), 16) >>> 0,
    );
  }
  nextUint32(): number {
    const s = this.state;
    const x = Math.imul(s[1], 5);
    const result = Math.imul((x << 7) | (x >>> 25), 9) >>> 0;
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = (s[3] << 11) | (s[3] >>> 21);
    return result;
  }
  int(bound: number): number {
    if (!Number.isInteger(bound) || bound < 1 || bound > 0x100000000)
      throw new Error('Bound must be an integer in [1, 2^32].');
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= limit);
    return value % bound;
  }
}
export function shuffle<T>(values: readonly T[], rng: Rng): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
