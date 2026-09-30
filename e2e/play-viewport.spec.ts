import { test, expect, type Page } from '@playwright/test';

async function startPractice(page: Page) {
  await page.goto('/#/play');
  await expect(
    page.getByRole('button', { name: 'Fullscreen', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(page.getByRole('button', { name: /^Fold/ })).toBeEnabled();
  await page.locator('.felt-table').evaluate((element) => {
    element.setAttribute('data-fullscreen-probe', 'original-table');
  });
}

test('practice fullscreen keeps the live hand mounted and exits through browser controls', async ({
  page,
}) => {
  await startPractice(page);
  const commitment = await page
    .locator('.commitment-current code')
    .textContent();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.fullscreenElement?.classList.contains('play-viewport'),
      ),
    )
    .toBe(true);
  await expect(page.locator('.felt-table')).toHaveAttribute(
    'data-fullscreen-probe',
    'original-table',
  );
  expect(await page.locator('.commitment-current code').textContent()).toBe(
    commitment,
  );
  await expect(page.locator('.play-view-controls')).toHaveCount(0);
  await page.getByRole('button', { name: /^Fold/ }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await page.keyboard.press('f');
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement))
    .toBeNull();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Fullscreen', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await expect(
    page.getByRole('button', { name: 'Fullscreen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('[inert]').count()).toBe(0);
});

test('expanded fallback supports Escape, keyboard isolation and route cleanup', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: false,
    });
  });
  await startPractice(page);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(
    page.getByText(
      'Browser fullscreen is unavailable. The table is expanded in this window.',
    ),
  ).toBeAttached();
  await expect(page.locator('.play-viewport')).toHaveClass(/play-expanded/);
  for (let n = 0; n < 12; n++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(
        () =>
          !!document.activeElement?.closest('.play-viewport') ||
          document.activeElement === document.body,
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.play-viewport')).not.toHaveClass(/play-expanded/);
  await expect(
    page.getByRole('button', { name: 'Fullscreen', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await page.evaluate(() => {
    location.hash = '#/learn';
  });
  await expect(page.locator('.play-viewport')).toHaveCount(0);
  expect(await page.locator('[inert]').count()).toBe(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    'hidden',
  );
});

test('denied fullscreen uses the fallback without interrupting play', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    });
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error('Fullscreen denied'));
  });
  await startPractice(page);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(
    page.getByText(
      'Browser fullscreen is unavailable. The table is expanded in this window.',
    ),
  ).toBeAttached();
  await page.getByRole('button', { name: /^Fold/ }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await page.keyboard.press('f');
  await expect(page.locator('.play-viewport')).not.toHaveClass(/play-expanded/);
});

test('coach stays beside practice at 1024px and is absent from tournament', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await startPractice(page);
  const table = await page.locator('.felt-table').boundingBox();
  const coach = await page
    .getByRole('complementary', { name: 'Table coach' })
    .boundingBox();
  expect(table).not.toBeNull();
  expect(coach).not.toBeNull();
  expect(coach!.x).toBeGreaterThanOrEqual(table!.x + table!.width);
  expect(Math.abs(coach!.y - table!.y)).toBeLessThan(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto('/#/play/tournament');
  await expect(
    page.getByRole('complementary', { name: 'Table coach' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Fullscreen', exact: true }),
  ).toHaveCount(0);
});
