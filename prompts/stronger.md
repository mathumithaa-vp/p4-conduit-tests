Changes: In @P4/tests/profile-follow/follow-author.spec.ts: changed because the test uses a shared practice user and should create its own user through the api to avoid affecting other tests.
New tests: add 2 api tests for comments one to verify that a newly created comment appears in the comments list and another to verify that the comments list returns the correct comment details including the comment body and author
Material: @P4/API.md @P4/tests/e2e.spec.ts Make users and data by API, and clean up, like these tests.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Change nothing else. Do not run the tests.
