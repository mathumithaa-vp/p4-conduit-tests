# API review: Claude's first API tests (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you decided and what you saw.

- **App:** Conduit, the practice app on your own laptop (`http://127.0.0.1:3000`)
- **API description:** `P4/API.md`
- **Test file:** `P4/tests/api.spec.ts`, written by Claude
- **Prompt file:** `P4/prompts/api.md`

## 1. My first look, by hand
The request my comment sent in the app, and the status that came back.
- POST method and 201 Created status

## 2. My predictions and the real answers
One line per request: what I predicted, and what the app really answered.
- **A** (a comment, with the token): I predicted 201 Created with a comment containing the body Clear and useful. The app answered 201, comment body "Clear and useful.", author practice-reader.
- **B** (the same comment, with no token): I predicted 401 Unauthorized with errors token is missing. The app answered 401, {"errors":{"token":["is missing"]}}.
- **C** (a comment on an article that does not exist): I predicted 404 Not Found with errors article not found. The app answered 404, {"errors":{"article":["not found"]}}.

What surprised me: the 401 response surprised me because the app requires a valid token before allowing a user to post a comment

## 3. My prompt to Claude
```text
Task: Write at least 6 Playwright API tests for articles in the Conduit API: create, read, change and delete an article. At least 3 positive and at least 3 negative tests. Save them in P4/tests/api.spec.ts. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. check the response body for the expected data or error details not just the status code
```

## 4. The run
- **Result:** 9 tests: 8 passed, 1 failed.
- **A red test, and who is wrong** (only if a test failed):
  - Test: "the author changes the body and the other fields stay the same" (lines 82–103, check on line 97)
  - Expected: ["testing", "api"]
  - Received: []
  - API.md says: "Updating: every field is optional. A field you do not send stays as it was."
  - My answer: the app is wrong not the test because the api documentation says that fields not included in an update request must keep their existing values the test updates only the body but the app removes the tags instead of preserving them the test is correct and should be kept
- **My note** (only if I kept a red test with `test.fail()`): the app clears existing tags when only the body is updated

## 5. The developer's question
The test I looked at, and my answer to: "So the app saved nothing, right?"
- **Test:** "creating an article with a blank title gives 422"
- **My answer:** no it only shows that the app rejected the request we still need to check that no article was created

## 6. Tests I reviewed with the API checklist
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.

### "a signed-in user creates an article"
- **My decision:** Change, because it checks the response but does not read the article again to confirm it was saved

## 7. My API rules
The rules I added to my `playwright-quality` skill, under `## API rules`:
1. after a create or update read the data again with GET
2. check exact response values not just whether fields exist
3. after a rejected request use GET to confirm nothing changed
