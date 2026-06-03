# SixPrizer External Beta Readiness Audit

## 1. Executive summary
SixPrizer is ready for a small controlled external beta.

The production site at `https://sixprizer.com` passed the authenticated and mobile Playwright suites using the dedicated seeded test account from local environment variables, and the core product loop worked on production:

- landing -> demo
- login -> dashboard
- guided match logging
- paginated match history
- decks overview and deck detail
- matchup review

The app now feels coherent, useful, and stable enough for a limited cohort. The main caution is an auth hardening edge case: if the login form is submitted before client hydration attaches the React handler, production can fall back to a native form submission. The normal typed login flow passed consistently, but this should still be fixed before widening access beyond a controlled cohort.

## 2. Environment tested
- Repo: local working copy at `C:\Documents\SideProjects\tcgtracker\tcgtracker`
- Production target: `https://sixprizer.com`
- Test account: dedicated seeded 100-game account loaded from `.env.local`
- Browser automation:
  - Playwright `desktop-chromium`
  - Playwright `mobile-chrome`
  - Additional targeted production audit with Chromium automation
- Viewports checked:
  - `1440x900`
  - `390x844`
  - `430x932`

## 3. Playwright results
Production Playwright against `https://sixprizer.com`:

- `npm run test:e2e -- --project=desktop-chromium`: `19 passed`
- `npm run test:e2e -- --project=mobile-chrome`: `19 passed`

Authenticated tests did run and did not skip.

Verified in the passing suites:
- login works with the production test account
- `/dashboard`
- `/matches/new`
- `/matches`
- `/decks`
- `/matchups`
- public routes
- mobile overflow checks

Playwright artifacts no longer write into the repo root. They were emitted to the OS temp directory during the audit, not to `playwright-report/` or `test-results/` inside the repo.

## 4. Routes checked
Public:
- `/`
- `/login`
- `/signup`
- `/demo`

Authenticated:
- `/dashboard`
- `/matches/new`
- `/matches`
- `/matches?page=2`
- `/decks`
- `/decks/[real deck id]`
- `/matchups`
- `/matches/[matchId]/edit`

Route observations:
- No route-level error boundaries appeared in the production audit.
- No horizontal overflow was detected at the audited mobile viewports.
- Headings and primary CTAs were visible and consistent across pages.
- Visual system remains cohesive between landing, dashboard, logger, decks, and matchups.

## 5. Core flows checked
### A. Landing -> demo
Status: pass

- Landing CTA worked.
- Demo route loaded correctly.
- Landing page is visually strong and product-specific without feeling broken or unstable.

### B. Login -> dashboard
Status: pass

- Production login succeeded with the dedicated test account.
- Dashboard hero prioritized `Review Mega Greninja matchup`.
- `Priority watchlist` language was visible and clear.
- `More insights` expanded correctly.
- No contradictory mission state copy was observed on the dashboard.

### C. Log a game
Status: pass

Checked on production:
- opponent search selected `Mega Greninja`
- `First / Second / Can't remember` options were present
- progression blocked correctly until required steps were set
- optional sections could be skipped
- save completed
- post-log reward rendered

Observed post-save reward behavior:
- reward screen showed `Game logged`
- reward used watchlist/review-set language rather than forced matchup-selection language
- `Turn order unknown` carried through to the reward state
- next action remained coherent with the active mission

### D. Matches page
Status: pass

- pagination worked
- `/matches` and `/matches?page=2` both loaded
- match cards remained readable
- `Turn order unknown` displayed correctly
- ties displayed correctly
- edit link opened a real edit page

### E. Decks
Status: pass

- `/decks` loaded quickly
- deck cards remained readable on desktop and mobile
- no raw full decklist was shown on overview cards
- deck detail loaded for a real deck
- manual archetype display remained intact

One nuance:
- The specific active deck inspected in production had clean list status, so warning states were not foregrounded on that card. The overall deck system still showed list-health language where relevant in previous targeted deck checks.

### F. Matchups
Status: pass with minor language inconsistency

- `Mega Greninja` remained the clearest actionable leak
- matchup cards did not look broken on mobile
- low-data entries appeared restrained rather than overclaimed

Minor note:
- The matchups page did not echo `Priority watchlist` as explicitly as the dashboard/logger mission surfaces. The guidance is still coherent, but the wording is slightly less consistent there.

## 6. Mobile readiness
Status: ready for controlled beta

Checked on `390x844` and `430x932`:
- landing
- dashboard
- matches/new
- matches
- decks
- matchups

Findings:
- no horizontal overflow detected
- tap targets were usable
- dashboard stacked cleanly
- logging flow stayed usable one-handed
- live summary did not dominate the active logging step
- decks remained long but readable
- matchups filter area was compact and still usable on mobile

The two best production mobile screens in this audit were the simplified dashboard and the logger. The longest mobile page remains `/decks`, but it stayed readable and actionable.

## 7. Analytics and mission readiness
Status: good

Confirmed with the seeded 100-game production account:
- dashboard hero still prioritizes `Mega Greninja`
- mission wording uses `Priority watchlist`
- dashboard and matchups both surface `Mega Greninja` as the main leak
- `/matches` pagination still preserves totals and historical usability
- `Turn order unknown` is visible in saved-match surfaces

Observed mission state on production:
- `Review Mega Greninja matchup`
- `Actionable signal`
- `Priority watchlist`

One honest limitation:
- The UI does not directly expose a denominator breakdown proving that unknown turn-order games are excluded from first/second split calculations. Based on the current implementation, prior QA, and the absence of contradictory turn-order output in production, this still appears correct, but it was not directly proven from a visible production metric card in this audit.

## 8. Known limitations
### High-priority follow-up
- Login pre-hydration fallback:
  - In a forced fast automation path, the login form can fall back to a native submission before hydration.
  - In normal typed login flows and in the final Playwright production suite, login worked correctly.
  - This should be hardened before opening access beyond a small invited cohort because it is an auth-form robustness issue.

### Minor product issues
- Matchups page mission phrasing is slightly less explicit than the dashboard/logger watchlist language.
- `/matches` and `/matchups` remain the heaviest-feeling production routes, though still acceptable in this cohort-size context.
- `/decks` on mobile is long and information-dense, but not broken.

## 9. Blockers before inviting testers
Hard blockers found in this audit:
- None for a small controlled beta.

Soft blocker / highest-priority patch:
- Harden the login form against pre-hydration native submit behavior before expanding beyond a small invited cohort.

## 10. Nice-to-have fixes after testers start
- Make matchups-page wording mirror `Priority watchlist` more explicitly.
- Add one visible analytics hint clarifying that unknown turn-order games stay out of first/second split reads.
- Keep tuning `/decks` mobile density as more deck families accumulate.
- Monitor `/matches` and `/matchups` response feel as real testers add more data.

## 11. Final verdict
### Ready for small controlled external beta
Yes.

### Recommended tester count
`5-10` invited testers first.

That is enough to:
- validate real usage variety
- observe auth, save-flow, and mobile behavior under outside conditions
- gather qualitative feedback without overwhelming support/debug bandwidth

### Recommended tester instructions
- Start with the demo for one minute, then create or log in to your real account.
- Create one deck family and at least one version before logging matches.
- Use `Can't remember` for turn order when needed instead of guessing.
- Log games normally; do not try to force matchups.
- If the dashboard shows a `Priority watchlist`, treat it as a matchup to watch for, not one you must queue into.
- Report:
  - route that broke
  - screenshot
  - whether you were on mobile or desktop
  - whether you were editing a deck, logging a game, or reviewing matches
