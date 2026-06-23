# Pre-Beta Code Health

Scope: maintainability, duplication reduction, and safe refactors only.
No product behavior changes. No schema changes. No auth changes. No UI changes.

---

## Phase 1 — Shared Utility Cleanup

### 1. `isOneOf` type guard

**Problem:** Identical generic type guard defined privately in two files.

| File | Before |
|---|---|
| `src/lib/match-types.ts` | Private `function isOneOf(value: unknown, ...)` |
| `src/lib/match-form.ts` | Private `function isOneOf(value: string \| null, ...)` |

**Fix:** Created `src/lib/type-guards.ts` with a single exported `isOneOf<T>(value: unknown, options: T): value is T[number]`. Both files now import from there. The `match-form.ts` variant used `Boolean(value)` instead of `typeof value === "string"` — behaviorally identical for all inputs these functions receive (no empty-string options exist in the app).

**Files changed:** `src/lib/type-guards.ts` (new), `src/lib/match-types.ts`, `src/lib/match-form.ts`

---

### 2. Date parsing helpers

**Problem:** `parseDateStart` and `parseDateEnd` were defined identically in two page files.

| File | Before |
|---|---|
| `src/app/matches/page.tsx` | Private `parseDateStart` / `parseDateEnd` |
| `src/app/matchups/page.tsx` | Private `parseDateStart` / `parseDateEnd` |

**Fix:** Created `src/lib/date-utils.ts` exporting both. Each page now imports them. Exact same implementations — no behavior change.

**Files changed:** `src/lib/date-utils.ts` (new), `src/app/matches/page.tsx`, `src/app/matchups/page.tsx`

---

### 3. `getMostCommonTag` frequency helper

**Problem:** `review/page.tsx` had a local copy of `getMostCommonTag` that was byte-for-byte identical to the one in `review-analysis.ts`, and it already imported `ReviewMatch` from that module.

| File | Before |
|---|---|
| `src/lib/review-analysis.ts` | Private `getMostCommonTag(matches: ReviewMatch[], selector)` |
| `src/app/review/page.tsx` | Identical private copy |

**Fix:** Added `export` to `getMostCommonTag` in `review-analysis.ts`. `review/page.tsx` now imports it alongside `buildReviewAnalysis` and `ReviewMatch`. No new dependency created — the import already existed.

**Note on `session-coach.ts`:** That file has a `getMostCommonTag(values: string[])` with a different signature (flat array in, `{tag, count}` out) and different callsite pattern. It was left as a private helper in `session-coach.ts`. Forcing unification would require changing both the input shape and the return shape used across ~6 callsites inside that 1645-line file — high risk, no beta value.

**Files changed:** `src/lib/review-analysis.ts`, `src/app/review/page.tsx`

---

### 4. `getDeckVersion` / `getDeckName` helpers

**Decision: Not extracted.**

These helpers exist in four places:

| File | Local name | `deck_versions` shape |
|---|---|---|
| `src/app/matches/page.tsx` | `getDeckVersion`, `getDeckName` | `{ id, name, deck_id, decks: { id, name } \| ... }` |
| `src/app/matchups/page.tsx` | `getDeckVersion` | `{ id, name, deck_id }` (no nested `decks`) |
| `src/app/review/page.tsx` | `getDeckVersion`, `getDeckName` | `{ id, name, is_active, deck_id, decks: ... }` |
| `src/lib/community.ts` | `getDeckVersion`, `getDeckNameFromMatch` | `AdminMatchRow.deck_versions` — service-role shape, distinct from user-scoped shapes |

Each page defines its own `MatchRow` type locally, derived from its Supabase query's select string. The shapes are structurally similar but not identical (different fields present, `is_active` present in some, `decks` nested in some, different access patterns). A generic `resolveFirstOrSingle<T>(value: T | T[] | null): T | null` primitive would be safe to extract — but the three `getDeckName` callers still need file-local types to type-check the `.decks` navigation. The helper bodies would remain per-file wrappers. Net gain: one fewer line per file but more indirection. Deferred.

**Recommendation:** If the Supabase schema is eventually typed globally (e.g., via `supabase gen types`), these helpers can be collapsed then.

---

## Phase 2 — Oversized-File Audit

Files are large but monolithic for a reason: they contain related domain logic that depends on shared internal types and helpers. Splitting them requires careful extraction of those types first.

### `src/lib/session-coach.ts` (1645 lines)

**What could be extracted:**
- Mission generation logic (~300 lines around `buildMission` and `buildSessionMissionInsight`) — isolated concern
- Trend analysis helpers (`buildTrendCard`, `buildTurnOrderCard`, etc.) — another isolated concern
- `getMostCommonTag` / `getMostCommonValue` frequency primitives — small, no deps

**Why it would help:** The file has at least 4 independent analysis concerns in one module. A future contributor would need to read the whole file to find the right place.

**Risk level:** Medium. Many internal helpers are shared between the major functions. Splitting requires identifying exactly which helpers belong where.

**Recommendation:** After beta. Understand which coaching cards users interact with most first, then extract the relevant logic.

---

### `src/lib/community.ts` (1670 lines)

**What could be extracted:**
- `buildPublicProfileStats()` and its helpers (~400 lines) — read-only profile aggregation
- Report generation (`buildPublicReport`, `getPublicReport`, etc.) — separate concern from profile stats
- Follow/reaction logic — social graph, distinct domain

**Why it would help:** Three distinct concerns (profile stats, reports, social) are in one file. The admin client usage is the binding thread but not a reason to keep them together.

**Risk level:** Medium. Internal types like `AdminMatchRow` are shared; extracting requires promoting them to a shared types file first.

**Recommendation:** After beta. Safe once types are separated.

---

### `src/app/decks/[deckId]/page.tsx` (1140 lines)

**What could be extracted:**
- Deck version card UI components (currently inline JSX for version history, analysis panels)
- Version comparison logic

**Why it would help:** The server data fetching is ~100 lines; the rest is JSX. Extracting display components to `src/components/decks/` would let the page focus on data.

**Risk level:** Low. Next.js App Router pages can freely delegate JSX to client components. The server-side data flow stays in the page file.

**Recommendation:** Before or after beta — low risk, but not blocking. Defer until a deck UI iteration is planned.

---

### `src/app/matchups/page.tsx` (905 lines → ~870 after this pass)

**What could be extracted:**
- Filter + sorting logic (`filteredMatches`, `filteredMatchupGroups`, sort functions) — ~120 lines of pure computation
- Matchup group building logic (~80 lines)

**Why it would help:** The computation section (lines ~270–400) is long enough that a reader has to scroll past it to find the JSX.

**Risk level:** Low. All computation is pure functions with no side effects. Could be extracted to a `src/lib/matchup-analysis.ts` file.

**Recommendation:** Before beta if doing a refactor sprint. Not blocking.

---

### `src/app/review/page.tsx` (878 lines → ~860 after this pass)

**What could be extracted:**
- Turn-order signal computation and signal text generation (~80 lines around `openingRateLeader`, `runnerUp`)
- Version row computation (~80 lines inside the `.map()` call)

**Why it would help:** The page does significant inline analysis that belongs closer to `review-analysis.ts`.

**Risk level:** Low for extracting to the lib; medium for moving to a Client Component (would need `"use client"` boundary audit).

**Recommendation:** After beta. The correct long-term move is to push more of this into `review-analysis.ts` so the page becomes a thin data-fetch + render shell.

---

### `src/app/matches/page.tsx` (818 lines → ~795 after this pass)

**What could be extracted:**
- Filter application logic (~40 lines) — straightforward pure function
- Pagination computation (~30 lines) — reusable utility

**Why it would help:** Minor. The page is long mainly because of rich per-match JSX, not complex logic.

**Risk level:** Low.

**Recommendation:** After beta. Not blocking.

---

## Behavior-Change Statement

No product behavior was changed. All extractions are identical rewrites of existing logic into shared modules. ESLint, TypeScript, and all 62 E2E tests pass.

---

## Deferred Refactors

| Refactor | Why Deferred | When |
|---|---|---|
| `getDeckVersion`/`getDeckName` extraction | Per-query Supabase types differ per page; shared wrapper would lose type safety | After global Supabase types |
| `session-coach.ts` split | Internal type sharing makes extraction non-trivial | After beta; after user feedback on which signals matter |
| `community.ts` split | `AdminMatchRow` shared type needs extraction first | After beta |
| `decks/[deckId]/page.tsx` JSX extraction | Low risk but not blocking | With next deck UI pass |
| `matchup-analysis.ts` extraction | Useful but not urgent | Before beta if time allows |
| Supabase global types (`supabase gen types`) | Would enable proper type sharing; requires Supabase CLI setup | After beta |

---

## Beta Readiness

**Verdict: Ready for beta.**

The codebase is functional, tested, and has no known correctness bugs. The duplications that existed before this pass were low-risk (no behavior divergence across copies). The backend query performance improvements from the previous audit (all major pages now parallel-fetch independent queries) are in place.

The remaining large files are manageable — each is a self-contained domain module, not a mixed bag. A beta cohort should not surface any of the deferred refactors as user-facing issues.

**Known technical debt entering beta (non-blocking):**
- `getDeckVersion`/`getDeckName` still copied in 4 places (identical behavior, no divergence risk)
- `getMostCommonTag` in `session-coach.ts` still private (different signature, no shared caller)
- Three large lib files (~1600 lines each) that would benefit from splitting in a future sprint
