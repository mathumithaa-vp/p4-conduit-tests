# Profile page and following an author

## Application Overview

Conduit app at http://127.0.0.1:3000. Page: /profile/practice-author. Signed out, the page shows heading "practice-author", bio "I write about testing and quality.", tabs "My Articles" and "Favorited Articles", 7 articles, and NO follow button. Signed in as practice-reader (practice-reader@example.com / Practice123), the page shows the button "Unfollow practice-author" at the start, so seed data already has practice-reader following practice-author (observed; not in README.md or API.md). Sign-in form: textboxes "Email" and "Password", button "Sign in". Locators by role and accessible name.

## Test Scenarios

### 1. Profile follow

**Seed:** `tests/seed.spec.ts`

#### 1.1. Signed-out visitor sees the profile but no follow button

**File:** `tests/profile-follow/signed-out-profile.spec.ts`

**Steps:**
  1. Without signing in, open /profile/practice-author.
    - expect: Heading level 1 named "practice-author" is visible.
    - expect: Text "I write about testing and quality." is visible.
    - expect: Links "My Articles" and "Favorited Articles" are visible.
  2. Look for a button named "Follow practice-author" or "Unfollow practice-author".
    - expect: Neither button is on the page.
  3. Check the article list.
    - expect: Article links include "Your first end-to-end test" and "How to write a good bug report". (ASSUMPTION: 7 articles on the page, as seen on first load.)
  4. Reload the page.
    - expect: Same content, still no follow button.

#### 1.2. Signed-in reader unfollows then follows an author, and the state is saved

**File:** `tests/profile-follow/follow-author.spec.ts`

**Steps:**
  1. Sign in as practice-reader (textbox "Email", textbox "Password", button "Sign in"). Open /profile/practice-author.
    - expect: Button "Unfollow practice-author" is visible (seed state). ASSUMPTION: the name flips to "Follow practice-author" when not following; not observed.
  2. Click "Unfollow practice-author".
    - expect: Button changes to "Follow practice-author" (ASSUMPTION on exact text). GET /api/profiles/practice-author with the reader token returns following:false.
  3. Reload the page.
    - expect: Button still shows the not-following state, not reset.
  4. Click the follow button.
    - expect: Button shows "Unfollow practice-author". API returns following:true.
  5. Reload the page. Then open /profile/practice-reader and back, or check the feed.
    - expect: Button still shows "Unfollow practice-author". Home feed (ASSUMPTION: a "Your Feed" tab exists) lists practice-author articles when followed. Negative check: signed in as practice-author, the page shows no follow button for self (ASSUMPTION).
