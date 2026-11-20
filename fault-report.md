# My practice fault report (week 4, project P4)

App: Conduit practice app on my laptop · Practice faults: `P4/faults/practice.json` (F1 to F6) · Date: 2026-11-20
**How to read it:** a "detect" fault is **caught** when at least one test that passed with no fault fails with it, and **missed** when every test still passes. A "robust" fault (the app is only slower) should **stay green**; if tests fail, it **went red**.

## 1. My guess this morning
- **The developer asked:** "Your suite is green. How many real problems would it catch?"
- **My answer:** all 19 tests are passing but that does not guarantee they can catch real problems we can find out by introducing intentional bugs into the code and checking how many of them our tests detect this is called mutation testing

## 2. Before: my suite against the practice faults
- **Command:** `node materials/faults-run.mjs` (TESTS terminal, in `P4`, with no app running)
- **My test files:** `api.spec.ts`, `contract.spec.ts`, `e2e.spec.ts`, `example.spec.ts`, `profile-follow/follow-author.spec.ts`, `profile-follow/signed-out-profile.spec.ts`, `seed.spec.ts`
- **No fault:** 22 passed, 0 failed
- **F1:** caught (11 tests failed) · Opening an article gives a server error (500)
- **F2:** caught (6 tests failed) · The article answer has no body text
- **F3:** caught (3 tests failed) · The article answer has a different title
- **F4:** caught (1 test failed: e2e comment test) · The comments list is always empty
- **F5:** stayed green · The article answer comes 3 seconds late
- **F6:** caught (1 test failed: e2e comment test) · Posting a comment is refused (422) and nothing is saved

## 3. The weak spot I chose, and why
test suite should catch this because the comments section should display the actual comments, not an empty list.

## 4. How I made the suite stronger
- **My request for Claude** (the New tests line of `P4/prompts/stronger.md`): add 2 api tests for comments one to verify that a newly created comment appears in the comments list and another to verify that the comments list returns the correct comment details including the comment body and author
- **New or changed test file:** `tests/comments-api.spec.ts` (new); `tests/profile-follow/follow-author.spec.ts` (changed)

## 5. After: the run again
- **Command:** `node materials/faults-run.mjs`
- **No fault:** 24 passed, 0 failed
- **The fault I chose:** F4: caught (3 tests failed); F6: caught (3 tests failed)

## 6. What changed
the new comment api tests improved our coverage from 1 test to 3 tests detecting f4 and f6 now our suite is stronger at catching comment related bugs
