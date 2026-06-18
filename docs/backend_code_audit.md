# Backend Code Audit

Scope: all server-side code — pages, server actions, and shared server libs.
Auth, RLS, and schema are untouched. No behavioral changes.

---

## Files Audited

| File | Lines |
|------|-------|
| `src/lib/supabase-server.ts` | 40 |
| `src/lib/supabase-admin.ts` | 44 |
| `src/lib/supabase.ts` | 30 |
| `src/lib/supabase-config.ts` | 50 |
| `src/lib/session-coach.ts` | 1645 |
| `src/lib/review-analysis.ts` | 771 |
| `src/lib/coach-insights.ts` | 31 |
| `src/lib/community.ts` | 1670 |
| `src/lib/match-types.ts` | 215 |
| `src/lib/match-form.ts` | 114 |
| `src/lib/match-options.ts` | 69 |
| `src/lib/decklist.ts` | 639 |
| `src/lib/demo-data.ts` | 357 |
| `src/app/dashboard/page.tsx` | 183 |
| `src/app/matches/page.tsx` | 818 |
| `src/app/matches/new/actions.ts` | 136 |
| `src/app/matches/actions.ts` | 195 |
| `src/app/matches/[matchId]/edit/page.tsx` | 187 |
| `src/app/matchups/page.tsx` | 905 |
| `src/app/matchups/actions.ts` | 71 |
| `src/app/decks/page.tsx` | 683 |
| `src/app/decks/actions.ts` | 87 |
| `src/app/decks/[deckId]/page.tsx` | 1140 |
| `src/app/decks/[deckId]/actions.ts` | 377 |
| `src/app/review/page.tsx` | 878 |
| `src/app/profile/page.tsx` | 34 |
| `src/app/u/[handle]/page.tsx` | 410 |
| `src/app/community/actions.ts` | 239 |
| `src/app/auth/actions.ts` | 147 |

---

## Findings

| File / Route | Issue | Severity | Evidence | Recommended Fix | Fixed Now | Risk |
|---|---|---|---|---|---|---|
| `src/app/decks/page.tsx` L313-314 | Dead ternary — both branches return the same value | Low | `const x = cond ? listHealth.summary : listHealth.summary` | Remove ternary; assign directly | **Yes** | None |
| `src/app/dashboard/page.tsx` L122 | Dead alias — `filteredMatches = matchRows`, never filtered | Low | All downstream uses read `filteredMatches` which equals `matchRows` | Delete alias; use `matchRows` directly | **Yes** | None |
| `src/app/matches/new/actions.ts` | Missing revalidation paths after `logMatch` | Medium | `/matches` and `/review` not invalidated; those pages would show stale data until next navigation | Add `revalidatePath("/matches")` and `revalidatePath("/review")` | **Yes** | None |
| `src/app/matches/actions.ts` `revalidateMatchViews()` | Missing `/review` revalidation | Medium | Edit/delete match did not invalidate review page | Add `revalidatePath("/review")` | **Yes** | None |
| `src/app/matchups/page.tsx` L206 | User-facing internal jargon: "Actionable leak" | Low | `getHeadlineSignal()` returned "Actionable leak" for sub-45% matchup | Replace with "Priority weakness" | **Yes** | None |
| `src/app/dashboard/page.tsx` | Sequential independent queries: decks → matches → profile | Medium | 3 serial round trips; none depend on each other | Parallelize with `Promise.all` | **Yes** | None |
| `src/app/review/page.tsx` | Sequential independent queries: decks → matches | Medium | 2 serial round trips | Parallelize with `Promise.all` | **Yes** | None |
| `src/app/matchups/page.tsx` | Sequential independent queries: decks → matches → notes | Medium | 3 serial round trips | Parallelize with `Promise.all` | **Yes** | None |
| `src/app/decks/page.tsx` | Sequential independent queries: decks → matches | Medium | 2 serial round trips | Parallelize with `Promise.all` | **Yes** | None |
| `src/app/matches/page.tsx` | Sequential independent queries: decks → allMatchRowsForCoach | Medium | 2 serial round trips; neither depends on the other | Parallelize with `Promise.all` | **Yes** | None |
| `src/app/matches/[matchId]/edit/page.tsx` | Sequential queries after ownership check: decks → previousMatches | Low | After match is fetched and ownership verified, decks and previousMatches are fetched sequentially though independent | Parallelize decks + previousMatches with `Promise.all` | **Yes** | None |
| `src/app/review/page.tsx` L459 | Null crash: `runnerUp?.openingRate !== null` passes when `runnerUp` is null | High | `null?.openingRate` = `undefined`; `undefined !== null` = `true`; then `runnerUp.openingRate` throws | Add explicit `runnerUp !== null` guard before property access | **Yes** | None |
| `src/app/matchups/page.tsx` early-warning section | CSS Grid stretches compact card to match taller sibling | Low | Default `align-items: stretch` on the `xl:grid-cols-[...]` container | Add `xl:items-start` to the grid container | **Yes** | None |
| `src/lib/match-form.ts` | `isOneOf` helper duplicated from `src/lib/match-types.ts` | Low | Both files define an identical `isOneOf<T extends readonly string[]>` function | Extract to shared util (requires new file) | No | Low |
| Multiple pages | `parseDateStart` / `parseDateEnd` duplicated in `matches/page.tsx` and `matchups/page.tsx` | Low | Copy-paste of identical date parsing logic | Extract to `src/lib/date-utils.ts` | No | Low |
| Multiple pages | `getDeckVersion` / `getDeckName` duplicated in `matches/page.tsx`, `matchups/page.tsx`, `review/page.tsx`, `community.ts` | Low | 4 copies of Supabase join resolution helpers | Extract to `src/lib/deck-helpers.ts` | No | Low |
| Multiple files | `getMostCommonTag` duplicated in `session-coach.ts`, `review-analysis.ts`, `review/page.tsx` | Low | 3 independent implementations of frequency counting | Extract to shared util | No | Low |
| `src/lib/decklist.ts` L539-554 | `analyzeDeckList` iterates `cards` four times (pokemon/trainer/energy counts) | Low | Four separate `.filter().reduce()` chains | Compute all counts in one pass | No | Low |
| `src/app/decks/page.tsx` | `getDecklistHealth()` and `versionPrompt` recomputed in JSX loop (already computed in `deckSummaries.map`) | Low | Two passes over the same data; pure function so no correctness issue | Store results on `DeckSummary` type | No | Low |
| `src/lib/demo-data.ts` | `getDemoMatchups()` called twice inside `getDemoInsights()` (via `getBiggestStatisticalLeak` and `getLowConfidenceWatchlist`) | Low | Negligible — static in-memory data with no I/O | Memoize or compute once | No | None |
| `src/lib/supabase-admin.ts` | Module-level singleton `adminClient` | Low | Acceptable for long-lived Node.js processes; noted for awareness | No change needed for current deployment | No | None |
| `src/lib/community.ts` `buildPublicProfileStats()` | Already uses `Promise.all` for decks+matches; versions fetched after (correct — needs deckIds) | — | No issue; pattern is correct | No change needed | — | — |
| `src/app/u/[handle]/page.tsx` | Already uses `Promise.all` for stats+counts+reports+follow+reactions | — | No issue; all queries parallelized correctly | No change needed | — | — |
| `src/app/decks/[deckId]/page.tsx` | deck → versions → matches sequential; versions needs deck.id, matches needs version IDs | — | Correct ordering — dependency chain prevents parallelization | No change needed | — | — |

---

## Auth / RLS Verification

All mutations perform explicit ownership checks before writing:

| Action | Check |
|---|---|
| `logMatch` | Verifies deck version ownership via join on `decks.user_id` |
| `updateMatch` / `deleteMatch` | Filters by `matches.user_id` before update/delete |
| `createDeckVersion` / `updateDeckVersion` / `deleteDeckVersion` | Verify deck ownership via `decks.user_id` |
| `saveMatchupNote` | Filters by `user_id` before upsert |
| `community/actions.ts` | Uses `createAdminSupabaseClient()` only for cross-user data; user-scoped writes use the authenticated client |

No auth checks were weakened or removed.

---

## Changes Applied

| File | Change |
|---|---|
| `src/app/decks/page.tsx` | Removed dead ternary; parallelized decks+matches |
| `src/app/dashboard/page.tsx` | Removed dead `filteredMatches` alias; parallelized decks+matches+profile |
| `src/app/review/page.tsx` | Parallelized decks+matches; fixed null crash on `runnerUp.openingRate` |
| `src/app/matchups/page.tsx` | Fixed "Actionable leak" label; parallelized decks+matches+notes; fixed early-warning card stretch |
| `src/app/matches/page.tsx` | Parallelized decks+allMatchRowsForCoach |
| `src/app/matches/[matchId]/edit/page.tsx` | Parallelized decks+previousMatches after ownership check |
| `src/app/matches/new/actions.ts` | Added `/matches` and `/review` revalidation |
| `src/app/matches/actions.ts` | Added `/review` to `revalidateMatchViews()` |

---

## Not Fixed (Require Larger Refactor)

| Issue | Reason Deferred |
|---|---|
| `isOneOf` duplication | Requires new shared utility file; no behavioral issue |
| `parseDateStart`/`parseDateEnd` duplication | Requires new shared utility file |
| `getDeckVersion`/`getDeckName` duplication | Requires new shared utility file; community.ts uses slightly different shape |
| `getMostCommonTag` duplication | Each implementation handles slightly different input shapes |
| `analyzeDeckList` multi-pass | Pure in-memory; negligible cost |
| `getDecklistHealth`/`versionPrompt` recomputed in JSX | Requires extending `DeckSummary` type and audit of all consumers |
