import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import console from 'node:console';
import process from 'node:process';
const css = readFileSync(
  new URL('../src/styles/tokens.css', import.meta.url),
  'utf8',
);
const colors = Object.fromEntries(
  [...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\b/gi)].map((m) => [m[1], m[2]]),
);
export function contrast(a, b) {
  const luminance = (hex) => {
    const channels = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}
const pairs = [];
for (const background of ['--ink-0', '--ink-1', '--ink-2', '--ink-3']) {
  pairs.push(
    ['body / labels', '--text', background, 4.5],
    ['current / focus text', '--cyan-hi', background, 4.5],
  );
}
for (const background of ['--ink-0', '--ink-1']) {
  for (const foreground of ['--red', '--orange', '--lime'])
    pairs.push(['semantic text', foreground, background, 4.5]);
  pairs.push(
    ['masthead', '--ink-5', background, 3],
    ['large dim text', '--text-dim', background, 3],
    ['essential control border', '--text', background, 3],
    ['focus outline', '--cyan', background, 3],
  );
}
let failed = false;
for (const [use, foreground, background, minimum] of pairs) {
  const ratio = contrast(colors[foreground], colors[background]);
  const pass = ratio >= minimum;
  failed ||= !pass;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${use}: ${foreground} on ${background} ${ratio.toFixed(2)}:1 (requires ${minimum})`,
  );
}
if (failed) process.exitCode = 1;

// Validate measured browser pairs as well as the allowed token pairings.
if (process.argv.includes('--rendered')) {
  const audit = JSON.parse(
    readFileSync(
      new URL('../design/rendered-audit.json', import.meta.url),
      'utf8',
    ),
  );
  const hex = (rgb) =>
    '#' +
    rgb
      .slice(0, 3)
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('');
  let measured = 0;
  for (const screen of audit)
    for (const pair of screen.pairs) {
      measured++;
      const actual = contrast(
        hex(pair.fg.match(/[\d.]+/g).map(Number)),
        hex(pair.bg),
      );
      if (actual + 0.001 < pair.minimum) {
        console.error(
          `FAIL ${screen.name} ${screen.width}: ${pair.fg} ${pair.bg} ${actual}`,
        );
        process.exitCode = 1;
      }
    }
  console.log(
    `Checked ${measured} rendered text/background pairs across ${audit.length} route/viewport samples.`,
  );
}
