# Beta Operations Checklist

## Pre-invite checklist

- Production deploy is up and reachable.
- Email confirmation flow works.
- Signup success message is visible.
- Login works for confirmed users.
- Unconfirmed login shows the inbox/spam guidance.
- Dashboard first-run cards are clickable.
- Create deck -> add version -> log first game path works on mobile.
- Public/private profile modes behave correctly.
- Shared report privacy behaves correctly.
- Latest validation has passed:
  - `npm run lint`
  - `npm run build`
  - desktop E2E
  - mobile E2E
  - `node scripts/playtest_250_seed.mjs`
  - `node scripts/playtest_250_audit.mjs`

## Deployment checklist

- Confirm production env vars are present and correct.
- Confirm confirmation-email flow is using the intended production URLs.
- Confirm public profile links use the correct site URL.
- Confirm no debug/test-only banners or seeded test data appear in production.
- Confirm no private WhatsApp URL is hard-coded into the product.

## Smoke test checklist

Run these after deploy:

1. Landing page loads.
2. Signup page loads.
3. Login page loads.
4. Authenticated logo routes to `/dashboard`.
5. Create profile works.
6. Create deck works.
7. Add version works.
8. Log a match works.
9. Post-save reward is visible.
10. Dashboard, Matchups, Review, Decks, and Profile load.
11. Public profile privacy still behaves as expected.

## WhatsApp beta message template

Use the draft in `docs/whatsapp_beta_invite_message.md`.

## What to monitor during beta

- signup failures
- email confirmation confusion
- login failures
- deck/version creation drop-off
- match logging drop-off
- mobile layout bugs
- broken links or dead buttons
- repeated reports that Review feels wrong or unclear
- any privacy/reporting concern

## How to triage WhatsApp feedback

Collect:

- route/page
- device and browser
- screenshot if available
- reproduction steps
- whether it blocks logging or just feels confusing

Tag severity:

- `blocker`
  - app cannot be used for the core loop
  - signup/login broken
  - create deck/version/log flow broken
  - private data exposure
- `high`
  - major mobile breakage
  - broken navigation
  - failed save/edit/delete in core product
  - repeated raw/internal error exposure
- `medium`
  - confusing first-run state
  - wrong or weak Review prioritization
  - cluttered but functional product flow
- `low`
  - copy polish
  - minor layout awkwardness
  - non-blocking visual roughness

## Known caveats

- Review top-read prioritization may still over-prefer matchup watchlists over repeated loss-tag patterns in some rich datasets.
- Some setup and Review states are still denser than the match logging flow.
- Feedback collection is WhatsApp-based, not an in-app support workflow.

## Rollback plan

- If a blocker appears:
  - pause invites immediately
  - capture repro steps and screenshots
  - decide whether to hotfix or roll back the latest deploy
- If privacy is affected:
  - pause the beta immediately
  - revoke access where needed
  - fix before resuming invites

## Post-beta triage process

1. Group issues by:
   - onboarding
   - logging
   - Review/coach clarity
   - mobile layout
   - privacy/safety
2. Fix blockers first.
3. Fix repeated high-severity friction next.
4. Reassess whether the next beta batch should grow or stay controlled.
