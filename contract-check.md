# My schema, auth and contract checks (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

App: Conduit practice app on my laptop · Date: 2026-11-17

## 1. My first look
How I would check that an article answer has the right shape: check that all the required fields are present and have the correct data types such as text for title and slug boolean for favorited and a list for tagList

## 2. Practice: the key list check
File: `P4/materials/contract-example.spec.ts` (the sign-up answer).
Three changes: `bio` is missing · a new field `password` is added · `token` becomes a number.
- **The toMatchObject check (worked example):** missing: passes · new field: passes · number: fails
- **The key list check (my answer):** bio missing: fails · new password field: fails · token is a number: passes

## 3. My prompt for Claude
```text
Task: Write Playwright API tests in P4/tests/contract.spec.ts. Schema checks: the answers of GET /api/articles/:slug and GET /api/user have the shape that API.md gives, checked with toMatchObject and expect.any. Auth tests: no token, a wrong token, and changing someone else's article. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. check that all required fields are present with the correct data types and that the authentication tests verify the correct error responses and prevent unauthorized changes
```

## 4. Claude's tests and my run
- **Run:** `npx playwright test tests/contract.spec.ts` · **Result:** 7 passed, 0 failed
- **A red test, and who was wrong:** No test failed.

## 5. The teammate's question
- **Claude's test:** "GET /api/articles/:slug answers with the Article shape"
- **Claude said:** "Status is 200. All 10 Article fields are there and have the right types. The `author` has `username` and `following`, and `bio` and `image` are `null`."
- **My answer:** no the test will still pass because toMatchObject checks only the fields listed in the test and does not detect extra fields like password

## 6. My change
- **What I asked Claude:** "In @P4/tests/contract.spec.ts, update the test 'GET /api/articles/:slug answers with the Article shape'. Add an exact key list check for the article fields and author fields using the field names from API.md. Keep the existing toMatchObject check. Change nothing else. Do not run the tests."
- **The run after it:** 6 passed, 1 failed (a Playwright trace-file error, not a check line). Run again: 7 passed, 0 failed

## 7. Proof: the contract test fails when the answer changes
- **My prediction before the run:** the first article shape test will fail because f2 removes a field from the article response and the exact key list check detects that the required field is missing
- **Run with the practice fault F2 on:** `$env:CONDUIT_FAULT = "F2"`, then `npx playwright test tests/contract.spec.ts` · **Result:** 4 passed, 3 failed ("GET /api/articles/:slug answers with the Article shape", "changing an article without a token gives 401 and the article stays the same", "changing someone else's article gives 403 and the article stays the same")
- **What Playwright showed:** article test: `-     "body": Any<String>,` · auth tests: Expected: "The article text" Received: undefined
- **My answer about a red test:** it failed because f2 removes the body field from the article response so the follow up get request returns undefined instead of the expected article text even though the authorization check itself passed
- **Run with the fault off again:** `$env:CONDUIT_FAULT = ""`, then the same run · **Result:** 7 passed, 0 failed
