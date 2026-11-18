# My end-to-end tests and review (week 4, project P4)

App: Conduit practice app · Test file: `P4/tests/e2e.spec.ts` · Date: 2026-11-19

## 1. My first look
- **After I published an article by hand, I would check:** i will check that the published article appears in the global feed with the correct title and content
- **Where the page keeps my sign-in:** jwtToken

## 2. Practice
- **Worked example (the like test):** it signs in through the form as a practice user, so other tests can change its data.
- **Does its check at the end prove the journey?** no because the article title is visible even before clicking the favorite button so it does not prove that the article was liked

## 3. My prompt
```text
Task: Write 2 end-to-end tests in P4/tests/e2e.spec.ts. Test 1: a signed-in user publishes a new article in the editor. Test 2: a signed-in user posts a comment on an article. Make a new user with the API, give the page its token, do the journey in the page, and check the result with the API at the end. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/app/public/app.js app.js is the page's code: take the labels and button names from it. The page keeps the sign-in token in localStorage, key jwtToken.
Rules: Use app.js only for the labels and button names. Do not change the app. Do not run the tests. after each test use the api to verify that the article title and body are saved correctly and the comment is saved with the correct text
```

## 4. The run
- **Claude's 2 tests:** 2 passed, 0 failed.

## 5. The teammate's question
- **Claude said:** "A new user is made with the API, and the page gets the user's token." Claude also wrote: "Clean-up: the tests do not delete what they make, because the prompt did not ask for it."
- **My answer:** no the app is not clean because both tests create new users and data but they do not delete them after the tests so the users articles and comments remain in the app

## 6. What I saw on the home page
- i can see E2E comment article 1795025323634-89536 and E2E article 1795025323027-5407 at the top of the global feed

## 7. My change
- **My line to Claude:** In @P4/tests/e2e.spec.ts, add test.afterEach cleanup to delete the articles and comments created by each test, and delete the test users if the API supports it. Use the API cleanup methods from API.md so cleanup runs even when a check fails. Do not run the tests.
- **The clean-up Claude added:** test.afterEach finds the test user's articles with the API, deletes the user's comments on them, then deletes the articles. The users are not deleted: API.md has no request to delete a user.

## 8. Proof
- **Each test twice, on an app that keeps its data:** `npx playwright test tests/e2e.spec.ts --repeat-each=2` → 4 passed, 0 failed
- **The newest article on the home page after the run:** Your first end-to-end test
