# My CI workflow and review (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

Repository: the P4 folder · Workflow: `.github/workflows/playwright.yml` · Date: 2026-11-20

## 1. What my project needs
- **Node.js on my laptop (`node -v`):** v24.22.1
- **My whole suite on my laptop:** `npx playwright test` → 24 passed, 0 failed
- **What the GitHub computer needs (my words):** Node.js: v24.22.1 · Packages: npm ci · Browser: Chromium only (from the example)

## 2. My prompt to Claude
```text
Task: Write a GitHub Actions workflow that runs this Playwright suite on every push and keeps the HTML report. My GitHub repository is the P4 folder, so save it as P4/.github/workflows/playwright.yml. After the file, write one line for each step: what it does.
Material: @P4/package.json @P4/playwright.config.ts @P4/README.md
Rules: Use actions/checkout@v6, actions/setup-node@v6 and actions/upload-artifact@v6. Do not run anything. Do not commit or push. Use Node.js 24, install packages with npm ci, and install only Chromium.
```

## 3. What Claude's workflow got wrong for my project
- **Claude's workflow:** my own rule gave Claude the facts, so my workflow already used `node-version: 24`, `npm ci` and Chromium only. In another test, Claude wrote `node-version: 22` (line 16).
- **Claude said:** "ASSUMPTION: `node-version: 22` gets the newest Node 22, which is 22.13 or later. You could use 24 instead. Nothing in the material asks for a specific version."
- **My project needs:** Node.js: v24.22.1 · Packages: npm ci · Browser: Chromium only
- **My answer to the developer:** I would not merge it yet. Our green test run was proven with Node.js 24.22.1, so the workflow should use Node.js 24 to match our tested environment.
- **My line to Claude:** In @P4/.github/workflows/playwright.yml, add a comment above the node-version line explaining that Node.js 24.22.1 is the version used for our successful local run with 24 passing tests. Change nothing else. Do not run anything.

## 4. My reading of the workflow
- **When, where, the code and Node.js (lines 1–17):** on push starts the workflow whenever code is pushed to GitHub. jobs defines the work to run. test is the job name. runs-on ubuntu-latest means GitHub uses a fresh Ubuntu computer. steps lists the actions. checkout gets the project code and setup-node installs Node.js 24.
- **Packages, browser, tests and the report (lines 18–33):** npm ci installs packages, Chromium installs the browser, npx playwright test runs tests, and upload-artifact saves the HTML report even if tests fail unless cancelled.

## 5. The first run on GitHub
- **Run:** Add the CI workflow · **Result:** Green tick · **Tests:** 24 passed, 0 failed
- **The report (artifact):** yes (playwright-report under Artifacts)

## 6. A red run on purpose
- **The change:** `tests/example.spec.ts` line 6, `toBe(200)` → `toBe(201)`
- **My prediction:** Run the Playwright tests will fail because the expected status is 201 but the actual status is 200.
- **What GitHub showed:** Expected: 201, Received: 200. The test failed because the expected status was intentionally changed from 200 to 201.

## 7. Fixed, and green again
- **The fix:** line 6 back to `toBe(200)` · **Run:** Fix the expected status · **Result:** Green tick, 24 passed

## 8. Review notes for my other AI-written tests (written while CI ran)
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.
Monday's and Tuesday's tests that I did not review in depth on those days. Each one: kept, changed or removed, and why.

### Monday: `tests/api.spec.ts`
- "anyone reads an article by its slug": **kept**, because it checks the status and all article details.
- "the author deletes an article and it is gone": **kept**, because it checks deletion and confirms the article is gone.
- "creating an article without a token gives 401": **changed**, because it should also confirm that no article was created.
- "reading an article that does not exist gives 404": **kept**, because it checks the 404 status and error message.
- "another user cannot change the article": **kept**, because it confirms another user cannot change the article.
- "another user cannot delete the article": **changed**, because it should check the article details after deletion is refused, not just status 200.

### Tuesday: `tests/contract.spec.ts`
- "GET /api/user answers with the User shape": **kept**, because it checks the user response fields and data types.
- "GET /api/user without a token gives 401 "token is missing"": **kept**, because it checks 401 and the exact error body.
- "GET /api/user with a wrong token gives 401 "token is invalid"": **kept**, because it checks 401 and the exact error body for an invalid token.
- "changing an article without a token gives 401 and the article stays the same": **kept**, because it confirms an unauthorised request does not change the article.
- "changing someone else's article gives 403 and the article stays the same": **kept**, because it confirms another user cannot change the article.
- "deleting someone else's article gives 403 and the article still exists": **changed**, because it should check the article details after the rejected delete, not only status 200.
