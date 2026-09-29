import { test, expect, type Page } from '@playwright/test';
import { makePractice } from '../src/features/learn/practice';
const seed = '0123456789abcdef0123456789abcdef';
async function width(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});
test('all final lessons render, simulate, and save mastery', async ({
  page,
}) => {
  for (let chapter = 20; chapter <= 25; chapter++)
    for (const lesson of [1, 2]) {
      await page.goto(`/#/learn/${chapter}-${lesson}?seed=${seed}`);
      await expect(page.locator('[data-part]')).toHaveCount(7);
      await page
        .getByRole('button', { name: 'Run experiment', exact: true })
        .click();
      await expect(
        page.getByText('Experiment complete.', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await width(page);
    }
  await page.goto(`/#/learn/24-2?seed=${seed}`);
  const problems = makePractice('24-2', seed);
  for (const [i, p] of problems.entries()) {
    await page
      .getByLabel('Your answer', { exact: true })
      .fill(p.answer.toString());
    await page
      .getByRole('button', { name: 'Check answer', exact: true })
      .click();
    if (i < 4)
      await page
        .getByRole('button', { name: 'Next question', exact: true })
        .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Lesson mastered', exact: true }),
  ).toBeVisible();
  await page.reload();
  expect(
    await page.evaluate(() => localStorage.getItem('holdem-learn-v1')),
  ).not.toBeNull();
});
test('shuffle enumeration, URL replay, calculators, and input recovery', async ({
  page,
}, info) => {
  await page.goto(`/#/lab/shuffle?seed=${seed}`);
  await expect(page.getByRole('table')).toContainText(
    '27 equally likely paths',
  );
  await page
    .getByRole('button', { name: 'Run experiment', exact: true })
    .click();
  await expect(
    page.getByText('Experiment complete.', { exact: true }),
  ).toBeVisible();
  await width(page);
  if (info.project.name === 'desktop')
    await page.screenshot({
      path: 'docs/screenshots/shuffle-lab.png',
      fullPage: true,
    });
  await page.getByLabel('Shuffle method').selectOption('fisherYates');
  await expect(page.getByRole('table')).toContainText('6 equally likely paths');
  await page.reload();
  await expect(page.getByLabel('Shuffle method')).toHaveValue('fisherYates');
  for (const tool of ['push', 'icm', 'sizing', 'insurance']) {
    await page.goto(`/#/lab/tools/${tool}?seed=${seed}`);
    await expect(
      page.getByRole('button', { name: 'Apply inputs', exact: true }),
    ).toBeVisible();
    const buttons = page.getByRole('button', {
      name: 'Run experiment',
      exact: true,
    });
    for (let i = 0; i < (await buttons.count()); i++) {
      await buttons.nth(i).click();
      await expect(
        page
          .locator('.final-experiment')
          .nth(i)
          .getByText('Experiment complete.', { exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByRole('alert')).toHaveCount(0);
    await width(page);
  }
  await page.goto('/#/lab/tools/icm');
  await page.getByLabel('Chip stacks, seat order').fill('oops');
  await page.getByRole('button', { name: 'Apply inputs' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Chip stacks, seat order').fill('40,30,30');
  await page.getByRole('button', { name: 'Apply inputs' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('Streak Trap and AKQ play, replay, solver, and display settings', async ({
  page,
}, info) => {
  await page.goto(`/#/arcade/streak?seed=${seed}`);
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Streak prediction').selectOption('same');
    await page.getByRole('button', { name: 'Check prediction' }).click();
    if (i < 4)
      await page.getByRole('button', { name: 'Next question' }).click();
  }
  await expect(page.getByText(/Set complete: 5 \/ 5/)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('holdem-streak-v1')),
  ).toContain(seed);
  await page.goto(`/#/arcade/akq?seed=${seed}`);
  const card = await page
    .getByRole('heading', { name: /Your card:/ })
    .innerText();
  await page.getByRole('button', { name: 'Bet one', exact: true }).click();
  await expect(page.getByText(/Your net result:/)).toBeVisible();
  const result = await page.getByRole('status').first().innerText();
  await page.getByRole('button', { name: 'Replay this exact deal' }).click();
  await expect(page.getByRole('heading', { name: /Your card:/ })).toHaveText(
    card,
  );
  await page.getByRole('button', { name: 'Bet one', exact: true }).click();
  await expect(page.getByRole('status').first()).toHaveText(result);
  await page
    .getByRole('button', { name: 'Run experiment', exact: true })
    .click();
  await expect(
    page.getByText('Experiment complete.', { exact: true }),
  ).toBeVisible();
  await width(page);
  if (info.project.name === 'phone')
    await page.screenshot({
      path: 'docs/screenshots/akq-phone.png',
      fullPage: true,
    });
  await page.getByText('Display', { exact: true }).click();
  await expect(page.getByLabel('Light theme')).toHaveCount(0);
  await page.getByLabel('Four-color deck').check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-four-color', 'true');
  await width(page);
});
test('run-it-twice table, saved history, and Stats', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'holdem-play-v1',
      JSON.stringify({ bankroll: 2000, xp: 1000, hands: 0, settled: [] }),
    );
    const original = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: ArrayBufferView<ArrayBuffer>) => {
        if (array instanceof Uint32Array) {
          // This deal gives the bot a profitable all-in call under its range model.
          array.fill(6);
          return array;
        }
        return original(array);
      },
    });
  });
  await page.goto('/#/play');
  await page
    .getByText('Table settings & advanced options', { exact: true })
    .click();
  await page
    .getByLabel('Run it twice when betting is closed by all-ins')
    .check();
  await page.getByLabel('Bot persona').selectOption('calling-station');
  await page
    .getByRole('button', { name: 'Commit next deal', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Deal committed hand', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Set all-in amount', exact: true })
    .click();
  await page.getByRole('button', { name: /^Raise to \d/ }).click();
  await expect(page.locator('.table-status')).toContainText('Hand over.', {
    timeout: 60000,
  });
  await expect(
    page.getByText('Second runout', { exact: true }).first(),
  ).toBeVisible();
  const boardBottom = await page
    .locator('.table-center')
    .evaluate((el) => el.getBoundingClientRect().bottom);
  const heroTop = await page
    .locator('.hero-seat')
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(boardBottom).toBeLessThan(heroTop);
  await page
    .getByText('Review this hand · replay, cards & bot thinking', {
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Hand history, replay, and x-ray' }),
  ).toBeVisible();
  await width(page);
  await page.goto('/#/stats');
  await expect(
    page.getByRole('heading', { name: '1 hands played', exact: true }),
  ).toBeVisible();
  await width(page);
});

test('worker cancellation and phone tap targets', async ({ page }) => {
  await page.route('**/assets/final.worker-*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto(`/#/lab/shuffle?seed=${seed}`);
  await page
    .getByRole('button', { name: 'Run experiment', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Cancel experiment', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run experiment', exact: true }),
  ).toBeEnabled();
  await expect(page.getByText('Running…', { exact: true })).toHaveCount(0);
  await page.unrouteAll({ behavior: 'wait' });
  await page
    .getByRole('button', { name: 'Run experiment', exact: true })
    .click();
  await expect(
    page.getByText('Experiment complete.', { exact: true }),
  ).toBeVisible();
  const sizes = await page.locator('button,select').evaluateAll((elements) =>
    elements
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width && r.height)
      .map((r) => ({ width: r.width, height: r.height })),
  );
  expect(sizes.every((r) => r.width >= 44 && r.height >= 44)).toBe(true);
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
