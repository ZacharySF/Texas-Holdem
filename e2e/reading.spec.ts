import { test, expect } from '@playwright/test';

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('full course index finds concepts and opens their prerequisites', async ({
  page,
}) => {
  await page.goto('/#/learn');
  await page.getByRole('button', { name: 'Browse all 53 lessons' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'All chapters and lessons',
      exact: true,
    }),
  ).toBeFocused();
  const index = page.getByRole('region', { name: 'All chapters and lessons' });
  await expect(index.getByRole('link')).toHaveCount(53);
  await page.getByLabel('Search the full course').fill('new call cost');
  await expect(index.getByRole('link')).toHaveCount(1);
  await index.getByRole('link', { name: /12.2/ }).click();
  const prerequisites = page.getByRole('region', { name: 'Before you begin' });
  await expect(prerequisites.getByRole('link')).toHaveCount(2);
  await prerequisites.getByRole('link', { name: /12.1/ }).click();
  await expect(page).toHaveURL(/#\/learn\/12-1/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/learn\/12-2/);
  await expect(page.locator('.reading-check')).toContainText(
    'Why is folding assigned zero',
  );
  await expect(
    page.locator('.course-contents a[aria-current="page"]'),
  ).toHaveAttribute('href', '#/learn/12-2');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('reading explanations work with a keyboard and never award quiz mastery', async ({
  page,
}, info) => {
  await page.goto('/#/learn/2-1');
  if (info.project.name === 'phone') {
    const contents = await page.locator('.course-contents').boundingBox();
    const lesson = await page.locator('.learn-header').boundingBox();
    expect(contents!.y).toBeLessThan(lesson!.y);
    await expect(
      page.getByRole('button', { name: 'Browse chapters & lessons' }),
    ).toBeInViewport();
  }
  const explanation = page.locator('.reading-check details');
  const answer = explanation.locator('p');
  await expect(answer).not.toBeVisible();
  await explanation.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(answer).toBeVisible();
  await expect(answer).toContainText('no king was removed');
  await page
    .getByRole('button', { name: 'Lesson summary', exact: true })
    .click();
  await expect(page.locator('#lesson-summary')).toBeFocused();
  await page.getByRole('button', { name: 'Review the explanation' }).click();
  await expect(page.locator('[data-part="idea"]')).toBeFocused();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('holdem-learn-v1') ?? '{}'),
  );
  expect(progress.results?.['2-1']).toBeUndefined();
  await page
    .getByRole('navigation', { name: 'Lesson navigation', exact: true })
    .getByRole('link', { name: /^Next:/ })
    .click();
  await expect(page).toHaveURL(/#\/learn\/2-2/);
  await expect(page.locator('.reading-check details')).not.toHaveAttribute(
    'open',
  );
  await expect(
    page.getByRole('heading', {
      name: 'End of Chapter 2: a reading checkpoint',
    }),
  ).toBeVisible();
  await expect(page.locator('.chapter-review li')).toHaveCount(2);
  await page
    .getByRole('navigation', { name: 'Next lesson', exact: true })
    .getByRole('link', { name: /^Next lesson: 3.1/ })
    .click();
  await expect(page).toHaveURL(/#\/learn\/3-1/);
  await expect(page.locator('.reading-check')).toContainText(
    'remove duplicate dealing orders',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('course search can recover and the capstone has a complete closing review', async ({
  page,
}) => {
  await page.goto('/#/learn');
  const index = page.getByRole('region', { name: 'All chapters and lessons' });
  await page.getByLabel('Search the full course').fill('unfindable-topic');
  await expect(index.getByRole('link')).toHaveCount(0);
  await expect(index).toContainText('No matching lessons');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(index.getByRole('link')).toHaveCount(53);
  await index.getByRole('link', { name: /25.2/ }).click();
  await expect(
    page.getByRole('heading', {
      name: 'End of Chapter 25: a reading checkpoint',
    }),
  ).toBeVisible();
  await expect(page.locator('.chapter-review li')).toHaveCount(2);
  await expect(
    page
      .getByRole('navigation', { name: 'Lesson navigation', exact: true })
      .getByRole('link', { name: /^Next:/ }),
  ).toHaveCount(0);
  await expect(page.locator('.lesson-summary')).toContainText(
    'You’ve reached the end of the course',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
