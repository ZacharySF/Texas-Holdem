import { test, expect } from '@playwright/test';
const seed = '0123456789abcdef0123456789abcdef';
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('equity tool preserves card picking, seeded URL replay, and worker results', async ({
  page,
}) => {
  await page.goto('/#/lab');
  await expect(page).toHaveURL(/state=/);
  await page.getByRole('button', { name: '1k', exact: true }).click();
  await expect(page.locator('.method')).toContainText('1,000');
  await expect(page.getByText('COMPLETE', { exact: true })).toBeVisible();
  const first = await page.locator('.probability strong').first().innerText();
  const url = page.url();
  await page.reload();
  await page.getByRole('button', { name: '1k', exact: true }).click();
  await expect(page.getByText('COMPLETE', { exact: true })).toBeVisible();
  await expect(page.locator('.probability strong').first()).toHaveText(first);
  await expect(page).toHaveURL(url);
  await page.getByRole('button', { name: 'Board card 1' }).click();
  const picker = page.getByRole('dialog');
  await picker.getByRole('button', { name: '2', exact: true }).click();
  await picker.getByRole('button', { name: 'clubs', exact: true }).click();
  await expect(picker).not.toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(new URLSearchParams(location.hash.split('?')[1]).get('state')!),
  );
  expect(state.board).toEqual([0]);
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1k', exact: true }).click();
  await expect(page.getByText('COMPLETE', { exact: true })).toBeVisible();
});

test('range weights, card validation, and exact experiment stay reactive', async ({
  page,
}) => {
  await page.goto('/#/lab/ranges');
  await page.getByLabel('Board cards', { exact: true }).fill('2c 3d 7h 9s Ts');
  await page
    .getByRole('button', { name: 'Count exact equity', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Equity complete.' }),
  ).toBeVisible();
  await page.getByLabel('Hero cards', { exact: true }).fill('As As');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Hero cards', { exact: true }).fill('Qs Qh');
  await expect(page.getByRole('alert')).toHaveCount(0);
  const cell = page.getByRole('button', { name: /^AA, / });
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'false');
  await page
    .getByRole('button', { name: 'Count exact equity', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Equity complete.' }),
  ).toBeVisible();
  const url = page.url();
  await page.reload();
  await expect(page.getByLabel('Hero cards', { exact: true })).toHaveValue(
    'Qs Qh',
  );
  await expect(page.getByRole('button', { name: /^AA, / })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page).toHaveURL(url);
});

test('early lessons, repeated events, and bankroll experiments run in native Svelte', async ({
  page,
}) => {
  await page.goto(`/#/learn/1-1?seed=${seed}`);
  await page
    .getByRole('button', { name: 'Run 1,000 trials', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Experiment complete.' }),
  ).toBeVisible();
  await page.goto(`/#/lab/events?seed=${seed}`);
  await page
    .getByRole('button', { name: 'Run 1,000 trials', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Experiment complete.' }),
  ).toBeVisible();
  await page.goto(`/#/lab/bankroll?seed=${seed}&hands=100&runs=100`);
  await page.getByRole('button', { name: 'Simulate bankroll paths' }).click();
  await expect(page.getByRole('status')).toContainText('100 paths');
  await page.getByLabel('Independent paths').fill('200');
  await page.getByRole('button', { name: 'Simulate bankroll paths' }).click();
  await expect(page.getByRole('status')).toContainText('200 paths');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
