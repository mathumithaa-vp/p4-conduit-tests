import { test, expect, APIRequestContext } from '@playwright/test';

// Contract tests for the Conduit API: schema checks and auth checks.
// Written from P4/API.md only.

// A unique part for names, so every run makes new users and articles.
function unique(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// Sign up a new user and return the token, username and email.
async function signUp(request: APIRequestContext) {
  const id = unique();
  const username = `contract-user-${id}`;
  const email = `contract-user-${id}@example.com`;
  const response = await request.post('/api/users', {
    data: { user: { username, email, password: 'Password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { token: json.user.token as string, username, email };
}

// Create an article as this user and return what was sent and the slug.
async function createArticle(request: APIRequestContext, token: string) {
  const article = {
    title: `Contract test article ${unique()}`,
    description: 'A short description',
    body: 'The article text',
    tagList: ['testing', 'api'],
  };
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: { article },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { sent: article, slug: json.article.slug as string };
}

// ---------- Schema checks ----------

test('GET /api/articles/:slug answers with the Article shape', async ({ request }) => {
  const author = await signUp(request);
  const { slug } = await createArticle(request, author.token);

  const response = await request.get(`/api/articles/${slug}`);

  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json).toMatchObject({
    article: {
      slug: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      body: expect.any(String),
      tagList: expect.any(Array),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      favorited: expect.any(Boolean),
      favoritesCount: expect.any(Number),
      author: {
        username: expect.any(String),
        // A new user has bio and image set to null (API.md, Users).
        bio: null,
        image: null,
        following: expect.any(Boolean),
      },
    },
  });

  // Exact key lists from API.md (Articles and Profiles). No missing and no extra keys.
  expect(Object.keys(json.article).sort()).toEqual(
    [
      'slug',
      'title',
      'description',
      'body',
      'tagList',
      'createdAt',
      'updatedAt',
      'favorited',
      'favoritesCount',
      'author',
    ].sort(),
  );
  expect(Object.keys(json.article.author).sort()).toEqual(
    ['username', 'bio', 'image', 'following'].sort(),
  );
});

test('GET /api/user answers with the User shape', async ({ request }) => {
  const user = await signUp(request);

  const response = await request.get('/api/user', {
    headers: { Authorization: `Token ${user.token}` },
  });

  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json).toMatchObject({
    user: {
      email: expect.any(String),
      token: expect.any(String),
      username: expect.any(String),
      // A new user has bio and image set to null (API.md, Users).
      bio: null,
      image: null,
    },
  });
});

// ---------- Auth checks ----------

test('GET /api/user without a token gives 401 "token is missing"', async ({ request }) => {
  const response = await request.get('/api/user');

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
});

test('GET /api/user with a wrong token gives 401 "token is invalid"', async ({ request }) => {
  const response = await request.get('/api/user', {
    headers: { Authorization: 'Token this-is-not-a-real-token' },
  });

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ errors: { token: ['is invalid'] } });
});

test('changing an article without a token gives 401 and the article stays the same', async ({ request }) => {
  const author = await signUp(request);
  const { sent, slug } = await createArticle(request, author.token);

  const response = await request.put(`/api/articles/${slug}`, {
    data: { article: { body: 'Changed with no token' } },
  });

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });

  const check = await request.get(`/api/articles/${slug}`);
  expect(check.status()).toBe(200);
  expect((await check.json()).article.body).toBe(sent.body);
});

test("changing someone else's article gives 403 and the article stays the same", async ({ request }) => {
  const author = await signUp(request);
  const other = await signUp(request);
  const { sent, slug } = await createArticle(request, author.token);

  const response = await request.put(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${other.token}` },
    data: { article: { title: 'Changed by someone else', body: 'Changed by someone else' } },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  const check = await request.get(`/api/articles/${slug}`);
  expect(check.status()).toBe(200);
  const json = await check.json();
  expect(json.article.title).toBe(sent.title);
  expect(json.article.body).toBe(sent.body);
});

test("deleting someone else's article gives 403 and the article still exists", async ({ request }) => {
  const author = await signUp(request);
  const other = await signUp(request);
  const { slug } = await createArticle(request, author.token);

  const response = await request.delete(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${other.token}` },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  const check = await request.get(`/api/articles/${slug}`);
  expect(check.status()).toBe(200);
});
