import { test, expect, type Page } from '@playwright/test';
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
async function browse(page: Page) {
  const button = page.getByRole('button', {
    name: 'Browse chapters & lessons',
  });
  if (await button.isVisible()) await button.click();
}
async function width(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('Chapter 1 to a coached game and back preserves the lesson and distinct progress', async ({
  page,
}, info) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Start Chapter 1 →', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn\/1-1\?seed=/);
  const lessonUrl = page.url();
  await expect(
    page.getByRole('heading', {
      name: 'Outcomes, events, and one deck',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Lesson seed · shared by the experiment and practice'),
  ).not.toBeVisible();
  await page
    .getByRole('button', { name: 'Mark lesson as read', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Play a practice hand →', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/play\?lesson=1-1&lessonSeed=/);
  await expect(page.locator('.course-practice-banner')).toContainText(
    'the next card is a heart',
  );
  await page.getByRole('button', { name: 'Take a seat & play' }).click();
  await openCoach(page);
  await expect(
    page.getByRole('complementary', { name: 'Table coach', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.coach-course-focus')).toContainText('LESSON 1.1');
  if (info.project.name === 'desktop') {
    const table = await page.locator('.felt-table').boundingBox(),
      coach = await page.locator('.coach-sidebar').boundingBox();
    expect(coach!.x).toBeGreaterThanOrEqual(table!.x + table!.width);
    await page
      .locator('.poker-workspace')
      .screenshot({ path: 'docs/screenshots/coach-beside-table.png' });
  } else {
    await page.screenshot({ path: 'docs/screenshots/coach-phone.png' });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open coach · help with this hand' }),
    ).toBeFocused();
    await openCoach(page);
  }
  await page.getByRole('button', { name: 'Pot odds', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Coach · your visible information' }),
  ).toBeVisible();
  await width(page);
  await expect(
    page.getByRole('region', { name: 'Pot odds calculation' }),
  ).toBeVisible();
  await closeCoach(page);
  await page.getByRole('button', { name: /^Fold / }).click();
  await expect(page.getByRole('region', { name: 'Hand result' })).toBeVisible();
  await page
    .getByRole('link', { name: 'Return to lesson 1.1 →', exact: true })
    .click();
  await expect(page).toHaveURL(lessonUrl);
  await expect(
    page.getByRole('button', { name: 'Marked as read' }),
  ).toBeDisabled();
  await expect(
    page.getByText('Hand played for this lesson. What did you notice?'),
  ).toBeVisible();
  const mastery = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('holdem-learn-v1') ?? '{}'),
  );
  expect(mastery.results['1-1']).toBeUndefined();
  await page
    .getByRole('navigation', { name: 'Next lesson', exact: true })
    .getByRole('link', { name: /Next lesson: 1.2/ })
    .click();
  await expect(page).toHaveURL(/#\/learn\/1-2/);
  await page.getByRole('link', { name: 'Play', exact: true }).click();
  await page
    .getByRole('link', { name: 'Continue learning →', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/learn\/1-2/);
  await width(page);
});

test('course contents, search, lesson sections, and saved reading position', async ({
  page,
}, info) => {
  await page.goto('/#/learn');
  await expect(
    page.getByRole('link', { name: 'Start Chapter 1 →', exact: true }),
  ).toBeVisible();
  await browse(page);
  await page.getByLabel('Find a lesson', { exact: true }).fill('outs');
  const toc = page.getByRole('complementary', { name: 'Course contents' });
  await toc.getByRole('link', { name: /8.1/ }).click();
  await expect(page).toHaveURL(/#\/learn\/8-1/);
  await page.getByRole('button', { name: 'The idea', exact: true }).click();
  await expect(page.locator('[data-part="idea"]')).toBeFocused();
  await page
    .getByRole('button', { name: 'Check your understanding', exact: true })
    .click();
  await expect(page.locator('[data-part="practice"]')).toBeFocused();
  await page.getByRole('button', { name: 'Mark lesson as read' }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Marked as read' }),
  ).toBeDisabled();
  await page.goto('/#/learn');
  await expect(page.getByRole('link', { name: /^Continue 8.1/ })).toBeVisible();
  await browse(page);
  await page.getByLabel('Find a lesson', { exact: true }).fill('no-such-topic');
  await expect(
    page.getByText('No lessons match. Try another word.'),
  ).toBeVisible();
  await page.getByLabel('Find a lesson', { exact: true }).fill('');
  await width(page);
  if (info.project.name === 'desktop')
    await page.screenshot({
      path: 'docs/screenshots/course-contents.png',
      fullPage: true,
    });
});
