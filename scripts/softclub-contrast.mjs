import { readFileSync } from 'node:fs';
import console from 'node:console';
import { URL } from 'node:url';

/** Conservative composite: overlapping light peaks, glass, then its top sheen. */
export function checkSoftclubContrast(contrast) {
  const css = readFileSync(
    new URL('../src/styles/softclub-tokens.css', import.meta.url),
    'utf8',
  );
  const alpha = Number(css.match(/--sc-glass-alpha:\s*([\d.]+)/)[1]);
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (c) =>
    '#' + c.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  const blend = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  const texts = {
    text: '#b1b7d0',
    cyan: '#aef7fc',
    red: '#d4526d',
    orange: '#e89a3c',
    lime: '#b4c64a',
  };
  let pass = true;
  for (const [theme, fill, key, deep, weight] of [
    ['violet', '#0e0930', '#6449d7', '#36287d', 0.38],
    ['blue', '#0e0930', '#548ac7', '#234b73', 0.46],
  ]) {
    let peak = blend(rgb('#e89a3c'), rgb('#020107'), 0.16);
    peak = blend(rgb(key), peak, weight);
    peak = blend(rgb('#1ed3f0'), peak, 0.05);
    const glass = hex(
      blend(rgb('#b1b7d0'), blend(rgb(fill), peak, alpha), 0.02),
    );
    // Hover sheen peaks are included in small button-label validation.
    const gel = hex(
      blend(
        rgb('#ffffff'),
        blend(rgb('#ffffff'), blend(rgb(deep), rgb(fill), 0.65), 0.03),
        0.06,
      ),
    );
    const record = (label, fg, bg, min) => {
      const value = contrast(fg, bg);
      const ok = value >= min;
      pass &&= ok;
      console.log(
        `${ok ? 'PASS' : 'FAIL'} softclub ${theme} ${label}: ${value.toFixed(2)}:1 (requires ${min})`,
      );
    };
    for (const [label, color] of Object.entries(texts))
      record(`glass × ${label}`, color, glass, 4.5);
    record('gel hover × label', texts.text, gel, 4.5);
    for (const color of [
      '#eef0fa',
      '#b1b7d0',
      key,
      '#776da2',
      '#d9dcef',
      '#8f93b5',
    ])
      record('chrome stop', color, '#020107', 3);
    record(
      'glass masthead stroke',
      hex(blend(rgb('#b1b7d0'), rgb('#020107'), 0.85)),
      '#020107',
      3,
    );
  }
  return pass;
}
