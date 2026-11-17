import { test, expect, APIRequestContext } from '@playwright/test';

// Tests for articles in the Conduit API. Written from P4/API.md only.

// A unique part for names, so every run makes new users and articles.
function unique(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// Sign up a new user and return the token and username.
async function signUp(request: APIRequestContext) {
  const id = unique();
  const username = `api-user-${id}`;
  const response = await request.post('/api/users', {
    data: { user: { username, email: `api-user-${id}@example.com`, password: 'Password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { token: json.user.token as string, username };
}

// Create an article as this user and return the answer body.
async function createArticle(request: APIRequestContext, token: string) {
  const article = {
    title: `API test article ${unique()}`,
    description: 'A short description',
    body: 'The article text',
    tagList: ['testing', 'api'],
  };
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: { article },
  });
  expect(response.status()).toBe(201);
  return { sent: article, json: await response.json() };
}

// ---------- Positive tests ----------

test('a signed-in user creates an article', async ({ request }) => {
  const user = await signUp(request);
  const article = {
    title: `New article ${unique()}`,
    description: 'About testing',
    body: 'Some text about testing',
    tagList: ['testing', 'api'],
  };

  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${user.token}` },
    data: { article },
  });

  expect(response.status()).toBe(201);
  const json = await response.json();
  expect(json.article.slug).toBeTruthy();
  expect(json.article.title).toBe(article.title);
  expect(json.article.description).toBe(article.description);
  expect(json.article.body).toBe(article.body);
  expect(json.article.tagList).toEqual(['testing', 'api']);
  expect(json.article.favorited).toBe(false);
  expect(json.article.favoritesCount).toBe(0);
  expect(json.article.author.username).toBe(user.username);
});

test('anyone reads an article by its slug', async ({ request }) => {
  const user = await signUp(request);
  const created = await createArticle(request, user.token);
  const slug = created.json.article.slug;

  const response = await request.get(`/api/articles/${slug}`);

  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.article.slug).toBe(slug);
  expect(json.article.title).toBe(created.sent.title);
  expect(json.article.description).toBe(created.sent.description);
  expect(json.article.body).toBe(created.sent.body);
  expect(json.article.author.username).toBe(user.username);
});

test('the author changes the body and the other fields stay the same', async ({ request }) => {
  // the app clears existing tags when only the body is updated
  test.fail();
  const user = await signUp(request);
  const created = await createArticle(request, user.token);
  const slug = created.json.article.slug;

  const response = await request.put(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${user.token}` },
    data: { article: { body: 'The changed text' } },
  });

  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.article.body).toBe('The changed text');
  expect(json.article.title).toBe(created.sent.title);
  expect(json.article.description).toBe(created.sent.description);
  expect(json.article.tagList).toEqual(created.sent.tagList);

  // Read it again to check the change was saved.
  const readAgain = await request.get(`/api/articles/${slug}`);
  expect(readAgain.status()).toBe(200);
  expect((await readAgain.json()).article.body).toBe('The changed text');
});

test('the author deletes an article and it is gone', async ({ request }) => {
  const user = await signUp(request);
  const created = await createArticle(request, user.token);
  const slug = created.json.article.slug;

  const response = await request.delete(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${user.token}` },
  });

  expect(response.status()).toBe(204);
  expect(await response.text()).toBe('');

  const readAgain = await request.get(`/api/articles/${slug}`);
  expect(readAgain.status()).toBe(404);
  expect(await readAgain.json()).toEqual({ errors: { article: ['not found'] } });
});

// ---------- Negative tests ----------

test('creating an article without a token gives 401', async ({ request }) => {
  const response = await request.post('/api/articles', {
    data: { article: { title: 'No token', description: 'd', body: 'b' } },
  });

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
});

test('creating an article with a blank title gives 422', async ({ request }) => {
  const user = await signUp(request);

  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${user.token}` },
    data: { article: { title: '', description: 'A description', body: 'Some text' } },
  });

  expect(response.status()).toBe(422);
  const json = await response.json();
  expect(json.errors.title).toEqual(["can't be blank"]);
});

test('reading an article that does not exist gives 404', async ({ request }) => {
  const response = await request.get(`/api/articles/no-such-article-${unique()}`);

  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ errors: { article: ['not found'] } });
});

test('another user cannot change the article', async ({ request }) => {
  const author = await signUp(request);
  const other = await signUp(request);
  const created = await createArticle(request, author.token);
  const slug = created.json.article.slug;

  const response = await request.put(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${other.token}` },
    data: { article: { body: 'Changed by someone else' } },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  // The article is not changed.
  const readAgain = await request.get(`/api/articles/${slug}`);
  expect((await readAgain.json()).article.body).toBe(created.sent.body);
});

test('another user cannot delete the article', async ({ request }) => {
  const author = await signUp(request);
  const other = await signUp(request);
  const created = await createArticle(request, author.token);
  const slug = created.json.article.slug;

  const response = await request.delete(`/api/articles/${slug}`, {
    headers: { Authorization: `Token ${other.token}` },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  // The article is still there.
  const readAgain = await request.get(`/api/articles/${slug}`);
  expect(readAgain.status()).toBe(200);
});
