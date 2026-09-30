import { expect, test } from '@playwright/test';

for (const exitKey of ['f', 'Escape'])
  test(`${exitKey} while browser fullscreen is pending still exits the table`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: true,
      });
      Element.prototype.requestFullscreen = () =>
        new Promise<void>((resolve) => {
          document.addEventListener(
            'finish-fullscreen-request',
            () => resolve(),
            {
              once: true,
            },
          );
        });
    });
    await page.goto('/#/play');
    await page.getByRole('button', { name: 'Take a seat & play' }).click();
    await expect(page.getByRole('button', { name: /^Fold/ })).toBeEnabled();
    await page.keyboard.press('f');
    await expect(page.locator('.play-viewport')).toHaveClass(/play-expanded/);
    await page.keyboard.press(exitKey);
    await page.evaluate(() =>
      document.dispatchEvent(new Event('finish-fullscreen-request')),
    );
    await expect(page.locator('.play-viewport')).not.toHaveClass(
      /play-expanded/,
    );
    await expect(
      page.getByRole('button', { name: 'Fullscreen', exact: true }),
    ).toBeFocused();
    await expect(page.getByRole('button', { name: /^Fold/ })).toBeEnabled();
    expect(await page.locator('[inert]').count()).toBe(0);
  });
