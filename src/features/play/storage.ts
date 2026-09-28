import type { GameConfig, ActionRecord, Action } from '../../engine/game';
import type { Persona } from '../../engine/bots';
import type { EquityResult } from '../../engine/equity';
export interface DecisionNote {
  index: number;
  seat: number;
  action: Action;
  reason: string;
  equity: EquityResult;
  reference?: EquityResult;
  analysisSeed: string;
  gap?: number;
  guess?: number;
}
export interface SavedHand {
  version: 1;
  id: string;
  date: string;
  config: GameConfig;
  commitment: string;
  persona: Persona;
  actions: ActionRecord[];
  notes: DecisionNote[];
}
export interface Profile {
  bankroll: number;
  xp: number;
  hands: number;
  settled: string[];
}
export const PROFILE_KEY = 'holdem-play-v1';
export const emptyProfile = (): Profile => ({
  bankroll: 2000,
  xp: 0,
  hands: 0,
  settled: [],
});
export function parseProfile(raw: string | null): Profile {
  try {
    const p: unknown = JSON.parse(raw ?? 'null');
    if (!p || typeof p !== 'object') return emptyProfile();
    const v = p as Record<string, unknown>;
    if (
      ![v.bankroll, v.xp, v.hands].every(
        (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
      ) ||
      !Array.isArray(v.settled) ||
      !v.settled.every((s) => typeof s === 'string')
    )
      return emptyProfile();
    return v as unknown as Profile;
  } catch {
    return emptyProfile();
  }
}
export function awardHand(
  profile: Profile,
  id: string,
  starting: number,
  ending: number,
  goodDecisions: number,
): Profile {
  if (profile.settled.includes(id)) return profile;
  return {
    bankroll: profile.bankroll - starting + ending,
    xp: profile.xp + 20 + Math.max(0, goodDecisions) * 5,
    hands: profile.hands + 1,
    settled: [...profile.settled.slice(-199), id],
  };
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('holdem-histories', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('hands', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('Close other tabs to open the hand-history database.'));
  });
}
export async function saveHand(hand: SavedHand): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('hands', 'readwrite');
      tx.objectStore('hands').put(hand);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(tx.error ?? new Error('History write was aborted.'));
    });
  } finally {
    db.close();
  }
}
export async function loadHands(): Promise<SavedHand[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction('hands', 'readonly')
        .objectStore('hands')
        .getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as SavedHand[])
            .filter(
              (h) =>
                h.version === 1 &&
                typeof h.id === 'string' &&
                typeof h.date === 'string' &&
                h.config &&
                Array.isArray(h.actions) &&
                Array.isArray(h.notes),
            )
            .sort((a, b) => b.date.localeCompare(a.date)),
        );
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function seedHash(seed: string): Promise<string> {
  const bytes = new TextEncoder().encode(seed);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
export async function analysisSeed(
  seed: string,
  purpose: string,
): Promise<string> {
  const value = (await seedHash(`${seed}:${purpose}`)).slice(0, 32);
  return /^0+$/.test(value) ? '00000000000000000000000000000001' : value;
}
export async function verifyCommitment(
  seed: string,
  commitment: string,
): Promise<boolean> {
  return /^[0-9a-f]{32}$/i.test(seed) && (await seedHash(seed)) === commitment;
}
