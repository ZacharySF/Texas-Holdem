import { rangeMatrix, deckGrid, distribution, scatter } from './mathGraphics';
import { noiseField, barcode } from './abstract';
import { treatedPhoto } from './photos';
import type { Graphic, GraphicOptions } from './types';
const cache = new Map<string, Promise<Graphic>>();
export const cacheMetrics = { renders: 0, hits: 0 };
/** One rasterization per seed, size, treatment and data. Bounded cache; no animation loop. */
export function renderGraphic(options: GraphicOptions): Promise<Graphic> {
  const o = {
    seed: 'contemporary-01',
    width: 480,
    height: 320,
    variant: '',
    accent: '#aef7fc',
    ...options,
    dpr: Math.min(2, Math.max(1, options.dpr ?? 1)),
  };
  const key = JSON.stringify(o),
    cached = cache.get(key);
  if (cached) {
    cacheMetrics.hits++;
    return cached;
  }
  const job = (async () => {
    cacheMetrics.renders++;
    const w = Math.max(16, Math.round(o.width)),
      h = Math.max(16, Math.round(o.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * o.dpr);
    canvas.height = Math.round(h * o.dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(o.dpr, o.dpr);
    ctx.fillStyle = '#020107';
    ctx.fillRect(0, 0, w, h);
    let summary: string;
    let source = 'generator';
    if (o.kind === 'RangeMatrix') summary = rangeMatrix(ctx, o, w, h, o.accent);
    else if (o.kind === 'DeckGrid') summary = deckGrid(ctx, o, w, h, o.accent);
    else if (o.kind === 'Distribution')
      summary = distribution(ctx, o, w, h, o.accent);
    else if (o.kind === 'MonteCarloScatter')
      summary = scatter(ctx, o, w, h, o.accent);
    else if (o.kind === 'Barcode') summary = barcode(ctx, o, w, h, o.accent);
    else if (o.kind === 'NoiseField')
      summary = noiseField(ctx, o, w, h, o.accent);
    else {
      const result = await treatedPhoto(ctx, o, w, h, o.accent);
      summary = result.summary;
      source = result.source;
    }
    return { url: canvas.toDataURL('image/png'), source, summary };
  })();
  if (cache.size >= 80) cache.delete(cache.keys().next().value!);
  cache.set(key, job);
  return job;
}
