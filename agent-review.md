# Tests from Playwright's agents, and my review (week 4, project P4)

App: Conduit practice app on my laptop · Date: 2026-11-20

## 1. How I set up the agents
- **Command:** `npx playwright init-agents --loop=claude` (TESTS terminal, in `P4`)
- **What it made:** `.claude/agents/playwright-test-planner.md`, `.claude/agents/playwright-test-generator.md`, `.claude/agents/playwright-test-healer.md`, `.mcp.json`, `specs/README.md`, `tests/seed.spec.ts`
- **Browser hidden:** `"--headless"` added to `P4/.mcp.json`: yes
- **Where I started Claude for the agents:** in `P4`, because Claude finds the agents and their browser only there

## 2. What I asked the agents
- **Area:** the profile page and following an author
- **My prompt** (`P4/prompts/agents.md`):
  - Task: First use the playwright-test-planner agent to plan tests for the profile page and following an author. Save the plan as specs/profile-follow.md. Then use the playwright-test-generator agent to write one test for each scenario in the plan, in the folder tests/profile-follow/.
  - Material: Start on the page /profile/practice-author. For steps that need a signed-in user, use a practice user from README.md.
  - Rules: Plan at most 2 short scenarios, with at most 5 steps each. Do not change any other test file. Do not run the test suite. verify the actual result against the expected result and check that the changes are saved correctly
- **The plan the planner saved:** `specs/profile-follow.md` (2 scenarios)
- **The test files the generator wrote:** `tests/profile-follow/signed-out-profile.spec.ts`, `tests/profile-follow/follow-author.spec.ts`
- `tests/seed.spec.ts` is the agents' start file. It checks nothing about the app, so it is not reviewed here.

## 3. My review of every generated test
- **The teammate's question:** "Claude says practice-reader follows practice-author again at the end, as at the start. So we can keep this test in our suite as it is, right?"
- **My answer:** check that the test restores the original state even if it fails halfway through otherwise it may affect other tests
- "Signed-in reader unfollows then follows an author, and the state is saved" · **changed**, because the test uses a shared practice user and should create its own user through the api to avoid affecting other tests
- "Signed-out visitor sees the profile but no follow button" · **kept**, because it checks the signed out profile details and confirms that no follow button is shown even after reloading without changing any shared data

## 4. What I asked Claude to change, and the result
- **My change** (the Changes line of `P4/prompts/stronger.md`): In @P4/tests/profile-follow/follow-author.spec.ts: changed because the test uses a shared practice user and should create its own user through the api to avoid affecting other tests.
- **Result:** No fault: 24 passed, 0 failed (the "No fault" line of my second fault run)
