import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import console from 'node:console';

export function checkLoungeContrast(contrast) {
  const css =
    readFileSync(
      new URL('../src/styles/lounge-tokens.css', import.meta.url),
      'utf8',
    ) +
    readFileSync(
      new URL('../src/styles/theme-options.css', import.meta.url),
      'utf8',
    );
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((match) => ({
      name: match[1].match(/data-theme='([^']+)'/)?.[1] ?? 'violet',
      values: Object.fromEntries(
        [...match[2].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((pair) => [
          pair[1],
          pair[2].trim(),
        ]),
      ),
    }))
    .filter((block) => block.values['--ink-0']);
  const base = blocks[0].values;
  const rgb = (value) =>
    [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  const hex = (values) =>
    '#' +
    values
      .map((value) => Math.round(value).toString(16).padStart(2, '0'))
      .join('');
  const blend = (front, back, alpha) =>
    front.map((value, i) => value * alpha + back[i] * (1 - alpha));
  let pass = true;
  for (const [index, block] of blocks.entries()) {
    const tokens = { ...base, ...block.values };
    const report = (name, front, back, threshold) => {
      const ratio = contrast(front, back);
      const ok = ratio >= threshold;
      pass &&= ok;
      console.log(
        `${ok ? 'PASS' : 'FAIL'} lounge ${index ? block.name : 'violet'} ${name}: ${ratio.toFixed(2)}:1 (requires ${threshold})`,
      );
    };
    // Even a white source pixel is dimmed by the art opacity and full-screen shield.
    let peak = blend(
      rgb('#ffffff'),
      rgb(tokens['--ink-0']),
      Number(tokens['--lg-art-opacity']),
    );
    peak = blend(
      rgb(tokens['--ink-0']),
      peak,
      Number(tokens['--lg-shield-opacity']),
    );
    peak = blend(rgb(tokens['--cyan']), peak, 0.06);
    peak = blend(rgb(tokens['--lg-secondary']), peak, 0.06);
    peak = blend(rgb('#ffffff'), peak, Number(tokens['--lg-figure-opacity']));
    let glass = blend(
      rgb(tokens['--ink-1']),
      peak,
      Number(tokens['--lg-panel-alpha']),
    );
    glass = blend(rgb(tokens['--cyan']), glass, 0.02);
    glass = blend(rgb(tokens['--lg-secondary']), glass, 0.02);
    for (const token of [
      '--text',
      '--text-dim',
      '--cyan-hi',
      '--red',
      '--orange',
      '--lime',
    ])
      report(`glass × ${token}`, tokens[token], hex(glass), 4.5);
    report('unpanelled body', tokens['--text'], hex(peak), 4.5);
    report('masthead accent', tokens['--ink-5'], hex(peak), 3);
    report(
      'primary action',
      tokens['--lg-primary-text'],
      tokens['--lg-primary'],
      4.5,
    );
    report(
      'primary action shaded stop',
      tokens['--lg-primary-text'],
      hex(blend(rgb(tokens['--lg-primary']), rgb(tokens['--ink-1']), 0.7)),
      4.5,
    );
    report('focus outline', tokens['--cyan'], hex(glass), 3);
    for (const color of ['#854746', '#285e77', '#426653', '#22384a'])
      report('card rank/suit', color, tokens['--lg-slate'], 4.5);
  }
  return pass;
}
