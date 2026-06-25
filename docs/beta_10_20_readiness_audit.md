# 10-20 Tester Beta Readiness Audit

Date: 2026-06-24

## Test environment

- Repository: local working tree on `main`
- App target for audited routes: `http://127.0.0.1:3000`
- Disposable auth account used for seeded volume checks: `pokeleaguenl@gmail.com`
- Seed workflow:
  - `node scripts/playtest_250_seed.mjs`
  - `node scripts/playtest_250_audit.mjs`
- Mobile audit widths:
  - `390x844`
  - `430x932`
  - `768x1024`

## 1. Signup and auth readiness

Status: pass

What is ready:

- Signup success persists by redirecting to login with a confirmation-email message.
- Signup/login copy tells users to check inbox and spam.
- Unconfirmed login keeps the amber confirmation guidance state.
- Resend confirmation remains generic and does not expose account existence.
- Wrong-password handling remains generic.
- Logged-out users redirect safely away from authenticated routes.
- No `NEXT_REDIRECT`, raw Supabase messages, or framework errors were surfaced in the audited user path.

Risk level:

- Low for a 10-20 tester beta.

## 2. First-run onboarding readiness

Status: pass

What is ready:

- Dashboard onboarding cards are clickable and route somewhere useful.
- Profile setup path is clear.
- Zero-deck mobile flow surfaces deck creation near the top.
- First version creation is clearer and no longer overloaded with dead-end setup copy.
- First-game logging path is clear and enforces required quality and reason fields.
- First-run screens no longer duplicate the main CTA as aggressively as before.
- Mobile first-run flow remained usable at `390x844` and `430x932`.

Remaining caution:

- Some first-run pages are still a little text-heavy, especially compared with the match logging flow.

Risk level:

- Low.

## 3. Core product readiness

Status: pass with one product-quality caveat

What is ready:

- Create/edit/delete deck
- Create/edit/delete version
- Log/edit/delete match
- Required quality and reason validation
- Logs pagination and filtering
- Dashboard next-action flow
- Matchups watchlist flow
- Review page stability
- Profile and public profile
- Demo alignment with the current product loop

Known caveat:

- Review top-read prioritization may still prefer a matchup watchlist over a repeated loss-tag pattern in some richer datasets.

Risk level:

- Medium for product quality
- Low for route stability

## 4. Feedback readiness

Status: pass

Current decision:

- The app now includes an authenticated in-app `Feedback` page.
- Testers can save reports directly in SixPrizer without relying on any group-specific channel.

Reason:

- The in-app feedback page is lower risk than a hard-coded external group link.
- Testers can still send direct messages for urgent issues when needed.

Operational guidance:

- Use the in-app `Feedback` page as the default reporting path.
- Ask testers to include route, device, browser, and screenshots when possible.

Risk level:

- Low, as long as the owner posts clear tester instructions and follow-up guidance.

## 5. Privacy and data safety

Status: pass

What is ready:

- Public/private/link-only profile modes still work.
- Shared report privacy still works.
- Test users cannot see other users' private profile states in the audited paths.
- No passwords or auth tokens were surfaced in user-visible flows.
- Resend confirmation remains generic.
- Service-role access remains scoped to intended seed/community/report paths rather than ordinary user browsing flows.

Risk level:

- Low.

## 6. Empty-state and error readiness

Status: pass

Audited empty/low-data states:

- Empty dashboard
- Empty decks
- Deck with no versions
- Deck with version but no games
- Logs with no games
- Review with too little data
- Matchups with too little data
- Incomplete profile
- Missing/private profile states

What is ready:

- Primary actions are clearer than in earlier builds.
- User-facing messages are generally specific and not raw internal errors.
- No broken first-run dead ends were found in the audited paths.

Remaining caution:

- Review low-data states are serviceable, but still denser than the logging path.

Risk level:

- Low.

## 7. Mobile readiness

Status: pass for controlled beta

Routes checked:

- `/dashboard`
- `/profile`
- `/decks`
- `/decks/[deckId]`
- `/matches/new`
- `/matches`
- `/matchups`
- `/review`

What is ready:

- No page-level horizontal overflow on the audited routes.
- Primary actions were visible enough to complete the core loop.
- Disabled buttons looked disabled in the audited form states.
- Sticky/fixed surfaces did not block the main match logging inputs.
- Long deck/version names no longer break the authenticated shell as badly as before.

Remaining caution:

- Review remains the densest mobile surface.
- Deck and profile remain more text-heavy than the logging path.

Risk level:

- Low for 10-20 local testers
- Medium if the app were opened to a much broader audience immediately

## 8. Seeded volume readiness

Status: mostly pass with one known caveat

Workflow:

- `node scripts/playtest_250_seed.mjs`
- `node scripts/playtest_250_audit.mjs`

What is ready:

- 250-game audit runs successfully after reseeding.
- Logs pagination still works at scale.
- Review, Matchups, Deck detail, Profile, and Match logging still load.
- No seeded mobile overflow issue was reported by the audit.
- No runtime crashes were found in the audited seeded paths.

Known caveat:

- `results/playtest_250_issue_matrix.tsv` still reports:
  - `repeated_loss_issue`: fail
- Current top Review read remains:
  - `Mega Greninja is your priority watchlist`
- This is a product prioritization mismatch, not a stability failure.

Risk level:

- Medium for insight quality
- Low for operational stability

## Issues fixed now

- No new product code change was required in this pass.
- The beta-readiness work in this pass is documentation and operational hardening around the already-fixed core flows.

## Issues deferred

### 1. Review top-read prioritization in rich seeded data

- Severity: medium
- Why deferred:
  - not a blocker for auth, onboarding, logging, navigation, privacy, or mobile stability
  - needs a deliberate scoring/product decision rather than a rushed beta patch

### 2. Remaining text density in some setup/review states

- Severity: low
- Why deferred:
  - acceptable for a controlled beta
  - better tuned after real tester feedback

## Final verdict

Verdict: ready for a controlled 10-20 user beta with known caveats

Why this is acceptable now:

- auth and confirmation flows are stable
- first-run setup is workable on mobile
- the create deck -> create version -> log first game loop is functioning cleanly
- seeded 250-game volume does not break the core product surfaces
- privacy modes and public/report visibility still behave safely
- there are no current blocker-level crashes, broken navigational dead ends, or raw internal errors in the audited paths

Why this should still stay controlled:

- Review top-read prioritization still has one known seeded-data caveat
- feedback collection is lightweight and now available in-app, with direct follow-up still useful for urgent issues

Recommendation:

- Invite the 10-20 local beta testers now.
- Keep the group controlled, ask for screenshots and device/browser info, and treat Review prioritization feedback as a top post-beta triage topic.
