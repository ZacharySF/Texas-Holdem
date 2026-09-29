import { assetUrl } from '../../visual/config';
import { distribution, rangeMatrix, scatter } from './mathGraphics';
import { noiseField } from './abstract';
import type { GraphicOptions } from './types';
export const photoTreatments = [
  'halftone',
  'dither',
  'slit-scan',
  'motion-blur',
  'ascii',
  'duotone',
] as const;
const photos = new Map<number, Promise<HTMLImageElement | null>>();
function loadPhoto(index: number) {
  if (!photos.has(index))
    photos.set(
      index,
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = assetUrl(`art/${String(index).padStart(2, '0')}.jpg`);
      }),
    );
  return photos.get(index)!;
}
export async function photoSource(
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const index = Math.min(6, Math.max(1, o.photo ?? 1)),
    image = await loadPhoto(index),
    canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#020107';
  ctx.fillRect(0, 0, w, h);
  if (image) {
    const scale = Math.max(w / image.width, h / image.height),
      iw = image.width * scale,
      ih = image.height * scale;
    ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else {
    const options = { ...o, seed: `photo-${index}:${o.seed}` };
    if (index === 2 || index === 6)
      distribution(
        ctx,
        { ...options, variant: index === 2 ? 'area' : 'bars' },
        w,
        h,
        accent,
      );
    else if (index === 4) scatter(ctx, options, w, h, accent);
    else if (index === 5)
      rangeMatrix(ctx, { ...options, variant: 'dots' }, w, h, accent);
    else
      noiseField(
        ctx,
        { ...options, variant: index === 1 ? 'contours' : 'flow' },
        w,
        h,
        accent,
      );
  }
  return {
    canvas,
    source: image
      ? `art/${String(index).padStart(2, '0')}.jpg`
      : `generator fallback / slot ${index}`,
  };
}
export async function treatedPhoto(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const { canvas, source } = await photoSource(o, w, h, accent),
    input = canvas
      .getContext('2d', { willReadFrequently: true })!
      .getImageData(0, 0, w, h).data;
  const luminance = (x: number, y: number) => {
    const i =
      (Math.min(h - 1, Math.max(0, Math.floor(y))) * w +
        Math.min(w - 1, Math.max(0, Math.floor(x)))) *
      4;
    return (
      (input[i] * 0.2126 + input[i + 1] * 0.7152 + input[i + 2] * 0.0722) / 255
    );
  };
  const kind = o.kind;
  ctx.fillStyle = accent;
  if (o.variant === 'motion-blur') {
    for (let x = -24; x <= 24; x += 3) {
      ctx.globalAlpha = 0.08;
      ctx.drawImage(canvas, x, 0);
    }
    ctx.globalAlpha = 1;
  } else if (o.variant === 'duotone') {
    const tint = accent.match(/[a-f0-9]{2}/gi)!.map((c) => parseInt(c, 16));
    const output = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4,
          l = luminance(x, y);
        output.data[i] = 2 + l * (tint[0] - 2);
        output.data[i + 1] = 1 + l * (tint[1] - 1);
        output.data[i + 2] = 7 + l * (tint[2] - 7);
        output.data[i + 3] = 255;
      }
    const colored = document.createElement('canvas');
    colored.width = w;
    colored.height = h;
    colored.getContext('2d')!.putImageData(output, 0, 0);
    ctx.drawImage(colored, 0, 0);
  } else if (kind === 'Halftone') {
    const pitch = o.variant === 'fine' ? 5 : 9;
    const extent = w + h;
    for (let v = -extent; v < extent; v += pitch)
      for (let u = -extent; u < extent; u += pitch) {
        const x = u * 0.8660254 - v * 0.5 + w / 2,
          y = u * 0.5 + v * 0.8660254 + h / 2;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const radius = Math.sqrt(luminance(x, y)) * pitch * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (kind === 'Dither') {
    if (o.variant === 'violet') ctx.fillStyle = '#6449d7';
    const matrix = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
      pixel = o.variant === 'light' ? 2 : 3;
    for (let y = 0; y < h; y += pixel)
      for (let x = 0; x < w; x += pixel)
        if (
          luminance(x, y) >
          (matrix[
            (Math.floor(y / pixel) % 4) * 4 + (Math.floor(x / pixel) % 4)
          ] +
            0.5) /
            16
        )
          ctx.fillRect(x, y, pixel, pixel);
  } else if (kind === 'Ascii') {
    const chars = ' .:-=+*#%@',
      pitch = o.variant === 'sparse' ? 13 : 9;
    ctx.font = `${pitch}px monospace`;
    for (let y = pitch; y < h; y += pitch)
      for (let x = 0; x < w; x += pitch * 0.65)
        ctx.fillText(
          chars[
            Math.min(
              chars.length - 1,
              Math.floor(luminance(x, y) * chars.length * 1.7),
            )
          ],
          x,
          y,
        );
  } else if (kind === 'SlitScan') {
    const horizontal = o.variant === 'horizontal';
    for (let v = 0; v < (horizontal ? h : w); v += 3) {
      const offset = Math.sin(v / 45) * 35;
      ctx.globalAlpha = 0.85;
      if (horizontal)
        ctx.drawImage(
          canvas,
          0,
          Math.max(0, Math.min(h - 1, v + offset)),
          w,
          1,
          0,
          v,
          w,
          4,
        );
      else
        ctx.drawImage(
          canvas,
          Math.max(0, Math.min(w - 1, v + offset)),
          0,
          1,
          h,
          v,
          0,
          4,
          h,
        );
    }
    ctx.globalAlpha = 1;
  } else ctx.drawImage(canvas, 0, 0);
  return { source, summary: `${kind} / ${source}` };
}
