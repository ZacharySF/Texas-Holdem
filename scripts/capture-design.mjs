/* global document, getComputedStyle, innerWidth */
import { chromium } from '@playwright/test';
import process from 'node:process';
import console from 'node:console';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const routes = JSON.parse(
  readFileSync('design/shots/before/audit.json'),
).filter((x) => x.width === 1440);
mkdirSync('design/shots/after', { recursive: true });
mkdirSync('design/shots/grid', { recursive: true });
const results = [];
for (const [width, height] of [
  [1440, 900],
  [1024, 768],
  [390, 844],
]) {
  const p = await b.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  });
  for (const { name, route } of routes) {
    await p.goto(
      `${process.env.UI_BASE_URL || 'http://localhost:5175'}/#/${route}`,
    );
    await p.locator('.site-main h1').first().waitFor();
    if (route.startsWith('learn/'))
      await p.locator('[data-part="hook"]').waitFor();
    if (name === 'play') {
      await p
        .getByRole('button', { name: 'Six-player table', exact: true })
        .click();
      await p.locator('.felt-table').waitFor();
      await p
        .locator('.spec-readout')
        .waitFor({ state: 'attached', timeout: 30000 });
    }
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(160);
    await p.screenshot({ path: `design/shots/after/${name}-${width}.png` });
    const metrics = await p.evaluate(() => {
      const visible = (e) =>
        e.getClientRects().length &&
        getComputedStyle(e).visibility !== 'hidden';
      const text = [...document.querySelectorAll('#root *')].filter(
        (e) =>
          visible(e) &&
          !e.closest('svg,[aria-hidden="true"]') &&
          [...e.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          ),
      );
      const sizes = text.map((e) => parseFloat(getComputedStyle(e).fontSize));
      const shell = document
        .querySelector('.site-shell')
        .getBoundingClientRect();
      const target =
        document.querySelector('.course-main') ||
        document.querySelector('.site-main');
      const outer = innerWidth < 768 ? 16 : 32,
        gutter = innerWidth < 768 ? 16 : 24,
        columns = innerWidth < 768 ? 4 : 12;
      const cell = (shell.width - 2 * outer - (columns - 1) * gutter) / columns;
      const expected =
        shell.left + outer + (innerWidth < 768 ? 0 : 2 * (cell + gutter));
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: [...document.querySelectorAll('h1')].filter(visible).length,
        smallest: Math.min(...sizes),
        largest: Math.max(...sizes),
        scale: Math.max(...sizes) / Math.min(...sizes),
        gridDelta: Math.abs(target.getBoundingClientRect().left - expected),
        images: [...document.querySelectorAll('img')]
          .filter(visible)
          .filter((e) => !e.complete || e.naturalWidth === 0)
          .map((e) => e.src),
        emptyZone: parseFloat(
          getComputedStyle(document.querySelector('.site-main'), '::after')
            .height,
        ),
        fonts: [...document.fonts]
          .filter((f) => f.status === 'loaded')
          .map((f) => f.family),
      };
    });
    results.push({ name, route, width, height, ...metrics });
    await p.evaluate(() =>
      document.querySelector('#root').classList.add('debug-grid'),
    );
    await p.screenshot({ path: `design/shots/grid/${name}-${width}.png` });
    await p.evaluate(() =>
      document.querySelector('#root').classList.remove('debug-grid'),
    );
  }
  await p.close();
  console.log('Captured', width, routes.length, 'views and grids');
}
await b.close();
writeFileSync(
  'design/shots/after/audit.json',
  JSON.stringify(results, null, 2),
);
