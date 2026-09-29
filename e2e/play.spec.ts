import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page) {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      'holdem-play-v1',
      JSON.stringify({ bankroll: 2000, xp: 1000, hands: 0, settled: [] }),
    );
    const original = crypto.getRandomValues.bind(crypto);
    let hand = 0;
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: ArrayBufferView<ArrayBuffer>) => {
        if (array instanceof Uint32Array) {
          array.fill(++hand);
          return array;
        }
        return original(array);
      },
    });
  });
  await page.goto('/');
  await expect(page).toHaveURL(/#\/play$/);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function openCoach(page: Page) {
  const button = page.getByRole('button', {
    name: 'Open coach · help with this hand',
  });
  if (await button.isVisible()) await button.click();
}
async function closeCoach(page: Page) {
  const button = page.getByRole('button', {
    name: 'Back to table',
    exact: true,
  });
  if (await button.isVisible()) await button.click();
}

test('game entry, visual pot odds, legal play, result, replay and next hand', async ({
  page,
}, testInfo) => {
  await setup(page);
  await expect(
    page.getByRole('button', { name: 'Take a seat & play' }),
  ).toBeVisible();
  await expect(page.getByLabel('Table size')).not.toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `docs/screenshots/poker-lobby-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByText('Table settings & advanced options', { exact: true })
    .click();
  await page.getByLabel('Bot persona').selectOption('calling-station');
  await page
    .getByText('Table settings & advanced options', { exact: true })
    .click();
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('region', { name: 'Poker table' })).toBeVisible();
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(2);
  await openCoach(page);
  await expect(
    page.getByRole('heading', { name: 'Pot odds, step by step' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation' }),
  ).toContainText('5 ÷ 20 = 25.00%');
  await page.getByRole('button', { name: 'Equity', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Equity calculation' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Equity calculation' }),
  ).toContainText('3,000');
  await expect(
    page.getByText('What do the poker words mean?', { exact: true }),
  ).toHaveCount(0);
  const equityAnswer = await page
    .locator('.equity-equation strong')
    .innerText();
  await page
    .getByLabel('Your calculation (%)', { exact: true })
    .fill(equityAnswer.replace('%', ''));
  await page
    .getByRole('button', { name: 'Check my calculation', exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'Calculate your current equity' })
      .getByRole('status'),
  ).toContainText('Correct');

  await page.screenshot({
    path: `docs/screenshots/equity-coach-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Pot odds', exact: true }).click();
  await closeCoach(page);
  await expect(page.getByRole('button', { name: /^Call / })).toBeEnabled();
  await page.getByRole('button', { name: /^Call / }).click();
  await openCoach(page);
  await page.getByRole('button', { name: /^(Check|Call) / }).waitFor();
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explain the hand', exact: true }),
  ).toHaveCount(0);
  await closeCoach(page);
  const heroCards = await page
    .locator('.hero-seat .playing-card')
    .evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().top),
    );
  expect(heroCards[0]).toBe(heroCards[1]);
  const tableBottom = await page
    .locator('.felt-table')
    .evaluate((table) => table.getBoundingClientRect().bottom);
  const controlsTop = await page
    .locator('.action-panel')
    .evaluate((controls) => controls.getBoundingClientRect().top);
  expect(controlsTop).toBeGreaterThanOrEqual(tableBottom);
  await page.locator('.felt-table').screenshot({
    path: `docs/screenshots/poker-table-${testInfo.project.name}.png`,
  });
  await noOverflow(page);
  for (let turn = 0; turn < 30; turn++) {
    await expect(
      page
        .locator('.hand-result, .action-panel button')
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    if (await page.getByRole('region', { name: 'Hand result' }).isVisible())
      break;
    const move = page.getByRole('button', { name: /^(Check|Call) / });
    await expect(move).toBeEnabled({ timeout: 30000 });
    await move.click();
    await expect
      .poll(
        async () =>
          (await page
            .getByRole('region', { name: 'Hand result' })
            .isVisible()) ||
          (await page
            .getByRole('button', { name: /^(Check|Call) / })
            .isEnabled()
            .catch(() => false)),
        { timeout: 30000 },
      )
      .toBe(true);
  }
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await expect(page.locator('.bankroll small')).toContainText('1 hands played');
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(0);
  await page.locator('.review-drawer > summary').click();
  await expect(
    page.getByRole('heading', { name: 'Hand history, replay, and x-ray' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Deal next hand', exact: true })
    .click();
  await expect(page.locator('.hero-seat .dealer-button')).toHaveCount(0);
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(2);
  await page.getByRole('button', { name: /^Fold / }).click();
  await expect(page.locator('.bankroll small')).toContainText('2 hands played');
  await noOverflow(page);
});

test('six seats, optional action captions, and actions without waiting for coach', async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.getByLabel('Explain action buttons').uncheck();
  await page.getByRole('button', { name: /^Six-player table/ }).click();
  await expect(page.locator('.bot-seat')).toHaveCount(5);
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(10);
  await expect(
    page.getByRole('complementary', { name: 'Hand walkthrough' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Fold', exact: true }).waitFor();
  await page.locator('.felt-table').screenshot({
    path: `docs/screenshots/poker-six-${testInfo.project.name}.png`,
  });
  await noOverflow(page);
  await page.getByRole('button', { name: 'Fold', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible({
    timeout: 60000,
  });
  await page.getByRole('button', { name: 'Deal next hand' }).click();
  await expect(page.locator('.hero-seat .dealer-button')).toHaveCount(0);
  await noOverflow(page);
});

test('ordinary play stays usable with a slow coach, while exam requires a prediction', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/assets/play.worker-*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('button', { name: /^Call / })).toBeEnabled();
  await page.getByRole('button', { name: /^Fold / }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await page.reload();
  await page
    .getByText('Table settings & advanced options', { exact: true })
    .click();
  await page.getByLabel('Exam mode').check();
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('button', { name: /^Call / })).toBeDisabled();
  await page.getByLabel('Your estimated equity, in percent').fill('50');
  await page.getByRole('button', { name: 'Reveal coach', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Call / })).toBeEnabled();
});
