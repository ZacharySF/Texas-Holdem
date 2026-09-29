import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page) {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: ArrayBufferView<ArrayBuffer>) => {
        if (array instanceof Uint32Array && array.length === 4) {
          array.set([0x12345678, 0x3c6ef362, 0x12345678, 0x12345678]);
          return array;
        }
        return original(array);
      },
    });
  });
  await page.goto('/#/play');
  await page
    .getByRole('link', { name: 'Tournament · timed, no coach' })
    .click();
  await expect(page).toHaveURL(/#\/play\/tournament$/);
  await page
    .getByRole('button', { name: 'Start tournament', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Fold', exact: true }),
  ).toBeEnabled();
}

test('tournament clock enforces expiry, hides coaching, and cannot be reset by reload', async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await setup(page);
  const bankroll = await page.evaluate(() =>
    localStorage.getItem('holdem-play-v1'),
  );
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Live hand readout' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Open coach|Reveal coach/ }),
  ).toHaveCount(0);
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(10);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/tournament-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.clock.fastForward(31000);
  await expect(page.locator('.hero-seat')).toHaveClass(/folded/);
  await expect(
    page.getByText('You: time expired — automatic fold.'),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status')).toContainText(/forfeited/);
  await expect(
    page.getByRole('button', { name: 'Start tournament', exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => localStorage.getItem('holdem-play-v1')),
  ).toBe(bankroll);
});

test('tournament supports keyboard actions, automatic continuation and forfeit', async ({
  page,
}) => {
  await setup(page);
  const call = page.getByRole('button', { name: 'Call 20', exact: true });
  await call.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hero-seat .seat-action')).toHaveText('Called');
  await expect(
    page.getByRole('button', { name: 'Fold', exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page.getByRole('button', { name: 'Fold', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Tournament standings' })
      .locator('div')
      .first(),
  ).toHaveText('Hand2', { timeout: 60000 });
  await page.getByText('Leave this tournament', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Forfeit tournament', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Tournament result' }),
  ).toContainText('Tournament forfeited');
  await page
    .getByRole('button', { name: 'Start new tournament', exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'Tournament standings' })
      .locator('div')
      .first(),
  ).toHaveText('Hand1');
  await page
    .getByRole('link', { name: 'Practice with the coach', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Tournament · timed, no coach' })
    .click();
  await expect(page.getByText('Previous tournament: forfeited.')).toBeVisible();
});

test('course explains expected awards and separate pots with the shared worked examples', async ({
  page,
}) => {
  await page.goto('/#/learn/12-2');
  const explanation = page.getByRole('region', {
    name: 'Understanding pots and expected awards',
  });
  await expect(explanation).toContainText('70 chips');
  await expect(explanation).toContainText('20 chips of expected net gain');
  await expect(explanation).toContainText('side pot');
  await explanation
    .getByText(
      'Check your understanding: should you subtract the call for each pot?',
      { exact: true },
    )
    .click();
  await expect(explanation.getByText(/You make one payment/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
