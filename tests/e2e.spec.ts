import { test, expect, APIRequestContext, Page } from '@playwright/test';

// End-to-end tests for the Conduit practice app: the API and the page together.
// Written from P4/API.md. Labels and button names are taken from P4/app/public/app.js.

// A unique part for names, so every run makes new users, articles and comments.
function unique(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// The user made by the current test. afterEach uses it to clean up.
let testUser: { token: string; username: string } | null = null;

test.beforeEach(() => {
  testUser = null;
});

// Sign up a new user with the API and return the token and username.
async function signUp(request: APIRequestContext) {
  const id = unique();
  const username = `e2e-user-${id}`;
  const response = await request.post('/api/users', {
    data: { user: { username, email: `e2e-user-${id}@example.com`, password: 'Password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  testUser = { token: json.user.token as string, username };
  return testUser;
}

// Cleanup after every test, also when a check failed.
// It finds the test user's articles with the API, deletes the user's comments on them, then deletes the articles.
// It looks the articles up by author, so it also finds an article the page made before a check failed.
// The test user is NOT deleted: API.md has no request to delete a user.
test.afterEach(async ({ request }) => {
  const user = testUser;
  if (!user) return;
  const headers = { Authorization: `Token ${user.token}` };

  const list = await request.get(`/api/articles?author=${encodeURIComponent(user.username)}&limit=100`);
  expect.soft(list.status()).toBe(200);
  if (list.status() !== 200) return;
  const { articles } = await list.json();

  for (const article of articles as { slug: string }[]) {
    const slug = encodeURIComponent(article.slug);

    const comments = await request.get(`/api/articles/${slug}/comments`);
    expect.soft(comments.status()).toBe(200);
    if (comments.status() === 200) {
      const json = await comments.json();
      for (const comment of json.comments as { id: number; author: { username: string } }[]) {
        if (comment.author.username !== user.username) continue;
        const deleted = await request.delete(`/api/articles/${slug}/comments/${comment.id}`, { headers });
        expect.soft(deleted.status()).toBe(204);
      }
    }

    const deleted = await request.delete(`/api/articles/${slug}`, { headers });
    expect.soft(deleted.status()).toBe(204);
  }
});

// Give the page the token: put it in localStorage (key jwtToken) before the page's own code runs.
async function giveTokenToPage(page: Page, token: string) {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jwtToken', t);
  }, token);
}

// Create an article with the API and return its slug.
async function createArticle(request: APIRequestContext, token: string) {
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: {
      article: {
        title: `E2E comment article ${unique()}`,
        description: 'An article to comment on',
        body: 'The article text',
        tagList: [],
      },
    },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return json.article.slug as string;
}

test('a signed-in user publishes a new article in the editor', async ({ page, request }) => {
  // Arrange: a new user, and the page has the user's token.
  const user = await signUp(request);
  await giveTokenToPage(page, user.token);
  const article = {
    title: `E2E article ${unique()}`,
    description: 'About end-to-end testing',
    body: 'This article was written in the editor by an end-to-end test.',
    tags: ['testing', 'e2e'],
  };

  // Act: write and publish the article in the page.
  await page.goto('/editor');
  await expect(page.getByRole('heading', { level: 1, name: 'New Article' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(article.title);
  await page.getByRole('textbox', { name: "What's this article about?" }).fill(article.description);
  await page.getByRole('textbox', { name: 'Write your article' }).fill(article.body);
  await page.getByRole('textbox', { name: 'Tags', exact: true }).fill(article.tags.join(', '));
  await page.getByRole('button', { name: 'Publish Article' }).click();

  // Assert in the page: the article page opens and shows the title and the body.
  await expect(page).toHaveURL(/\/article\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: article.title })).toBeVisible();
  await expect(page.getByText(article.body, { exact: true })).toBeVisible();

  // Assert with the API: the article is saved with the exact title and body.
  const slug = decodeURIComponent(new URL(page.url()).pathname.split('/')[2]);
  const response = await request.get(`/api/articles/${encodeURIComponent(slug)}`);
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.article.slug).toBe(slug);
  expect(json.article.title).toBe(article.title);
  expect(json.article.description).toBe(article.description);
  expect(json.article.body).toBe(article.body);
  expect(json.article.tagList).toEqual(article.tags);
  expect(json.article.author.username).toBe(user.username);
});

test('a signed-in user posts a comment on an article', async ({ page, request }) => {
  // Arrange: a new user, an article made with the API, and the page has the user's token.
  const user = await signUp(request);
  const slug = await createArticle(request, user.token);
  await giveTokenToPage(page, user.token);
  const commentText = `E2E comment ${unique()}`;

  // Act: write and post the comment in the page.
  await page.goto(`/article/${encodeURIComponent(slug)}`);
  await page.getByRole('textbox', { name: 'Write a comment' }).fill(commentText);
  await page.getByRole('button', { name: 'Post Comment' }).click();

  // Assert in the page: the comment shows in the list.
  await expect(page.getByRole('listitem').filter({ hasText: commentText })).toBeVisible();

  // Assert with the API: the comment is saved with the exact text, by this user.
  const response = await request.get(`/api/articles/${encodeURIComponent(slug)}/comments`);
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.comments).toHaveLength(1);
  expect(json.comments[0].body).toBe(commentText);
  expect(json.comments[0].author.username).toBe(user.username);
});
