import { expect, test } from '@playwright/test';
test('starting-hand reference, modeled shove chart, and resource links', async ({
  page,
}, info) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.goto('/#/lab/charts');
  await expect(
    page.getByRole('heading', { name: 'Hand charts', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Chart ready', {
    timeout: 30000,
  });
  await expect(page.locator('.hand-matrix button')).toHaveCount(169);
  const suited = page
    .locator('.hand-matrix button')
    .filter({ hasText: /^AKs/ });
  await suited.click();
  await expect(
    page.getByRole('complementary', { name: 'Selected starting hand' }),
  ).toContainText('suited · 4 physical combinations');
  await expect(
    page.getByRole('complementary', { name: 'Selected starting hand' }),
  ).toContainText('Sampling interval');
  await page.screenshot({
    path: `docs/screenshots/hand-charts-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Shove / fold', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Chart ready', {
    timeout: 30000,
  });
  await page.getByLabel('Big blind calls with').selectOption('all');
  await expect(page.locator('.hand-matrix')).not.toContainText('shove');
  await page.getByRole('button', { name: 'Build chart', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Chart ready', {
    timeout: 30000,
  });
  await page.getByRole('button', { name: /^AA, shove/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Shove in this model', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^72o, fold/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Fold in this model', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/shove-chart-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Starting-hand equity', exact: true })
    .click();
  await page.getByLabel('Samples per hand').selectOption('5000');
  await page.getByRole('button', { name: 'Build chart', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel chart', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Build chart', exact: true }),
  ).toBeEnabled();
  const links = await page
    .getByRole('region', { name: 'Poker resource index' })
    .getByRole('link')
    .evaluateAll((items) => items.map((a) => a.getAttribute('href')));
  expect(links).toContain('#/learn/0-2');
  expect(links).toContain('#/lab/tools/icm');
  await page.getByRole('link', { name: 'Full course', exact: false }).click();
  await expect(
    page.getByRole('heading', { name: 'Course', exact: true }),
  ).toBeVisible();
});

test('worked equity calculation and chart lessons guide the learner', async ({
  page,
}) => {
  await page.goto('/#/learn/11-1');
  const example = page.getByRole('region', {
    name: 'Calculate equity by hand',
  });
  await expect(example).toContainText('44 possible rivers');
  await example.getByLabel('Your answer (%)', { exact: true }).fill('50');
  await example
    .getByRole('button', { name: 'Check calculation', exact: true })
    .click();
  await expect(example.getByRole('status')).toContainText('Try again');
  await example.getByLabel('Your answer (%)', { exact: true }).fill('95.45');
  await example
    .getByRole('button', { name: 'Check calculation', exact: true })
    .click();
  await expect(example.getByRole('status')).toContainText('Correct');
  await example
    .getByRole('button', { name: 'Show worked answer', exact: true })
    .click();
  await expect(example.getByLabel('Equity arithmetic')).toContainText('21/22');
  for (const lesson of ['7-1', '18-1', '23-1']) {
    await page.goto('/#/learn/' + lesson);
    const guide = page.getByRole('region', { name: 'Hand chart walkthrough' });
    await expect(guide).toBeVisible();
    await guide.getByRole('button', { name: 'AKo', exact: true }).click();
    await expect(guide.getByRole('status')).toContainText(
      'offsuit, 12 physical card combinations',
    );
  }
  await page
    .getByRole('link', {
      name: 'Open the full chart and try these steps →',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Small blind open shoves', exact: true }),
  ).toBeVisible();
});

test('blue display settings persist and chapter rows have no repeated artwork', async ({
  page,
}, info) => {
  await page.goto('/#/play');
  await page.getByText('Display', { exact: true }).click();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.getByLabel('Four-color deck', { exact: true }).check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue');
  await expect(page.locator('html')).toHaveAttribute('data-four-color', 'true');
  await page
    .getByRole('button', { name: 'Six-player table', exact: true })
    .click();
  await expect(page.locator('.bot-seat')).toHaveCount(5);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('[data-renderer="pixi"]')).toBeVisible();
  await page.getByText('Display', { exact: true }).click();
  await page.getByRole('button', { name: 'Violet', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.screenshot({
    path: `docs/screenshots/blue-six-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto('/#/learn');
  await expect(page.locator('.chapter-ghost')).toHaveCount(0);
  if (info.project.name === 'phone')
    await page
      .getByRole('button', { name: 'Browse chapters & lessons', exact: true })
      .click();
  await expect(page.locator('.chapter-title-row')).toHaveCount(26);
  const titles = await page.locator('.chapter-title-row').allTextContents();
  expect(titles).toHaveLength(26);
  expect(new Set(titles).size).toBe(titles.length);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
