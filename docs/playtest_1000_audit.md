# Playtest 1000 Audit

Date: 2026-06-24
User id: c9c7565b-9587-4e54-9d0b-a0c32e568d36

## Seed setup summary

- Test account: pokeleaguenl@gmail.com
- Base URL audited: http://127.0.0.1:3000
- Decks: 12
- Versions: 33
- Matches: 1000
- Shared reports after audit: 2

## Data patterns intentionally created

- Raging Bolt vs Mega Greninja is the main leak at 25-45-10 across 80 games.
- Rogue Box stays noisy at 7-11-7 across 25 games so it should not outrank stronger leaks.
- Control Counterlab repeats Item Lock in 32 of 32 losses.
- Gardevoir keeps a positive tech signal in 43 of 49 wins.
- Charizard keeps a visible first/second split at 43-9-1 going first and 8-18-13 going second.
- Unknown turn order is present and should stay excluded from the split.

## Routes audited

### Public

- /
- /demo
- /demo

### Authenticated desktop

- /dashboard
- /review
- /matchups
- /matches
- /matches?page=2
- /matches?page=5
- /matches?page=10
- /decks
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f
- /decks/8229d2ee-0040-4226-8b0f-4c3c9f4ae501
- /matches/new
- /profile

### Authenticated mobile

- /dashboard
- /decks
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f
- /review
- /matchups
- /matches
- /matches/new
- /profile
- /u/domz_test
- /dashboard
- /matches/new
- /review
- /dashboard
- /profile
- /decks
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f
- /decks/8229d2ee-0040-4226-8b0f-4c3c9f4ae501
- /matches/new
- /matches
- /matchups
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

### matches: Pagination at 1000 logs

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

- results/playtest_1000_screenshots/authenticated_post_save_reward_1000.png
- results/playtest_1000_screenshots/desktop__dashboard.png
- results/playtest_1000_screenshots/desktop__decks.png
- results/playtest_1000_screenshots/desktop__decks_02d3b3d1-6fe0-4381-803b-af3d8147ccb4.png
- results/playtest_1000_screenshots/desktop__decks_8229d2ee-0040-4226-8b0f-4c3c9f4ae501.png
- results/playtest_1000_screenshots/desktop__decks_86a3c634-52e6-4a84-95ca-a792fe66faed.png
- results/playtest_1000_screenshots/desktop__decks_9811d1c6-3fde-4b24-8f09-a3c88d4f1fe3.png
- results/playtest_1000_screenshots/desktop__decks_ba5186f9-a355-4f15-901e-5c34b0d82ee8.png
- results/playtest_1000_screenshots/desktop__decks_e8ece6e6-c779-4ba2-8626-b43844acb00f.png
- results/playtest_1000_screenshots/desktop__demo.png
- results/playtest_1000_screenshots/desktop__matches.png
- results/playtest_1000_screenshots/desktop__matches_new.png
- results/playtest_1000_screenshots/desktop__matches_page_10.png
- results/playtest_1000_screenshots/desktop__matches_page_2.png
- results/playtest_1000_screenshots/desktop__matches_page_5.png
- results/playtest_1000_screenshots/desktop__matchups.png
- results/playtest_1000_screenshots/desktop__profile.png
- results/playtest_1000_screenshots/desktop__review.png
- results/playtest_1000_screenshots/desktop_public_demo.png
- results/playtest_1000_screenshots/desktop_public_root.png
- results/playtest_1000_screenshots/mobile430__dashboard.png
- results/playtest_1000_screenshots/mobile430__matches_new.png
- results/playtest_1000_screenshots/mobile430__review.png
- results/playtest_1000_screenshots/mobile__dashboard.png
- results/playtest_1000_screenshots/mobile__decks.png
- results/playtest_1000_screenshots/mobile__decks_86a3c634-52e6-4a84-95ca-a792fe66faed.png
- results/playtest_1000_screenshots/mobile__decks_ba5186f9-a355-4f15-901e-5c34b0d82ee8.png
- results/playtest_1000_screenshots/mobile__decks_e8ece6e6-c779-4ba2-8626-b43844acb00f.png
- results/playtest_1000_screenshots/mobile__matches.png
- results/playtest_1000_screenshots/mobile__matches_new.png
- results/playtest_1000_screenshots/mobile__matchups.png
- results/playtest_1000_screenshots/mobile__profile.png
- results/playtest_1000_screenshots/mobile__review.png
- results/playtest_1000_screenshots/mobile_profile_private.png
- results/playtest_1000_screenshots/profile_link_only.png
- results/playtest_1000_screenshots/profile_private_unavailable.png
- results/playtest_1000_screenshots/profile_public_aggregate.png
- results/playtest_1000_screenshots/profile_public_analytics_private.png
- results/playtest_1000_screenshots/report_private_profile.png
- results/playtest_1000_screenshots/report_public_profile.png
- results/playtest_1000_screenshots/tablet__dashboard.png
- results/playtest_1000_screenshots/tablet__decks.png
- results/playtest_1000_screenshots/tablet__decks_02d3b3d1-6fe0-4381-803b-af3d8147ccb4.png
- results/playtest_1000_screenshots/tablet__decks_8229d2ee-0040-4226-8b0f-4c3c9f4ae501.png
- results/playtest_1000_screenshots/tablet__decks_86a3c634-52e6-4a84-95ca-a792fe66faed.png
- results/playtest_1000_screenshots/tablet__decks_9811d1c6-3fde-4b24-8f09-a3c88d4f1fe3.png
- results/playtest_1000_screenshots/tablet__decks_ba5186f9-a355-4f15-901e-5c34b0d82ee8.png
- results/playtest_1000_screenshots/tablet__decks_e8ece6e6-c779-4ba2-8626-b43844acb00f.png
- results/playtest_1000_screenshots/tablet__matches.png
- results/playtest_1000_screenshots/tablet__matches_new.png
- results/playtest_1000_screenshots/tablet__matchups.png
- results/playtest_1000_screenshots/tablet__profile.png
- results/playtest_1000_screenshots/tablet__review.png

## Recommended fixes

- clear_bad_matchup: Seeded at 25-45-10 across 80 games.
- low_sample_noise: Rogue Box stays at 7-11-7 across 25 games.
- version_improvement: Raging Bolt v3 and Gardevoir v2 are seeded as the healthier versions.
- repeated_loss_issue: 32 of 32 control losses are tagged Item Lock, but the richer global sample may still surface a broader loss tag above it.
- positive_tag_enrichment: 43 of 49 Gardevoir wins are tagged key tech mattered.
- turn_order_split: Charizard first=43-9-1 second=8-18-13.
- pagination_depth: Audit includes /matches?page=2, /matches?page=5, and /matches?page=10.
- post_save_reward: Audit used the saved-state success route to verify the visible reward copy.

## Fixed now vs deferred

### Fixed now

- clear_bad_matchup: no change required in this pass; current behavior matched the seeded expectation.
- low_sample_noise: no change required in this pass; current behavior matched the seeded expectation.
- version_improvement: no change required in this pass; current behavior matched the seeded expectation.
- repeated_loss_issue: no change required in this pass; current behavior matched the seeded expectation.
- positive_tag_enrichment: no change required in this pass; current behavior matched the seeded expectation.
- turn_order_split: no change required in this pass; current behavior matched the seeded expectation.
- pagination_depth: no change required in this pass; current behavior matched the seeded expectation.
- post_save_reward: no change required in this pass; current behavior matched the seeded expectation.

### Deferred

- None

## Performance summary

- /matchups: 6751ms
- /matchups: 5984ms
- /matchups: 5641ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 2362ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 1809ms
- /decks/8229d2ee-0040-4226-8b0f-4c3c9f4ae501: 1768ms
- /matches?page=2: 1686ms
- /matches: 1661ms

## Production validation

Not run in this audit pass because no deploy was performed. Production validation should happen after review and deployment.

## Final verdict

Ready for the 10-20 tester WhatsApp beta.
