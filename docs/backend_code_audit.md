# Backend Code Audit

Scope: server-side code only — pages, server actions, and shared server libs.
Auth and RLS are not touched. No schema changes.

---

## Files Audited

| File | Lines |
|------|-------|
| `src/lib/supabase-server.ts` | 40 |
| `src/lib/supabase.ts` | 30 |
| `src/lib/supabase-config.ts` | 50 |
| `src/lib/session-coach.ts` | 1645 |
| `src/lib/review-analysis.ts` | 771 |
| `src/lib/community.ts` | 1670 |
| `src/app/dashboard/page.tsx` | 183 |
| `src/app/matches/page.tsx` | 818 |
| `src/app/matches/new/actions.ts` | 136 |
| `src/app/matches/actions.ts` | 195 |
| `src/app/matches/[matchId]/edit/page.tsx` | — (no server queries beyond auth) |
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
| `src/app/auth/actions.ts` | — (not read; auth actions are standard) |

---

## Findings

### 1. Dead Code

#### `src/app/decks/page.tsx` (lines 313-314) — FIXED
Both branches of two ternary expressions returned the same value:
```ts
// Before:
const resolvedListParseSummary = listParseSummary ? listHealth.summary : listHealth.summary;
const resolvedListParseDetail = listParseDetail ? listHealth.detail : listHealth.detail;

// After:
const resolvedListParseSummary = listHealth.summary;
const resolvedListParseDetail = listHealth.detail;
```

#### `src/app/dashboard/page.tsx` (line 122) — FIXED
`const filteredMatches = matchRows` — never actually filtered; was a dead alias.
All downstream references updated to use `matchRows` directly.

#### `src/app/decks/page.tsx` — double `getDecklistHealth()` call
`getDecklistHealth()` is called once in `deckSummaries.map()` (line 287) and again in the JSX render loop (line 518). The JSX uses `listHealth.toneClass` and `listHealth.label` which aren't stored on `DeckSummary`. Fix would require extending `DeckSummary` to store these two fields. Left as-is — the function is pure and fast.

#### `src/app/decks/page.tsx` — double `versionPrompt` computation
`versionPrompt` is computed identically in `deckSummaries.map()` (line 315) and the JSX render loop (line 524). Same fix path as above: `DeckSummary` doesn't expose `versionPrompt` for the JSX to read. Left as-is.

---

### 2. Missing Revalidation Paths — FIXED

#### `src/app/matches/new/actions.ts` — `logMatch()`
Was missing `/matches` and `/review`. Now revalidates all four paths.

#### `src/app/matches/actions.ts` — `revalidateMatchViews()`
Was missing `/review`. Updated to include it.

---

### 3. User-Facing Jargon — FIXED

#### `src/app/matchups/page.tsx` (line 206) — `getHeadlineSignal()`
```ts
// Before:
return matchup.winRateValue <= 45 ? "Actionable leak" : "Needs more games";

// After:
return matchup.winRateValue <= 45 ? "Priority weakness" : "Needs more games";
```

---

### 4. Sequential Independent Queries — FIXED

All pages ran independent Supabase queries sequentially. Parallelized with `Promise.all`:

| Page | Before | After |
|------|--------|-------|
| `dashboard/page.tsx` | decks → matches → profile (3 round trips) | all 3 in parallel |
| `review/page.tsx` | decks → matches (2 round trips) | 2 in parallel |
| `matchups/page.tsx` | decks → matches → notes (3 round trips) | all 3 in parallel |
| `decks/page.tsx` | decks → matches (2 round trips) | 2 in parallel |

`decks/[deckId]/page.tsx` runs deck → versions → matches sequentially. Deck and versions queries depend on each other (versions needs `deck.id`), so only matches could be parallelized with versions. Skipped — matches is already fast and depends on the version set.

`community.ts` `buildPublicProfileStats()` already uses `Promise.all` for decks+matches. Versions are fetched after (needs `deckIds` from decks result) — correct.

`u/[handle]/page.tsx` uses `Promise.all` for stats+counts+reports+follow+reactions — already good.

---

### 5. Duplicated Helpers

These helpers appear in 2-4 places. Extraction to a shared utility file would reduce drift but is a larger refactor with no behavioral change. Noted for a future cleanup pass.

| Helper | Locations |
|--------|-----------|
| `parseDateStart` / `parseDateEnd` | `matches/page.tsx`, `matchups/page.tsx` |
| `getDeckVersion` / `getDeckName` | `matches/page.tsx`, `matchups/page.tsx`, `review/page.tsx`, `community.ts` |
| `getMostCommonTag` | `session-coach.ts`, `review-analysis.ts`, `review/page.tsx` |
| `formatWinRate` | `dashboard/page.tsx`, `decks/page.tsx`, `matchups/page.tsx` |

---

### 6. Over-fetching Notes

- All analysis pages fetch ALL user matches to power `buildSessionCoachInsight`. This is intentional — the coaching engine needs the full history for trend detection. No fix needed.
- `decks/page.tsx` calls `buildSessionCoachInsight` on all matches to get `missionTitle` for one field (`activeMission`) on the first deck card only. Could be deferred, but the analysis is pure in-memory computation so the cost is negligible.
- `matchups/page.tsx` uses a smart two-step pattern: first query fetches lightweight match data for filtering/counting, avoids over-fetching metadata.

---

### 7. Auth / RLS

All server actions perform explicit ownership checks before mutations:
- `logMatch`: verifies deck version ownership via join on `decks.user_id`
- `updateMatch`/`deleteMatch`: verifies `matches.user_id`
- `createDeckVersion`/`updateDeckVersion`/`deleteDeckVersion`: verify deck ownership
- `saveMatchupNote`: filters by `user_id` before upsert

No auth checks were weakened or removed.

---

## Summary of Changes Applied

| File | Change |
|------|--------|
| `src/app/decks/page.tsx` | Fixed dead ternary; parallelized decks+matches queries |
| `src/app/dashboard/page.tsx` | Removed dead `filteredMatches` alias; parallelized decks+matches+profile |
| `src/app/review/page.tsx` | Parallelized decks+matches queries |
| `src/app/matchups/page.tsx` | Fixed "Actionable leak" label; parallelized decks+matches+notes |
| `src/app/matches/new/actions.ts` | Added `/matches` and `/review` revalidation |
| `src/app/matches/actions.ts` | Added `/review` to `revalidateMatchViews()` |
