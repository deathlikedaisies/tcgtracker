# Playtest 250 Audit

Date: 2026-06-24
User id: c9c7565b-9587-4e54-9d0b-a0c32e568d36

## Seed setup summary

- Test account: pokeleaguenl@gmail.com
- Base URL audited: http://localhost:3000
- Decks: 8
- Versions: 18
- Matches: 250
- Shared reports after audit: 4

## Data patterns intentionally created

- Raging Bolt vs Mega Greninja is the main leak at 9-26-5 across 40 games.
- Rogue Box stays noisy at 3-4-3 across 10 games so it should not outrank stronger leaks.
- Control Counterlab repeats Item Lock in 10 of 10 losses.
- Gardevoir keeps a positive tech signal in 13 of 15 wins.
- Charizard keeps a visible first/second split at 15-5-0 going first and 4-5-2 going second.
- Unknown turn order is present and should stay excluded from the split.

## Routes audited

### Public

- /
- /demo

### Authenticated desktop

- /dashboard
- /review
- /matchups
- /matches
- /matches?page=2
- /decks
- /decks/9d3c1d32-9c41-4a8b-9156-92282aa29fc3
- /matches/new
- /profile

### Authenticated mobile

- /dashboard
- /decks
- /decks/9d3c1d32-9c41-4a8b-9156-92282aa29fc3
- /review
- /matchups
- /matches
- /matches/new
- /profile
- /u/domz_test
- /dashboard
- /matches/new
- /review

## Findings by page

### dashboard: Primary mission

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Keep Mega Greninja on the watchlist and keep tagging what breaks first.
- Fix now or defer: defer

### review: Primary insight

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Use the filtered review surfaces to decide what to re-test next.
- Fix now or defer: defer

### matchups: Weakest actionable matchup

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Use the report link and follow-up logging loop from Matchups.
- Fix now or defer: defer

### decks: Version improvement signal

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Deck detail should keep highlighting the active experiment and the healthier opener.
- Fix now or defer: defer

### dashboard: Onboarding / next-step prompt

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Keep a single next-step card visible instead of stacking multiple prompts.
- Fix now or defer: defer

### matches: Pagination at 250 logs

- Severity: low
- Problem: No blocking issue found in this audit pass.
- Suggested fix: Keep logs paginated instead of rendering the full table at once.
- Fix now or defer: defer

### Profile and report privacy

- Severity: low
- Problem: Profile builder and privacy-safe report behavior held up at seeded volume.
- Suggested fix: Keep the profile route and link-only/private report behavior under regression coverage.
- Fix now or defer: defer

### Mobile and responsive

- Severity: low
- Problem: No horizontal overflow found across the audited mobile routes.
- Suggested fix: Keep mobile route captures in the seeded audit and treat any future overflow as a fix-now issue.
- Fix now or defer: defer

## Screenshots taken

- results/playtest_250_screenshots/authenticated_post_save_reward_250.png
- results/playtest_250_screenshots/desktop__dashboard.png
- results/playtest_250_screenshots/desktop__decks.png
- results/playtest_250_screenshots/desktop__decks_68dfa729-a7d7-48a7-903e-28f4250e2f91.png
- results/playtest_250_screenshots/desktop__decks_9d3c1d32-9c41-4a8b-9156-92282aa29fc3.png
- results/playtest_250_screenshots/desktop__decks_db971151-af64-4a09-9aec-5c0d19a221a8.png
- results/playtest_250_screenshots/desktop__matches.png
- results/playtest_250_screenshots/desktop__matches_new.png
- results/playtest_250_screenshots/desktop__matches_page_2.png
- results/playtest_250_screenshots/desktop__matchups.png
- results/playtest_250_screenshots/desktop__profile.png
- results/playtest_250_screenshots/desktop__review.png
- results/playtest_250_screenshots/desktop_public_demo.png
- results/playtest_250_screenshots/desktop_public_root.png
- results/playtest_250_screenshots/mobile430__dashboard.png
- results/playtest_250_screenshots/mobile430__matches_new.png
- results/playtest_250_screenshots/mobile430__review.png
- results/playtest_250_screenshots/mobile__dashboard.png
- results/playtest_250_screenshots/mobile__decks.png
- results/playtest_250_screenshots/mobile__decks_9d3c1d32-9c41-4a8b-9156-92282aa29fc3.png
- results/playtest_250_screenshots/mobile__decks_db971151-af64-4a09-9aec-5c0d19a221a8.png
- results/playtest_250_screenshots/mobile__matches.png
- results/playtest_250_screenshots/mobile__matches_new.png
- results/playtest_250_screenshots/mobile__matchups.png
- results/playtest_250_screenshots/mobile__profile.png
- results/playtest_250_screenshots/mobile__review.png
- results/playtest_250_screenshots/mobile_profile_private.png
- results/playtest_250_screenshots/profile_link_only.png
- results/playtest_250_screenshots/profile_private_unavailable.png
- results/playtest_250_screenshots/profile_public_aggregate.png
- results/playtest_250_screenshots/profile_public_analytics_private.png
- results/playtest_250_screenshots/report_private_profile.png
- results/playtest_250_screenshots/report_public_profile.png

## Recommended fixes

- clear_bad_matchup: Seeded at 9-26-5 across 40 games.
- low_sample_noise: Rogue Box stays at 3-4-3 across 10 games.
- version_improvement: Raging Bolt v3 and Gardevoir v2 are seeded as the healthier versions.
- repeated_loss_issue: 10 of 10 control losses are tagged Item Lock.
- positive_tag_enrichment: 13 of 15 Gardevoir wins are tagged key tech mattered.
- turn_order_split: Charizard first=15-5-0 second=4-5-2.
- pagination_depth: Audit includes /matches?page=2 to confirm deeper-page volume behavior.
- post_save_reward: 1 temporary saved match cleaned back out after audit.

## Fixed now vs deferred

### Fixed now

- clear_bad_matchup: no change required in this pass; current behavior matched the seeded expectation.
- low_sample_noise: no change required in this pass; current behavior matched the seeded expectation.
- version_improvement: no change required in this pass; current behavior matched the seeded expectation.
- positive_tag_enrichment: no change required in this pass; current behavior matched the seeded expectation.
- turn_order_split: no change required in this pass; current behavior matched the seeded expectation.
- pagination_depth: no change required in this pass; current behavior matched the seeded expectation.

### Deferred

- repeated_loss_issue: 10 of 10 control losses are tagged Item Lock.
- post_save_reward: 1 temporary saved match cleaned back out after audit.

## Performance summary

- /matches/new: 5338ms
- /matchups: 2660ms
- /matchups: 2300ms
- /matches: 1946ms
- /decks/9d3c1d32-9c41-4a8b-9156-92282aa29fc3: 1428ms
- /review: 1427ms
- /matches: 1395ms
- /matches?page=2: 1390ms

## Production validation

Not run in this audit pass because no deploy was performed. Production validation should happen after review and deployment.
