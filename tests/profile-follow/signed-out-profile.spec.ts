// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function expectProfileWithoutFollow(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'practice-author' })).toBeVisible();
  await expect(page.getByText('I write about testing and quality.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'My Articles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Favorited Articles' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Follow practice-author' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Unfollow practice-author' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Your first end-to-end test' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'How to write a good bug report' })).toBeVisible();
}

test.describe('Profile follow', () => {
  test('Signed-out visitor sees the profile but no follow button', async ({ page }) => {
    // 1. Without signing in, open /profile/practice-author.
    await page.goto('/profile/practice-author');
    await expect(page.getByRole('heading', { level: 1, name: 'practice-author' })).toBeVisible();
    await expect(page.getByText('I write about testing and quality.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Articles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Favorited Articles' })).toBeVisible();

    // 2. Look for a button named "Follow practice-author" or "Unfollow practice-author".
    await expect(page.getByRole('button', { name: 'Follow practice-author' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Unfollow practice-author' })).toHaveCount(0);

    // 3. Check the article list.
    await expect(page.getByRole('link', { name: 'Your first end-to-end test' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How to write a good bug report' })).toBeVisible();

    // 4. Reload the page.
    await page.reload();
    await expectProfileWithoutFollow(page);
  });
});
