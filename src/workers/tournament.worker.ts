/// <reference lib="webworker" />
import { chooseBot } from '../engine/bots';
import type { PlayerView } from '../engine/game';
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = (event: MessageEvent<{ view: PlayerView; seed: string }>) => {
  try {
    const { view, seed } = event.data;
    const { action } = chooseBot(view, 'equity-driven', seed, 400);
    scope.postMessage({ action });
  } catch {
    scope.postMessage({ error: true });
  }
};
