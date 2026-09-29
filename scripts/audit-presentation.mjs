/* global document, getComputedStyle, innerWidth, performance */
import { chromium } from '@playwright/test';
import process from 'node:process';
import console from 'node:console';
import { readFileSync, writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const manifest = JSON.parse(readFileSync('design/shots/before/audit.json'));
const out = [];
for (const width of [1440, 1024, 390]) {
  for (const { name, route } of manifest.filter((r) => r.width === 1440)) {
    const p = await b.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await p.goto(
      `${process.env.UI_BASE_URL || 'http://localhost:5175'}/#/${route}`,
    );
    await p.locator('.site-main h1').waitFor();
    if (route.startsWith('learn/'))
      await p.locator('[data-part="hook"]').waitFor();
    if (name === 'play') {
      await p
        .getByRole('button', { name: 'Six-player table', exact: true })
        .click();
      await p.locator('.felt-table').waitFor();
    }
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(100);
    const scan = await p.evaluate(() => {
      const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = (c) =>
        c
          .slice(0, 3)
          .map((n) => n / 255)
          .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (a, b) => {
        const x = lum(a),
          y = lum(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const violations = [];
      const pairs = new Map();
      let smallest = Infinity,
        largest = 0;
      for (const el of document.querySelectorAll('#root *')) {
        if (
          el.closest('svg,[aria-hidden="true"],button:disabled,[hidden]') ||
          !el.getClientRects().length
        )
          continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        if (
          ![...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          )
        )
          continue;
        const fg = rgb(cs.color);
        let bg = [2, 1, 7];
        const chain = [];
        for (let n = el; n; n = n.parentElement) chain.unshift(n);
        for (const n of chain) {
          const c = rgb(getComputedStyle(n).backgroundColor);
          const a = c[3] ?? 1;
          bg = bg.map((v, i) => v * (1 - a) + (c[i] || 0) * a);
        }
        const size = parseFloat(cs.fontSize),
          bold = Number(cs.fontWeight) >= 700,
          min = size >= 24 || (size >= 19 && bold) ? 3 : 4.5;
        smallest = Math.min(smallest, size);
        largest = Math.max(largest, size);
        const actual = ratio(fg, bg);
        const key = [cs.color, bg.map(Math.round).join(','), min].join('/');
        pairs.set(key, {
          fg: cs.color,
          bg: bg.map(Math.round),
          minimum: min,
          ratio: actual,
        });
        if (actual + 0.001 < min)
          violations.push({
            tag: el.tagName,
            cl: el.className,
            text: el.textContent.slice(0, 65),
            ratio: actual,
            min,
          });
      }
      return {
        violations,
        pairs: [...pairs.values()],
        overflow: document.documentElement.scrollWidth > innerWidth,
        overflowNodes: [...document.querySelectorAll('.site-main *')]
          .filter(
            (e) =>
              e.getBoundingClientRect().right > innerWidth + 1 &&
              getComputedStyle(e).position !== 'absolute',
          )
          .slice(0, 8)
          .map((e) => [e.tagName, e.className]),
        smallest,
        fontBytes: performance
          .getEntriesByType('resource')
          .filter((r) => /\.woff2/.test(r.name))
          .reduce((sum, r) => sum + r.decodedBodySize, 0),
        largest,
        scale: largest / smallest,
      };
    });
    out.push({ name, route, width, ...scan });
    await p.close();
    if (scan.violations.length || scan.overflow)
      console.log(
        name,
        width,
        JSON.stringify({
          v: scan.violations,
          overflow: scan.overflow,
          els: scan.overflowNodes,
        }),
      );
  }
  console.log(width, 'complete');
}
await b.close();
writeFileSync('design/rendered-audit.json', JSON.stringify(out, null, 2));

if (out.some((r) => r.violations.length || r.overflow || r.fontBytes > 150000))
  process.exitCode = 1;
