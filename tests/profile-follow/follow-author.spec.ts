// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect, APIRequestContext } from '@playwright/test';

// A unique part for names, so every run makes new users.
function unique(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// Sign up a new user with the API (POST /api/users) and return the details.
async function signUp(request: APIRequestContext, role: string) {
  const id = unique();
  const username = `follow-${role}-${id}`;
  const email = `follow-${role}-${id}@example.com`;
  const password = 'Password123';
  const response = await request.post('http://127.0.0.1:3000/api/users', {
    data: { user: { username, email, password } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { username, email, password, token: json.user.token as string };
}

// Note: the test users are NOT deleted. API.md has no request to delete a user.

test.describe('Profile follow', () => {
  test('Signed-in reader unfollows then follows an author, and the state is saved', async ({ page, request }) => {
    // Arrange: a new reader and a new author, made with the API.
    // The reader follows the author with the API, so the test starts on "Unfollow".
    const reader = await signUp(request, 'reader');
    const author = await signUp(request, 'author');
    const follow = await request.post(
      `http://127.0.0.1:3000/api/profiles/${encodeURIComponent(author.username)}/follow`,
      { headers: { Authorization: `Token ${reader.token}` } }
    );
    expect(follow.status()).toBe(200);
    expect((await follow.json()).profile.following).toBe(true);

    const unfollowButton = page.getByRole('button', { name: `Unfollow ${author.username}`, exact: true });
    const followButton = page.getByRole('button', { name: `Follow ${author.username}`, exact: true });

    const getFollowing = async (token: string) => {
      const response = await page.request.get(
        `http://127.0.0.1:3000/api/profiles/${encodeURIComponent(author.username)}`,
        { headers: { Authorization: `Token ${token}` } }
      );
      expect(response.status()).toBe(200);
      return (await response.json()).profile.following;
    };

    // 1. Sign in as the new reader. Open the new author's profile.
    await page.goto('http://127.0.0.1:3000/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(reader.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(reader.password);
    const loginResponsePromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/users/login') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Sign in' }).click();
    const loginResponse = await loginResponsePromise;
    const token: string = (await loginResponse.json()).user.token;
    expect(token).toBeTruthy();

    await page.goto(`http://127.0.0.1:3000/profile/${encodeURIComponent(author.username)}`);
    await expect(unfollowButton).toBeVisible();

    // 2. Click "Unfollow <author>".
    await unfollowButton.click();
    await expect(followButton).toBeVisible();
    await expect(unfollowButton).toHaveCount(0);
    expect(await getFollowing(token)).toBe(false);

    // 3. Reload the page.
    await page.reload();
    await expect(followButton).toBeVisible();
    await expect(unfollowButton).toHaveCount(0);

    // 4. Click the follow button.
    await followButton.click();
    await expect(unfollowButton).toBeVisible();
    expect(await getFollowing(token)).toBe(true);

    // 5. Reload the page.
    await page.reload();
    await expect(unfollowButton).toBeVisible();
    await expect(followButton).toHaveCount(0);
  });
});
