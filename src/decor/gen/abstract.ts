import { decorRng } from './rng';
import type { GraphicOptions } from './types';
export function noiseField(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const random = decorRng(o.seed ?? 'field'),
    phase = random() * Math.PI * 2;
  const bloom = ctx.createRadialGradient(
    w * 0.65,
    h * 0.4,
    2,
    w * 0.6,
    h * 0.5,
    w * 0.7,
  );
  bloom.addColorStop(0, '#36287d');
  bloom.addColorStop(1, '#020107');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
  const contours = o.variant === 'contours';
  for (let line = 0; line < 64; line++) {
    ctx.beginPath();
    ctx.strokeStyle = line % 7 === 0 ? accent : '#6449d7';
    ctx.globalAlpha = 0.25 + (line % 7) / 10;
    ctx.lineWidth = line % 7 === 0 ? 1.3 : 0.6;
    for (let x = 0; x <= w; x += 5) {
      const t = x / w,
        wave =
          Math.sin(t * 5 + phase + line * 0.06) * h * 0.19 +
          Math.cos(t * 9 + line * 0.09) * h * 0.05;
      const y = contours
        ? h * 0.1 + (line * h) / 86 + wave
        : h * 0.5 +
          (line - 32) * 3 +
          Math.sin(t * 7 + phase + line * 0.04) * (line + 8) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return `Seeded ${contours ? 'contour' : 'flow'} field / ${o.seed}`;
}
/** Code-128-style visual bars, deliberately not a scannable encoded symbol. */
export function barcode(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const text = o.text || o.seed || 'page',
    random = decorRng(text),
    bars = Array.from(
      {
        length: Math.min(
          o.variant === 'compact' ? 64 : 180,
          24 + text.length * 6,
        ),
      },
      () => 1 + Math.floor(random() * 3),
    ),
    unit = (w - 20) / bars.reduce((a, b) => a + b, 0);
  let x = 10;
  bars.forEach((bar, i) => {
    const width = bar * unit;
    if (i % 2 === 0) {
      ctx.fillStyle = accent;
      ctx.fillRect(
        x,
        8,
        Math.max(0.6, width),
        h - (o.variant === 'compact' ? 40 : 28),
      );
    }
    x += width;
  });
  ctx.fillStyle = accent;
  ctx.font = '9px monospace';
  ctx.fillText(text.slice(0, 48), 10, h - 6);
  return `Visual barcode / ${text}`;
}
