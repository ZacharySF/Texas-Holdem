import { chartClasses, handClassFacts } from '../../content/handChartFacts';
import { nCr, Rational } from '../../engine/math';
import { binomial, hypergeometric } from '../../engine/inference';
import { outChance } from '../../engine/courseDraws';
import { deck } from '../../engine/cards';
import { evaluateFast } from '../../engine/evaluator';
import { decorRng } from './rng';
import type { GraphicOptions } from './types';
export const COMBINATIONS = Number(nCr(deck().length, 2));
export const CLASSES = chartClasses.length;
const frequencies = chartClasses.map(
  (label) => handClassFacts(label).combos / COMBINATIONS,
);
export function distributionValues(seed: string, family = 'binomial') {
  const random = decorRng(seed);
  if (family === 'outs')
    return Array.from({ length: 16 }, (_, outs) =>
      outChance(47, outs, 2).toNumber(),
    );
  if (family === 'hypergeometric') {
    const successes = 4 + Math.floor(random() * 10);
    return Array.from({ length: 8 }, (_, k) =>
      hypergeometric(52, successes, 7, k).toNumber(),
    );
  }
  const p = new Rational(2 + Math.floor(random() * 6), 10);
  return Array.from({ length: 17 }, (_, k) => binomial(16, k, p).toNumber());
}
export function rangeMatrix(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const size = Math.min(w, h) - 22,
    cell = size / 13,
    x0 = (w - size) / 2,
    y0 = (h - size) / 2;
  const values = o.values ?? frequencies;
  const max = Math.max(...values, Number.EPSILON);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < 13; r++)
    for (let c = 0; c < 13; c++) {
      const i = r * 13 + c,
        v = values[i] / max,
        x = x0 + c * cell,
        y = y0 + r * cell;
      ctx.strokeStyle = '#36287d';
      ctx.strokeRect(x + 1, y + 1, cell - 3, cell - 3);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.15 + 0.8 * v;
      if (o.variant === 'dots') {
        ctx.beginPath();
        ctx.arc(
          x + cell / 2,
          y + cell / 2,
          Math.max(1, cell * 0.38 * Math.sqrt(v)),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (o.variant === 'outline')
        ctx.strokeRect(x + 3, y + 3, cell - 7, cell - 7);
      else ctx.fillRect(x + 1, y + 1, cell - 3, cell - 3);
      if (cell > 20) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = v > 0.5 ? '#020107' : '#b1b7d0';
        ctx.font = `${Math.max(7, cell * 0.25)}px monospace`;
        ctx.fillText(chartClasses[i], x + cell / 2, y + cell / 2);
      }
    }
  ctx.globalAlpha = 1;
  return `Class frequency · ${COMBINATIONS} combinations / ${CLASSES} classes`;
}
export function deckGrid(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const known = new Set(o.known ?? []),
    gap = 5,
    cw = (w - 24) / 13,
    ch = (h - 24) / 4;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 13; c++) {
      const card = (12 - c) * 4 + r,
        x = 12 + c * cw,
        y = 12 + r * ch;
      ctx.strokeStyle = known.has(card) ? accent : '#36287d';
      ctx.fillStyle = known.has(card) ? accent : '#0e0930';
      if (o.variant !== 'outline') ctx.fillRect(x, y, cw - gap, ch - gap);
      ctx.strokeRect(x, y, cw - gap, ch - gap);
      if (cw > 20) {
        ctx.fillStyle = known.has(card) ? '#020107' : '#776da2';
        ctx.font = `${Math.min(12, cw * 0.35)}px monospace`;
        ctx.fillText('AKQJT98765432'[c], x + 5, y + Math.min(ch * 0.6, 20));
      }
    }
  return `${known.size} visible cards / ${deck().length} cards`;
}
export function distribution(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const family =
    o.text === 'outs'
      ? 'outs'
      : o.text === 'hypergeometric'
        ? 'hypergeometric'
        : 'binomial';
  const values = distributionValues(o.seed ?? '', family),
    max = Math.max(...values),
    pad = 18,
    gh = h - 2 * pad;
  ctx.strokeStyle = '#36287d';
  ctx.lineWidth = 0.5;
  for (let j = 0; j < 5; j++) {
    ctx.beginPath();
    ctx.moveTo(pad, pad + (j * gh) / 4);
    ctx.lineTo(w - pad, pad + (j * gh) / 4);
    ctx.stroke();
  }
  const point = (v: number, i: number): [number, number] => [
    pad + (i * (w - 2 * pad)) / (values.length - 1),
    h - pad - (v / max) * gh,
  ];
  if (o.variant === 'bars')
    values.forEach((v, i) => {
      const [x, y] = point(v, i);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.3 + (0.6 * v) / max;
      ctx.fillRect(x, y, ((w - 2 * pad) / values.length) * 0.7, h - pad - y);
    });
  else {
    const layers = o.variant === 'area' ? 3 : 1;
    for (let k = layers - 1; k >= 0; k--) {
      ctx.beginPath();
      values.forEach((v, i) => {
        const [x, y] = point(v * (1 - k * 0.2), i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.9 - k * 0.22;
      ctx.lineWidth = o.variant === 'scope' ? 1.5 : 1;
      if (o.variant === 'scope') {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.lineTo(w - pad, h - pad);
        ctx.lineTo(pad, h - pad);
        ctx.closePath();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.16 + k * 0.06;
        ctx.fill();
        ctx.globalAlpha = 0.65;
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  return `${family} / ${values.length} exact values`;
}
const simulations = new Map<string, readonly number[]>();
export function scatter(
  ctx: CanvasRenderingContext2D,
  o: GraphicOptions,
  w: number,
  h: number,
  accent: string,
) {
  const seed = o.seed ?? 'sample',
    rng = decorRng(seed);
  let results = simulations.get(seed);
  if (!results) {
    const scores = [];
    for (let i = 0; i < 2400; i++) {
      const cards = deck();
      for (let j = cards.length - 1; j > 0; j--) {
        const k = Math.floor(rng() * (j + 1));
        [cards[j], cards[k]] = [cards[k], cards[j]];
      }
      const board = cards.slice(4, 9),
        a = evaluateFast([...cards.slice(0, 2), ...board]),
        b = evaluateFast([...cards.slice(2, 4), ...board]);
      scores.push(Math.sign(a - b));
    }
    results = scores;
    if (simulations.size >= 16)
      simulations.delete(simulations.keys().next().value!);
    simulations.set(seed, results);
  }
  const dots = decorRng(seed + ':positions');
  results.forEach((result, i) => {
    ctx.fillStyle = result > 0 ? accent : result === 0 ? '#b1b7d0' : '#4835ab';
    ctx.globalAlpha = 0.35 + dots() * 0.55;
    const x = o.variant === 'bands' ? ((i % 80) / 80) * w : dots() * w;
    const y =
      o.variant === 'bands' ? (Math.floor(i / 80) / 30) * h : dots() * h;
    ctx.fillRect(x, y, 1.3, 1.3);
  });
  ctx.globalAlpha = 1;
  return `Independent decorative showdown sample / n=${results.length}`;
}
