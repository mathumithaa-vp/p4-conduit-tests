import { test, expect, APIRequestContext } from '@playwright/test';

// API tests for comments. Written from P4/API.md only.
// Each test makes its own users and article with the API, and cleans up.

// A unique part for names, so every run makes new users, articles and comments.
function unique(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

type TestUser = { token: string; username: string };

// What the current test made. afterEach uses it to clean up.
let users: TestUser[] = [];
let articles: { slug: string; authorToken: string }[] = [];

test.beforeEach(() => {
  users = [];
  articles = [];
});

// Sign up a new user with the API and return the token and username.
async function signUp(request: APIRequestContext, role: string): Promise<TestUser> {
  const id = unique();
  const username = `comments-${role}-${id}`;
  const response = await request.post('/api/users', {
    data: { user: { username, email: `comments-${role}-${id}@example.com`, password: 'Password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  const user = { token: json.user.token as string, username };
  users.push(user);
  return user;
}

// Create an article with the API and return its slug.
async function createArticle(request: APIRequestContext, author: TestUser) {
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${author.token}` },
    data: {
      article: {
        title: `Comments API article ${unique()}`,
        description: 'An article to comment on',
        body: 'The article text',
        tagList: [],
      },
    },
  });
  expect(response.status()).toBe(201);
  const slug = (await response.json()).article.slug as string;
  articles.push({ slug, authorToken: author.token });
  return slug;
}

// Post a comment with the API and return the comment from the answer.
async function postComment(request: APIRequestContext, slug: string, commenter: TestUser, body: string) {
  const response = await request.post(`/api/articles/${encodeURIComponent(slug)}/comments`, {
    headers: { Authorization: `Token ${commenter.token}` },
    data: { comment: { body } },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).comment;
}

// Cleanup after every test, also when a check failed.
// It deletes every comment on the test's articles (each by its own author), then the articles.
// The test users are NOT deleted: API.md has no request to delete a user.
test.afterEach(async ({ request }) => {
  for (const article of articles) {
    const slug = encodeURIComponent(article.slug);

    const list = await request.get(`/api/articles/${slug}/comments`);
    expect.soft(list.status()).toBe(200);
    if (list.status() === 200) {
      const json = await list.json();
      for (const comment of json.comments as { id: number; author: { username: string } }[]) {
        const owner = users.find((u) => u.username === comment.author.username);
        if (!owner) continue;
        const deleted = await request.delete(`/api/articles/${slug}/comments/${comment.id}`, {
          headers: { Authorization: `Token ${owner.token}` },
        });
        expect.soft(deleted.status()).toBe(204);
      }
    }

    const deleted = await request.delete(`/api/articles/${slug}`, {
      headers: { Authorization: `Token ${article.authorToken}` },
    });
    expect.soft(deleted.status()).toBe(204);
  }
});

test('a newly created comment appears in the comments list', async ({ request }) => {
  // Arrange: a new author with a new article. The list starts empty.
  const author = await signUp(request, 'author');
  const slug = await createArticle(request, author);
  const before = await request.get(`/api/articles/${encodeURIComponent(slug)}/comments`);
  expect(before.status()).toBe(200);
  expect((await before.json()).comments).toHaveLength(0);

  // Act: a new commenter posts a comment.
  const commenter = await signUp(request, 'commenter');
  const commentText = `New comment ${unique()}`;
  const created = await postComment(request, slug, commenter, commentText);

  // Assert: the list now has exactly this one comment.
  const after = await request.get(`/api/articles/${encodeURIComponent(slug)}/comments`);
  expect(after.status()).toBe(200);
  const json = await after.json();
  expect(json.comments).toHaveLength(1);
  expect(json.comments[0].id).toBe(created.id);
  expect(json.comments[0].body).toBe(commentText);
});

test('the comments list returns the correct comment details', async ({ request }) => {
  // Arrange: a new author with a new article, and a different new user as commenter.
  const author = await signUp(request, 'author');
  const slug = await createArticle(request, author);
  const commenter = await signUp(request, 'commenter');
  const commentText = `Detailed comment ${unique()}`;
  const created = await postComment(request, slug, commenter, commentText);

  // Act: the article author reads the comments list. The author does not follow the commenter.
  const response = await request.get(`/api/articles/${encodeURIComponent(slug)}/comments`, {
    headers: { Authorization: `Token ${author.token}` },
  });

  // Assert: the comment has the fields from API.md, with the right values.
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.comments).toHaveLength(1);
  const comment = json.comments[0];

  expect(comment.id).toBe(created.id);
  expect(comment.body).toBe(commentText);
  expect(typeof comment.createdAt).toBe('string');
  expect(Number.isNaN(Date.parse(comment.createdAt))).toBe(false);
  expect(typeof comment.updatedAt).toBe('string');
  expect(Number.isNaN(Date.parse(comment.updatedAt))).toBe(false);

  // The author is a Profile: username, bio, image, following.
  // A new user has bio and image set to null.
  expect(comment.author).toEqual({
    username: commenter.username,
    bio: null,
    image: null,
    following: false,
  });
});
