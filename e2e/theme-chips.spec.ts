import { test, expect } from '@playwright/test';

test('nine themes persist, surprise chooses another, and the top rail has no Display control', async ({
  page,
}) => {
  await page.goto('/#/play');
  await expect(page.locator('.app-header .settings')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Change display', exact: true })
    .click();
  const options = page.getByRole('group', { name: 'Color theme' });
  await expect(options.getByRole('button')).toHaveCount(9);
  for (const [label, id] of [
    ['Grey', 'grey'],
    ['Dark', 'night'],
    ['Darker', 'darker'],
    ['Green', 'green'],
    ['Amber', 'amber'],
    ['Ocean', 'ocean'],
    ['Purple', 'anime'],
  ]) {
    await options.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'anime');
  await page
    .getByRole('button', { name: 'Change display', exact: true })
    .click();
  await page.getByRole('button', { name: 'Surprise me' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'anime');
  await expect(
    page
      .getByRole('group', { name: 'Color theme' })
      .locator('[aria-pressed="true"]'),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('F toggles practice fullscreen but does not intercept editing or repeats', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page.keyboard.press('f');
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('button', { name: /^Fold/ })).toBeEnabled();
  await page.locator('#raise-to').focus();
  const center = await page.locator('.table-center').boundingBox();
  const opponent = await page.locator('.bot-seat').boundingBox();
  const hero = await page.locator('.hero-seat').boundingBox();
  expect(center!.y).toBeGreaterThan(opponent!.y + opponent!.height);
  expect(center!.y + center!.height).toBeLessThan(hero!.y);
  await page.keyboard.press('f');
  await expect(page.locator('.play-viewport')).not.toHaveClass(/play-expanded/);
  await page
    .locator('#raise-to')
    .evaluate((element) => (element as HTMLElement).blur());
  await page.keyboard.press('f');
  await expect(page.locator('.play-viewport')).toHaveClass(/play-expanded/);
  await expect(page.locator('.play-view-controls')).toHaveCount(0);
  await page.keyboard.press('f');
  await expect(page.locator('.play-viewport')).not.toHaveClass(/play-expanded/);
  await page.evaluate(() =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', repeat: true }),
    ),
  );
  await expect(page.locator('.play-viewport')).not.toHaveClass(/play-expanded/);
});

test('pot and personal chip graphics follow live bets and selected theme colors', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('button', { name: /^Call / })).toBeEnabled();
  const mine = page.locator('.hero-seat .chip-stack');
  const pot = page.locator('.pot-chip .chip-stack');
  const beforeMine = Number(await mine.getAttribute('data-chip-amount'));
  const beforePot = Number(await pot.getAttribute('data-chip-amount'));
  await page.getByText('Display', { exact: true }).click();
  await page.getByRole('button', { name: 'Green', exact: true }).click();
  const green = await mine
    .locator('.chip-face')
    .first()
    .evaluate((element) => getComputedStyle(element).fill);
  await page.getByRole('button', { name: 'Purple', exact: true }).click();
  await expect
    .poll(() =>
      mine
        .locator('.chip-face')
        .first()
        .evaluate((element) => getComputedStyle(element).fill),
    )
    .not.toBe(green);
  await page.getByText('Display', { exact: true }).click();
  await page.getByRole('button', { name: /^Call / }).click();
  await expect
    .poll(async () => Number(await mine.getAttribute('data-chip-amount')))
    .toBeLessThan(beforeMine);
  await expect
    .poll(async () => Number(await pot.getAttribute('data-chip-amount')))
    .toBeGreaterThan(beforePot);
  for (const stack of [mine, pot]) {
    const represented = await stack
      .locator('[data-denomination]')
      .evaluateAll((groups) =>
        groups.reduce(
          (sum, group) =>
            sum +
            Number(group.getAttribute('data-denomination')) *
              Number(group.getAttribute('data-count')),
          0,
        ),
      );
    expect(represented).toBe(
      Number(await stack.getAttribute('data-chip-amount')),
    );
  }
  expect(
    Number(
      (await page.locator('.pot-chip strong').textContent())!.replaceAll(
        ',',
        '',
      ),
    ),
  ).toBe(Number(await pot.getAttribute('data-chip-amount')));
  await expect(pot).toHaveAttribute('aria-hidden', 'true');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Last decision shows a computed assessment and resets on the next hand', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  const openCoach = page.getByRole('button', {
    name: 'Open coach · help with this hand',
  });
  if (await openCoach.isVisible()) await openCoach.click();
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Fold/ }).click();
  await page
    .getByRole('button', { name: 'Last decision', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Last decision details' }),
  ).toContainText('Folded');
  await expect(
    page.getByRole('region', { name: 'Last decision details' }),
  ).toContainText('Equity when you acted');
  await expect(page.locator('.coach-topic')).toContainText(
    /Close to the best direct-odds option|chips below the best modeled option/,
  );
  await page
    .getByRole('button', { name: 'Deal next hand', exact: true })
    .click();
  await expect(page.locator('.coach-topic')).toContainText(
    'Make a decision first.',
  );
});

test('all six chip stacks sit beside cards and match their visible balances', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page
    .getByRole('button', { name: 'Six-player table', exact: true })
    .click();
  await expect(page.locator('.seat .chip-stack')).toHaveCount(6);
  for (const seat of await page.locator('.seat').all()) {
    const cards = await seat.locator('.playing-cards').boundingBox();
    const chips = await seat.locator('.chip-stack').boundingBox();
    const box = await seat.boundingBox();
    expect(chips!.x).toBeGreaterThanOrEqual(cards!.x + cards!.width);
    expect(chips!.x + chips!.width).toBeLessThanOrEqual(
      box!.x + box!.width + 1,
    );
    expect(
      Number(
        await seat.locator('.chip-stack').getAttribute('data-chip-amount'),
      ),
    ).toBe(
      Number(
        (await seat.locator('.seat-stack').textContent())!.replace(
          /[^0-9]/g,
          '',
        ),
      ),
    );
  }
});

test('stars stay in the practice table in normal and fullscreen play and respect reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/play');
  await expect(page.locator('.fullscreen-stars')).toHaveCount(0);
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  const stars = page.locator('.felt-table > .fullscreen-stars');
  await expect(stars).toBeVisible();
  await expect(stars.locator('i')).toHaveCount(300);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(stars).toHaveAttribute('aria-hidden', 'true');
  await expect(stars).toHaveCSS('pointer-events', 'none');
  await page.mouse.move(30, 30);
  const far = stars.locator('.star-depth').first();
  await expect
    .poll(() => far.evaluate((el) => el.style.transform))
    .toMatch(/translate3d/);
  const initial = await far.evaluate((el) => el.style.transform);
  await page.mouse.move(1400, 850);
  await expect
    .poll(() => far.evaluate((el) => el.style.transform))
    .not.toBe(initial);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(far).toHaveCSS('transform', 'none');
  await expect(stars.locator('.star-drift').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await page.keyboard.press('f');
  await expect(stars).toBeVisible();
  await page.locator('.app-header nav a[href="#/stats"]').click();
  await expect(page.locator('.fullscreen-stars')).toHaveCount(0);
});

test('Last decision changes from call to fold and keeps its recorded action visible', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  const openCoach = page.getByRole('button', {
    name: 'Open coach · help with this hand',
  });
  if (await openCoach.isVisible()) await openCoach.click();
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Call / }).click();
  await page
    .getByRole('button', { name: 'Last decision', exact: true })
    .click();
  const details = page.getByRole('region', { name: 'Last decision details' });
  await expect(details).toContainText('Called');
  await expect(details).toContainText('Equity when you acted');
  await page.getByRole('button', { name: /^Fold/ }).click();
  await expect(details).toContainText('Folded');
  await expect(details).not.toContainText('Called');
});

test('blinds are labeled and deducted, and folded hands remain private until explicit post-hand study', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(
    page.locator('.hero-seat [aria-label="Small blind"]'),
  ).toBeVisible();
  await expect(
    page.locator('.bot-seat [aria-label="Big blind"]'),
  ).toBeVisible();
  await expect(page.locator('.hero-seat .seat-stack')).toContainText('1,995');
  await expect(page.locator('.bot-seat .seat-stack')).toContainText('1,990');
  await page.getByRole('button', { name: /^Fold/ }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await expect(
    page.locator('.bot-seat [aria-label="Hidden opponent card"]'),
  ).toHaveCount(2);
  await page.locator('.review-drawer > summary').click();
  await expect(
    page.locator('.replay-hands [aria-label="Hidden opponent card"]'),
  ).toHaveCount(2);
  await page.getByLabel('Reveal hidden hands for post-hand study').check();
  await expect(
    page.locator('.replay-hands [aria-label="Hidden opponent card"]'),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Deal next hand', exact: true })
    .click();
  await expect(
    page.locator('.hero-seat [aria-label="Big blind"]'),
  ).toBeVisible();
  await expect(
    page.locator('.bot-seat [aria-label="Small blind"]'),
  ).toBeVisible();
});
