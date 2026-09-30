import { test, expect } from '@playwright/test';

test('lounge image opens the existing Display controls with keyboard support', async ({
  page,
}) => {
  await page.goto('/#/play');
  await expect(
    page.getByText('heads-up or six-max.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('the math is on screen.', { exact: false }),
  ).toHaveCount(0);
  const image = page.getByRole('button', {
    name: 'Change display',
    exact: true,
  });
  await image.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#display-settings')).toHaveAttribute('open', '');
  await expect(page.locator('#display-settings summary')).toBeFocused();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue');
  await page.getByLabel('Four-color deck').check();
  await expect(page.locator('html')).toHaveAttribute('data-four-color', 'true');
  await page.locator('#display-settings summary').click();
  await image.click();
  await expect(
    page.getByRole('button', { name: 'Blue', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('artwork parallax respects reduced motion and keeps the image button stationary', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/play');
  const button = page.getByRole('button', {
    name: 'Change display',
    exact: true,
  });
  await expect(button).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const artwork = page.locator('.home-artwork');
  await expect(artwork).toHaveCSS('mix-blend-mode', 'screen');
  await expect(artwork.locator('img')).toHaveCSS(
    'filter',
    /lounge-transparent-ink/,
  );
  expect((await artwork.boundingBox())!.height).toBeGreaterThan(100);
  await expect(artwork.locator('img')).toBeVisible();
  await expect(artwork.locator('img')).toHaveCSS('object-fit', 'contain');
  const artBox = (await artwork.boundingBox())!;
  const plateBox = (await button.boundingBox())!;
  expect(artBox.x).toBeGreaterThanOrEqual(plateBox.x + plateBox.width);
  const before = await button.boundingBox();
  await page.mouse.move(1400, 850);
  await expect
    .poll(() =>
      page
        .locator('.plate-depth')
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe('none');
  const after = await button.boundingBox();
  expect(after!.x).toBeCloseTo(before!.x, 0);
  expect(after!.y).toBeCloseTo(before!.y, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of [
    '.plate-depth',
    '.lounge-figure-depth',
    '.home-artwork',
  ])
    await expect
      .poll(() =>
        page
          .locator(selector)
          .evaluate((element) => getComputedStyle(element).transform),
      )
      .toBe('none');
  await button.click();
  await expect(
    page.getByRole('button', { name: 'Violet', exact: true }),
  ).toBeVisible();
});

test('deck preview visibly recolors clubs and diamonds, persists, and updates table cards', async ({
  page,
}) => {
  await page.goto('/#/play');
  await page
    .getByRole('button', { name: 'Change display', exact: true })
    .click();
  const preview = page.getByRole('group', { name: 'Deck preview' });
  const clubs = preview.locator('[data-suit="0"] img');
  const diamonds = preview.locator('[data-suit="1"] img');
  const imagePixels = async (image: typeof clubs) =>
    image.evaluate(async (element) => {
      const img = element as HTMLImageElement;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 58;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 40, 58);
      return Array.from(ctx.getImageData(0, 0, 40, 58).data).join(',');
    });
  const before = [await imagePixels(clubs), await imagePixels(diamonds)];
  await page.getByLabel('Four-color deck').check();
  await expect(preview).toContainText('Green clubs · blue diamonds');
  await expect(clubs).toHaveAttribute('src', /-four\.svg$/);
  await expect(diamonds).toHaveAttribute('src', /-four\.svg$/);
  expect(await imagePixels(clubs)).not.toBe(before[0]);
  expect(await imagePixels(diamonds)).not.toBe(before[1]);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#display-settings')).not.toHaveAttribute(
    'open',
    '',
  );
  await expect(page.locator('#display-settings summary')).toBeFocused();
  await page.reload();
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await expect(
    page.locator('.hero-seat .playing-card img').first(),
  ).toHaveAttribute('src', /-four\.svg$/);
  await page.getByText('Display', { exact: true }).click();
  await expect(page.getByLabel('Four-color deck')).toBeChecked();
  await page.getByLabel('Four-color deck').uncheck();
  await expect(
    page.locator('.hero-seat .playing-card img').first(),
  ).not.toHaveAttribute('src', /-four\.svg$/);
});

test('display menu closes outside and with Escape; Purple replaces Anime', async ({
  page,
}) => {
  await page.goto('/#/play');
  const trigger = page.getByRole('button', {
    name: 'Change display',
    exact: true,
  });
  const menu = page.locator('#display-settings');
  await trigger.click();
  await expect(
    page.getByRole('button', { name: 'Anime', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Purple', exact: true }).click();
  await expect(menu).toHaveAttribute('open', '');
  await page.locator('.page-masthead h1').click();
  await expect(menu).not.toHaveAttribute('open', '');
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');
  await expect(page.locator('#display-settings summary')).toBeFocused();
  await page.locator('.app-header nav a[href="#/stats"]').click();
  await expect(page.locator('.page-masthead h1')).toHaveText('progress');
  await expect(page.locator('.lounge-figure-depth .lg-figure')).toHaveCSS(
    'filter',
    /lounge-atmosphere-ink/,
  );
  await page.getByText('Display', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Purple', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(menu).not.toHaveAttribute('open', '');
});
