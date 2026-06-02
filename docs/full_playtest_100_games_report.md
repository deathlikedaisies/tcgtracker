# SixPrizer Full Playtest Audit

## 1. Executive summary

SixPrizer is close to being a useful closed-beta coaching product for competitive Pokemon TCG players. The core loop now works: deck pages load, 100 matches can exist without crashing the app, matchups surface real pressure, conservative archetype detection is trustworthy, and the post-log reward state is substantially more satisfying than earlier builds.

The biggest remaining issue is not stability. It is coaching prioritization. With a deliberately seeded 100-game dataset, the strongest actionable leak is clearly `Mega Greninja` at `5-19-2` overall and `Raging Bolt Lab` into `Mega Greninja` at `2-16-2`, but the dashboard mission hero currently promotes `Improve matchup knowledge` as a completed loss-pattern mission. The top retention surface is therefore not always pointing at the strongest next test.

Verdict: ready for a small controlled external cohort after a focused mission-priority pass, not yet ready for broader tester onboarding.

## 2. Test environment

- Repo state before audit: clean
- Validation before and after audit:
  - `npm run lint` passed
  - `npm run build` passed
  - `git diff --check` passed
- Data backend: real Supabase project from `.env.local`
- Route verification:
  - authenticated production HTML fetches against `https://sixprizer.com`
  - authenticated local HTML fetches against `http://localhost:3000`
- Important limitation:
  - full browser automation was not available in this session
  - the 100-game dataset was seeded through Supabase using the dedicated playtest account
  - authenticated page rendering was then verified using a real Supabase session cookie against local and production
  - this is a real-data playtest audit, but not a full click-driven browser recording of 100 UI submissions

## 3. Test account used

- Dedicated playtest account supplied by the user
- Credentials intentionally omitted from this report
- Existing state before audit:
  - `0` decks
  - `0` matches
- Cleanup safety:
  - only this dedicated playtest account was modified
  - no real user account data was touched

## 4. Dataset summary

### Account dataset after seeding

- Decks: `3`
- Versions: `6`
- Matches: `100`
- Flattened `match_tags`: `162`
- Learnings notes: `32`
- Competitive logs: `10`
- Testing logs: `90`
- Results: `46W / 47L / 7T`
- Turn order: `45 first / 55 second`

### Deck distribution

- `Raging Bolt Lab`: `55` games
  - versions:
    - `v1 Turbo`: `4W / 7L / 0T`
    - `v2 Stamina`: `14W / 15L / 1T`
    - `v3 Anti-Bench Pressure`: `6W / 6L / 2T`
- `Dragapult Testing`: `30` games
  - versions:
    - `v1 Baseline`: `6W / 8L / 1T`
    - `v2 Dusknoir Build`: `11W / 3L / 1T`
- `Rogue Box`: `15` games
  - versions:
    - `v1 Unknown Meta Call`: `5W / 8L / 2T`

### Intentional seeded patterns and observed outcomes

- `Raging Bolt Lab` into `Mega Greninja`
  - observed: `20` direct Raging Bolt vs Mega Greninja games
  - record: `2W / 16L / 2T`
  - repeated issues:
    - `bench pressure` tagged `20x`
    - `missed setup` tagged `18x`
  - second-turn losses: `11`
- `Dragapult Testing` improvement after `v2 Dusknoir Build`
  - observed:
    - `v1 Baseline`: `40%` win rate across `15` games
    - `v2 Dusknoir Build`: `73%` win rate across `15` games
- `Rogue Box`
  - observed: low-confidence, noisy results
  - parser result: `No clear archetype detected`
  - unresolved list line intentionally present

## 5. Routes tested

### Public route sanity

- `/`
- `/login`
- `/signup`
- `/demo`

### Authenticated route sanity

- `/dashboard`
- `/decks`
- `/decks/[deckId]` for all three seeded decks
- `/matches`
- `/matches/new`
- `/matches/new?success=1...`
- `/matchups`
- `/matches/[matchId]/edit`

### Response checks

All authenticated production route fetches above returned `200`.

## 6. Major issues found

### 1. Dashboard mission prioritization is not aligned with the strongest available signal

Severity: High

Observed production dashboard hero:

- mission type: `Loss-pattern mission`
- mission title: `Improve matchup knowledge`
- status: `Mission complete`

Observed production matchups page at the same time:

- `Mega Greninja` is shown as the top `Actionable leak`
- sample: `26 played`
- record: `5W / 19L / 2T`
- overall win rate: `19%`

Assessment:

The strongest product-retention loop should point to the clearest next test. Right now, the dashboard hero can be internally coherent while still failing the practical coaching question: “What should I test next?” The matchup page answers that correctly. The dashboard hero does not.

Recommendation:

- Re-rank mission candidate selection so the hero prefers the strongest actionable multi-game leak before a weaker recent-tag pattern
- weight matchup confidence, repeated issue count, and sample size more heavily than “recently seen once” issue tags

### 2. Mission status copy can contradict its own evidence

Severity: High

Observed dashboard hero copy:

- badge: `Mission complete`
- recent outcome: `Pattern confirmed`
- evidence line: `This needs more games before it becomes a clear signal.`

Assessment:

Those three messages do not belong together. A user should not see `Mission complete` and `Pattern confirmed` while the same card also says the evidence still needs more games.

Recommendation:

- enforce a single confidence/status source of truth across hero badge, progress module, and evidence sentence
- if evidence is still thin, use `Building signal` or `Needs focus games`, not `Mission complete`

### 3. Match history payload is large enough to become a real scaling concern

Severity: Medium

Observed:

- production authenticated `/matches`: `200`, about `986 KB` HTML
- local authenticated `/matches`: about `1.10 MB` HTML
- local response time during audit: about `2.6s`

Assessment:

The page still works with 100 games, but the server-rendered payload is already large. This is not a blocker today, but it will become one with a few hundred games.

Recommendation:

- paginate or window match cards
- reduce server-rendered detail per row
- lazy-expand heavy note/tag sections

### 4. Deck overview mixes deck-level and active-version metrics in a way that can confuse interpretation

Severity: Medium

Example from `Raging Bolt Lab`:

- `Games logged`: `55 games`
- `Current read`: `47% win rate across 30 games`

Assessment:

That appears to combine deck-total games with active-version-only performance. The information is useful, but the labeling invites misread.

Recommendation:

- label these explicitly as `Deck sample` and `Active version read`
- or keep both metrics but separate them visually

## 7. Minor issues found

### 1. Reward screen praise is slightly too strong when the mission is already complete

Observed reward snippet:

- `Game logged`
- `Your testing signal improved.`
- `This log pushed the current coaching mission forward.`
- `Mission complete`

Assessment:

The visual structure is good, but the language still sounds like every logged game materially improved the mission even when the mission is already complete and the log adds no quality signal.

Recommendation:

- use softer copy once a mission is already complete:
  - `Logged into the current review set`
  - `This keeps the matchup history fresh`

### 2. Guided match logging base page could not be fully interactively validated

Severity: Medium, but this is an audit limitation rather than a confirmed product bug.

What was verified:

- route loads authenticated
- success state renders
- reward screen strings render
- server actions and storage model already audited in prior work

What was not verified interactively here:

- 100 click-driven UI submissions
- step-by-step browser interaction
- true mobile touch behavior

### 3. Deck parser still accepts incomplete lists safely, but there is no hard 60-card enforcement signal in this audit

Observed:

- `Rogue Box` intentionally carries a `43`-card parsed total and `1` unresolved line
- the deck detail page handles that safely and clearly

Assessment:

This is a resilience win, but it also suggests the deck-version flow may still allow low-integrity lists unless validated elsewhere.

Recommendation:

- add a visible 60-card completeness hint or warning at version creation/edit time if not already present

## 8. UX strengths

- Conservative archetype detection feels trustworthy now.
  - `Rogue Box` correctly renders `No clear archetype detected`.
- Deck overview and detail no longer depend on live Pokemon TCG API enrichment to load.
- Matchups page is the strongest analytics surface right now.
  - It correctly elevates `Mega Greninja` as the top leak with actionable copy.
- The post-log reward state is much stronger visually than before.
  - It is concise, uses clearer hierarchy, and shows next action.
- Dashboard analytics are visible without digging.
  - matchup pressure, recent form, and version trend are surfaced on first load.

## 9. Retention / mission-system assessment

The product now has the right retention mechanic in principle:

- progress is tied to useful testing evidence
- missions use determinate progress
- the product avoids shallow XP/coin systems
- reward copy is immediate and coaching-oriented

Where it still falls short:

- the top mission does not always choose the strongest available next action
- status language can overclaim relative to the evidence shown
- the reward screen still leans slightly too celebratory when the mission is already complete

Net assessment:

The system feels much more like a testing coach than generic gamification, but the mission-selection logic still needs calibration before it becomes a truly trustworthy retention loop.

## 10. Analytics correctness assessment

### What looked correct

- Matchups aggregation surfaced the seeded strongest leak:
  - `Mega Greninja`: `5W / 19L / 2T`, `19%`, labeled `Actionable leak`
- Dragapult version improvement was visible:
  - `v2 Dusknoir Build` led at `73%` across `15` games
- Rogue deck remained low-confidence and parser-cautious:
  - `No clear archetype detected`
- Ties were retained and shown in records

### What looked questionable

- Dashboard mission selection did not prioritize the clearest actionable matchup leak
- Dashboard mission copy mixed `Mission complete`, `Pattern confirmed`, and `needs more games` in the same state

## 11. Performance issues

### Production authenticated route timings during audit

- `/dashboard`: about `2.2s`
- `/decks`: about `0.85s`
- `/matches`: about `0.87s`
- `/matchups`: about `0.82s`
- `/matches/new?success=1...`: about `1.34s`

### Local authenticated route timings during audit

- `/dashboard`: about `1.25s`
- `/decks`: about `0.77s`
- `/matches`: about `2.64s`
- `/matchups`: about `1.86s`
- `/matches/new`: about `1.21s`

Assessment:

- `/decks` reliability fix worked
- `/dashboard` is the heaviest meaningful user route
- `/matches` is the largest payload risk as data grows

## 12. Mobile issues

Interactive mobile viewport testing was not possible in this environment because browser automation was unavailable.

What can be said safely:

- no mobile-specific crash path was observed in code or authenticated HTML fetches
- the pages that are most likely to need a real phone pass next are:
  - `/matches/new`
  - `/dashboard`
  - `/decks`
  - `/matches`

This remains an incomplete audit area.

## 13. Recommended fixes by priority

1. Re-rank dashboard mission selection so the hero prefers the strongest actionable leak, not the most recent small-pattern tag.
2. Unify mission status language so `Mission complete`, `Pattern confirmed`, and `needs more games` cannot appear together.
3. Soften reward copy when a log lands outside the highest-value mission path or after the mission is already complete.
4. Reduce `/matches` payload size before the app is tested with larger real datasets.
5. Clarify deck overview metrics by separating deck-total sample from active-version sample.
6. Run a true mobile browser pass on `/matches/new`, `/dashboard`, `/decks`, and `/matches`.
7. Add stronger 60-card validation or warning in the version-creation/editing flow if that is not already enforced client-side.

## 14. Screenshots

No screenshots were captured. Browser automation and viewport screenshot tooling were not available in this session.

## 15. External tester readiness

Current recommendation:

- Ready for a small controlled external tester cohort after the mission-priority fix
- Not yet ideal for a broader external audience

Why:

- core routes are stable
- analytics are increasingly useful
- archetype handling is trustworthy
- matchups are genuinely actionable
- but the main retention surface still does not always tell the user the best next thing to test
