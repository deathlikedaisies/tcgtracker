# Pre-Beta Release Candidate Audit

Date: 2026-06-24

## Test environment

- Repository: local working tree on `main`
- App target for audited routes: `http://127.0.0.1:3000`
- Confirmed disposable auth account: `pokeleaguenl@gmail.com`
- Seed workflow:
  - `node scripts/playtest_250_seed.mjs`
  - `node scripts/playtest_250_audit.mjs`
- Screenshot sources:
  - existing Playwright route coverage
  - seeded audit screenshots under `results/playtest_250_screenshots/`

## Fresh-user path result

Status: pass with one minor caution

Checked path:

1. Landing page
2. Signup page
3. Signup confirmation message
4. Login page
5. Dashboard first-run state
6. Profile
7. Deck creation
8. First version flow
9. First game logging
10. Return path through Dashboard, Logs, Decks, Matchups, Review

What is working:

- Signup shows a clear confirmation-email instruction.
- Login preserves the unconfirmed-email guidance state.
- Authenticated logo navigation works back to `/dashboard`.
- First-run dashboard cards are clickable and route somewhere useful.
- Zero-deck mobile flow surfaces the create-deck form near the top.
- First version setup is clearer than before and no longer uses misleading “support cards” wording.
- Match logging enforces:
  - match
  - result
  - turn order
  - quality
  - reason
  - optional more context
- Post-save success state now includes a visible short reward line.

Minor caution:

- The first-run surfaces are now usable, but still fairly information-rich. This is acceptable for a controlled beta, not fully optimized onboarding perfection.

## Seeded 250-game path result

Status: mostly pass with one known product-quality gap

Audited routes:

- `/dashboard`
- `/matches`
- `/matches?page=2`
- `/matches/new`
- `/matchups`
- `/decks`
- `/decks/[deckId]`
- `/review`
- `/profile`
- `/demo`

What is working:

- Dashboard next action remains specific and not dominated by low-sample noise.
- Logs pagination works at 250 matches.
- Matchups surfaces preserve the strongest watchlist leak instead of promoting Rogue noise.
- Deck detail still surfaces version evidence cleanly.
- Profile/privacy/public report modes still behave safely.
- Post-save reward is now detected and visible.
- Mobile route captures at `390x844` and `430x932` stayed within acceptable layout bounds.

Known gap:

- `results/playtest_250_issue_matrix.tsv` still reports:
  - `repeated_loss_issue`: fail
- Current seeded behavior:
  - Review top read prefers the Mega Greninja matchup watchlist
  - instead of surfacing the seeded repeated `Item Lock` loss pattern
- This is a product prioritization issue, not a crash or broken route.

Interpretation:

- Review is still useful and evidence-backed.
- The remaining gap is about “best top read” selection under a rich seeded sample, not whether Review works at all.

## Mobile findings

Verdict: acceptable for controlled beta

What held up:

- no page-level horizontal overflow in the audited mobile routes
- dashboard/nav/auth shell remain usable
- deck creation is surfaced earlier on mobile
- match logging remains fast and one-handed enough
- first-run cards are clickable instead of decorative dead surfaces

What still feels weaker:

- Review remains the densest page on mobile, even with the current hierarchy work.
- Deck and profile flows are usable, but still text-heavy compared with the logging flow.

## Production-readiness findings

What looks ready:

- Major forms have clear success/error states.
- Primary button disabled states are now mostly correct.
- Auth-protected routes redirect safely.
- Public profile/privacy modes still work.
- Demo still resembles the real product loop.
- No obvious raw internal framework errors are shown in the audited user paths.

What remains risky:

- The 250-game seeded Review prioritization gap is still open.
- The seeded audit is informative, but it does not hard-fail on product scoring mismatches. Human review is still required.

## Issues fixed now

### 1. Post-save reward audit reliability

- Files:
  - `src/components/matches/MatchLogForm.tsx`
  - `scripts/playtest_250_audit.mjs`
- Why it mattered:
  - A saved game should give the user a visible, trustworthy success signal.
  - The audit previously could not confirm that reliably.
- Outcome:
  - reward copy is now visible and auditable via `data-testid="post-save-reward"`
  - seeded audit now passes the `post_save_reward` check

### 2. Review loss-tag scoring cleanup

- File:
  - `src/lib/review-analysis.ts`
- Why it mattered:
  - Review loss-pattern selection was too dependent on the single most common tag.
- Outcome:
  - logic now scores all candidate loss tags
  - this is cleaner and more explainable
  - however, it did not fully resolve the seeded `Item Lock` vs Mega Greninja prioritization gap

### 3. Seeded audit reproducibility improvements

- File:
  - `scripts/playtest_250_audit.mjs`
- Why it mattered:
  - the release audit needs to be rerunnable without silently missing the saved-state reward
- Outcome:
  - audit now uses a stable saved-state verification path
  - audit artifacts regenerate cleanly after reseeding

## Issues deferred

### 1. Review top-read prioritization under the 250-game seed

- Severity: medium
- Reason deferred:
  - not a runtime blocker
  - not breaking onboarding, logging, or navigation
  - needs a more deliberate product-scoring decision rather than a rushed pre-beta tweak

### 2. Remaining onboarding/text density

- Severity: low
- Reason deferred:
  - still acceptable for a 3–5 user controlled beta
  - better handled as iterative UX tuning after first external feedback

## Final beta-readiness verdict

Verdict: ready with minor known issues

Recommendation:

- The app is ready for a **3–5 user controlled beta**.
- It is not yet at “broad beta” quality because Review top-read prioritization still has one known seeded-sample mismatch.

Why it is ready for a small controlled beta:

- auth and confirmation flows are stable
- first-run setup is workable
- create deck/version/log flows are functioning cleanly
- mobile is acceptable
- seeded volume does not break Logs, Matchups, Decks, or Profile
- no current blocker was found in core route stability

Why this should stay controlled:

- the Review top-read prioritization still needs product tuning before relying on it as the strongest insight surface for a wider audience
