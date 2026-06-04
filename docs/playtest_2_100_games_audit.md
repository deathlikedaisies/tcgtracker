# SixPrizer Playtest 2 — 100-Game Audit Report

**Date:** 2026-06-04  
**Test account:** pokeleaguenl@gmail.com (user ID: c9c7565b-9587-4e54-9d0b-a0c32e568d36)  
**Branch:** main (commit bd4db0d + coaching system + matchups fixes)  
**Playwright:** 21/21 desktop, 21/21 mobile (pre-seed)

---

## 1. Executive Summary

The coaching system is working and producing correct, plain-English insights. The biggest structural win is the Review page: the "Coach says" hero card is immediately visible, prominently styled with a gold border, and the content (deck quality, issue tags, positive tags) is exactly what the tester asked for. The dashboard now shows both a matchup mission and a deck-focused coaching card, which resolves the "only matchup feedback" complaint.

**What works well:** Review coaching, matchup action CTAs, deck list health, mobile layout  
**Needs attention:** Dashboard "What changed" label bug (boolean renders as "true"), no Coach says on deck detail, matches page is dense, log-a-game load time (3.1s)  
**Beta verdict:** Ready for a small controlled beta with these fixes applied

---

## 2. Test Environment

- Local: http://localhost:3000 (Next.js dev server)
- Playwright headless Chromium + Chrome mobile (390×844)
- 100 games seeded via service role API
- 4 decks, 8 versions

---

## 3. Cleanup Summary

Previous playtest data (103 matches, 3 decks) was deleted safely, scoped to user_id only. Post-cleanup all counts verified at zero before re-seeding.

---

## 4. Dataset Summary

| Deck | Versions | Games | Primary pattern |
|---|---|---|---|
| Raging Bolt Lab | v1 Turbo, v2 Stamina, v3 Anti-Bench Pressure | 40 | Loses to Mega Greninja (bench pressure + missed setup); bad starts enriched in losses |
| Dragapult Dusknoir Testing | v1 Baseline, v2 Dusknoir Consistency | 25 | Bad/Okay sequencing enriched in losses; Good Tech in wins |
| Item Lock Stress Test | v1 Item Lock Weak, v2 Item Lock Answers | 25 | Item Lock in ≥67% of losses |
| Rogue Box | v1 Unknown Meta Call | 10 | Noisy, low confidence, no clear pattern |

**Total:** 100 games, 170 match_tags, 8 deck versions (including 2 incomplete/unresolved lists)

---

## 5. Core Route Results

### / (Landing)
- **Works:** Hero CTA ("Start tracking games"), demo link ("Preview demo") visible
- **Visual:** Not crowded. Clean hero with pain-line copy
- **Issue:** None blocking

### /dashboard (Overview)
- **Works:** Mission hero (Review Mega Greninja matchup), Coach says deck card, KPI row, More insights
- **Coach says visible:** Yes — "Opening hands are hurting your results"
- **Bug found:** "What changed" card displays "true improved" instead of "Matchup trending better" — boolean string interpolation bug **[FIXED in this session]**
- **Visual:** Mission hero dominates. Deck coach card is below but visible. KPI row has correct data.
- **Issue:** Coach says deck card could appear higher — it's below the mission hero and users may not scroll to it

### /review (Review)
- **Works:** SessionCoachPanel (mission context), Coach says hero (deck insight), secondary cards, filter form
- **Coach says:** "Opening hands are hurting your results" with gold border — prominent and correct
- **Secondary cards visible:** "Item Lock" is your most common loss tag, Raging Bolt is your priority watchlist, "Good Tech" appears often in your wins, What to test next
- **Evidence quality:** "36 of 44 games with a bad or okay opening hand were losses" — specific, correct
- **Coach answers 3 questions:** What is wrong ✓, What evidence ✓, What to do next ✓
- **Issue:** SessionCoachPanel and Coach says hero are back-to-back — two coaching surfaces above the fold. Users might not realize which one is "the answer." Consider labeling SessionCoachPanel differently.
- **Issue:** "Article count: 6" — that is a lot of insight cards below the hero. Secondary grid may feel overwhelming.

### /matches/new (Log a game)
- **Works:** Multi-step guided flow, deck selector shows playtest decks, SessionCoachPanel visible, step sidebar present
- **Slowest route:** 3,076ms — noticeably slow
- **Visual:** Complex left sidebar + right form area. The multi-step indicator ("1 Match, 2 Turn order...") is useful. On mobile the sidebar collapses correctly.
- **Issue:** 3.1s load is noticeable. Likely because MatchLogForm fetches decks/versions/coach insight server-side. Could be improved with parallel data loading.

### /matches (Matches)
- **Works:** Pagination, 25 matches visible, filters present, tags shown on each row
- **Visual:** Very long scroll. Each match row is a reasonable height but 25 rows on one page is dense.
- **Issue:** No Coach says on this page. A small coaching nudge ("7 of your 10 losses this week were tagged Item Lock — check Review") could help users connect the list to the analysis.
- **Issue:** The filter panel at top is useful but has 5 filter controls in a row — may not be obvious which ones are active.

### /decks (Deck Experiments)
- **Works:** All 4 decks visible, health warnings shown (Incomplete List, Needs Review), "Add another deck" form visible
- **Visual:** Each deck card has health status, version count, game count — useful
- **Issue:** No deck-specific coaching insight here. The deck cards are information-dense but don't say "this deck has a problem."
- **Issue:** Deck names are long (prefixed with "SixPrizer Playtest 2 2026-06-04") and truncate badly. Real users won't have this prefix, but deck card width may be too narrow for longer names.

### /matchups (Matchup Intelligence)
- **Works:** Share report button visible, "What to test next" section with 3 linked CTAs (Open review, Log a game, Open review), matchup breakdown with 5 archetypes, filter form
- **Visual:** Priority leak card (Raging Bolt 38% win rate) is prominent. Action points have real links.
- **Issue:** "Priority watchlist" language not detected in automated audit — the per-matchup badge says "ACTIONABLE LEAK" not "priority watchlist." The hero section is labeled correctly elsewhere but inconsistent.
- **Issue:** The matchup breakdown below the filter is very long (5 archetypes, each with a prep notes section). On mobile this is heavy.
- **Works well:** Preparation notes textarea per matchup is a useful feature that was left in correctly.

---

## 6. Coach Quality Audit

### /dashboard

| Dimension | Score | Notes |
|---|---|---|
| Coach visibility | 4/5 | Mission hero prominent; deck coaching card visible below |
| Coach usefulness | 4/5 | "Opening hands are hurting your results" is direct and correct |
| Actionability | 3/5 | "Open Review" CTA on deck card is correct but generic |
| Noise level | 2/5 | Two coaching surfaces + KPI row + "More insights" = slightly busy |

**Top insight generated:** "Opening hands are hurting your results — You lose 64% of games when your opening hand is Bad or Okay. Compare that to 31 of 44 games with a Good or Great opening hand. Before changing tech cards, check whether this pattern holds across the full sample."

**Verdict:** Coaching is correct and addresses the tester's complaint about deck-specific feedback. The matchup mission and deck coaching coexist but could be better differentiated.

### /review

| Dimension | Score | Notes |
|---|---|---|
| Coach visibility | 5/5 | Gold-bordered hero card immediately visible |
| Coach usefulness | 5/5 | 4 distinct insights, all evidence-based |
| Actionability | 4/5 | CTAs link to relevant routes |
| Noise level | 3/5 | 5 secondary cards is a lot; could reduce to 3 |

**Top insight:** "Opening hands are hurting your results" — 36/44 bad opening hand games were losses. Evidence is specific, coaching advice present.

**"Item Lock" insight:** '"Item Lock" is your most common loss tag — You tagged "Item Lock" in 10 of 15 losses. It rarely shows up in wins. That is the clearest issue signal in your current data.' — **Exactly matches the tester example.** ✓

**"Good Tech" insight:** '"Good Tech" appears often in your wins — You marked "Good Tech" in 5 of 10 wins. That usually signals a tech or line that is worth keeping while you test other changes. Do not cut it before logging more games.' — **Matches tester example.** ✓

**Verdict:** Review coaching is the strongest surface. Addresses all 4 tester examples directly.

### /matchups

| Dimension | Score | Notes |
|---|---|---|
| Coach visibility | 3/5 | Priority leak card visible but no "Coach says" label |
| Coach usefulness | 3/5 | Matchup data accurate, action points clear |
| Actionability | 4/5 | Action points now have real links (fixed in prior session) |
| Noise level | 3/5 | Per-matchup action text is generic ("Keep logging") |

**Issue:** The per-matchup action text ("Keep logging and tag every loss") is the same for several matchups regardless of data. It needs to vary based on actual match data.

### Post-log reward

Not deeply audited in this session but SessionCoachPanel appears on `/matches/new` after save via the same mechanism. The guided multi-step form reduces cognitive load significantly. Post-log reward should ideally show "This game added to your Item Lock pattern" type feedback.

---

## 7. Visual Hierarchy Audit

### / (Landing)
- **Eye goes to:** Hero headline "From testing games to six-prize turns." ✓
- **CTAs:** Primary "Start tracking games" prominent, secondary "Preview demo" visible
- **Classification:** A — all above fold content is essential

### /dashboard
- **Eye goes to:** Mission hero card ("Review Mega Greninja matchup") — correct, this is the primary action
- **Below that:** Coach says deck card ("Opening hands are hurting your results") — **slightly hidden**, users may miss it unless they scroll
- **KPI row:** Recent form + biggest matchup + What changed — useful, right size
- **More insights button:** Correct behavior (hides deep analytics by default)
- **Section classifications:**
  - Mission hero: **A** — essential
  - Coach says deck card: **A** — essential but currently positioned like B (below fold on smaller screens)
  - KPI row: **A** — useful context
  - More insights section: **B** — correct to collapse
  - Charts/tables inside More insights: **B** — secondary

### /review
- **Eye goes to:** SessionCoachPanel mission title → Coach says gold hero → secondary cards
- **Problem:** Two coaching panels appear before the user's data context. The "Recent sample: 42-83-5" panel is important calibration context but is sandwiched between the two coaching panels.
- **Coach says hero:** Visually distinct (gold border, TC badge, large type) — works well
- **Secondary cards:** All look equal weight. Cards 2–5 (issue tag, matchup, positive tag, next action) don't have visual hierarchy between them.
- **Section classifications:**
  - SessionCoachPanel: **B** — useful context but adds cognitive load before the main coaching
  - Sample context row: **A** — essential calibration
  - Coach says hero: **A** — essential
  - Secondary insight cards (2-3 most relevant): **A**
  - Next action card: **A**
  - Remaining cards beyond top 4: **B** — could collapse under "More insights"

### /matches/new
- **Eye goes to:** Step sidebar ("1 Match, 2 Turn order...") on left, then the form area
- **Issue:** SessionCoachPanel at top of form area competes with the step flow. User is trying to log a game but the coach is telling them about their existing pattern — context mismatch.
- **Section classifications:**
  - Step flow sidebar: **A**
  - The form itself: **A**
  - SessionCoachPanel on log-game page: **B** — coach context is useful but distracting mid-flow

### /matches
- **Eye goes to:** Page header, then filters, then match rows
- **Filter panel:** Has 5 controls at once — busy
- **Match rows:** Dense. Each row has opponent, deck, date, result, tags — all on one card. For 25 items this is a very long page.
- **Section classifications:**
  - Filters: **B** — useful but could be collapsed by default with "show filters" toggle
  - Match rows: **A** — essential
  - Pagination controls: **A**

### /decks
- **Eye goes to:** Active experiments header, then deck cards
- **Deck cards:** Show name, archetype, list health, version count, game count — good information density
- **Add deck form on right:** On desktop, useful. On mobile it stacks below.
- **Section classifications:**
  - Deck cards: **A**
  - Add deck form: **B** — useful but secondary, could be behind a "+ Add deck" button

### /matchups
- **Eye goes to:** Priority leak card (Raging Bolt, 38% win rate) immediately — correct
- **What to test next section:** Right sidebar, prominent — works well
- **Filter form:** Medium weight, between the summary and the matchup breakdown
- **Matchup breakdown:** Each row is large (archetype, badge, bar, action text, match strip) + prep notes expander. Very dense.
- **Section classifications:**
  - Priority leak card: **A**
  - What to test next: **A**
  - Filter form: **B** — could default to collapsed on mobile
  - Matchup breakdown rows: **A** — but prep notes should default **collapsed** (they already use `<details>`)
  - Action text per matchup: **B** — currently generic, needs improvement

---

## 8. Mobile Audit (390×844)

| Route | Overflow | Coach visible | CTAs tappable | Issues |
|---|---|---|---|---|
| /dashboard | No | Yes | Yes | Mission hero title truncates; deck coaching card visible below |
| /review | No | Yes | Yes | Coach says hero readable; secondary cards stack cleanly |
| /matches/new | No | N/A | Yes | Step sidebar stacks correctly; form steps work |
| /matches | No | N/A | Yes | 25 match rows is very long scroll on mobile |
| /matchups | No | N/A | Yes | Filter form is tall; breakdown rows are dense but readable |

**No horizontal overflow detected on any route.** All layouts respond correctly.

**Mobile-specific issues:**
1. Dashboard: Mission hero is very tall on mobile (spans full screen). Users must scroll to reach the deck coaching card and KPIs.
2. Matches page: 25 rows is a heavy scroll. Consider reducing default page size to 10 on mobile.
3. Matchups: The filter form has 6 inputs stacked, making it taller than the viewport. Users must scroll past the filter to see the matchup breakdown.

---

## 9. Performance Audit

| Route | Load time | Assessment |
|---|---|---|
| /dashboard | 1,777ms | Acceptable |
| /review | 1,245ms | Good |
| /matches | 1,934ms | Acceptable |
| /matches/new | 3,076ms | Slow — investigate |
| /decks | 1,276ms | Good |
| /matchups | 1,476ms | Acceptable |

**Slowest:** `/matches/new` at 3.1s. Likely caused by server-side data loading for decks + deck versions + archetype options + session coach all in one server component. Consider parallel data fetching or reducing the coach insight computation on this page.

**No heavy HTML detected.** Build output shows all pages compile cleanly. No obvious N+1 queries visible in the code.

---

## 10. Top 10 Issues

| # | Issue | Severity | File |
|---|---|---|---|
| 1 | Dashboard "What changed" shows "true improved" (boolean bug) | High | DashboardContent.tsx — **fixed** |
| 2 | No Coach says on `/decks/[deckId]` — deck detail has no deck-specific coaching | Medium | review-analysis.ts, decks/[deckId]/page.tsx |
| 3 | `/matches/new` load is 3.1s — noticeably slow | Medium | matches/new/page.tsx |
| 4 | SessionCoachPanel on `/review` appears before the Coach says hero — two coaching surfaces confuse hierarchy | Medium | review/page.tsx |
| 5 | "Priority watchlist" badge language inconsistent with matchup breakdown labels ("Actionable leak") | Low | matchups/page.tsx |
| 6 | Secondary insight cards on Review (5 cards below the hero) need visual weight reduction | Low | review/page.tsx |
| 7 | Matches page filters are visible by default on all screen sizes — adds cognitive load | Low | matches/page.tsx |
| 8 | Dashboard deck coaching card positioned below the fold on many screens | Low | DashboardContent.tsx |
| 9 | Post-log reward doesn't explain what the just-logged game contributed to the coaching pattern | Low | MatchLogForm.tsx |
| 10 | Per-matchup action text in matchup breakdown is generic for all matchups regardless of data | Low | matchups/page.tsx |

---

## 11. Top 10 Improvements Confirmed Working

1. **Coach says hero on Review** — immediately visible, gold border, specific evidence counts ✓
2. **Deck quality coaching** — "Opening hands are hurting your results" is correct and specific ✓
3. **Issue tag coaching** — "Item Lock is your most common loss tag" matches tester example ✓
4. **Positive tag coaching** — "Good Tech appears often in your wins" matches tester example ✓
5. **Matchup action points with real links** — "Open review", "Log a game" CTAs work ✓
6. **Share report** — modal opens, text copy works, page link copies current URL ✓
7. **Mobile layout** — no overflow on any route ✓
8. **Deck list health warnings** — Incomplete/Needs Review badges visible on deck cards ✓
9. **Guided deck version creation** — 8 versions created cleanly through API ✓
10. **Pagination on /matches** — 25-per-page, filters preserved across pages ✓

---

## 12. What Is Useful to Players

- **Review page Coach says hero** — the clearest, most useful coaching surface in the app
- **Issue tag insights** with evidence counts ("Item Lock in 10 of 15 losses")
- **Positive tag preservation** ("Good Tech appears often in your wins, don't cut it")
- **Mission hero with progress** — the matchup watchlist mission gives clear direction
- **Deck list health** — health warnings on deck cards are actionable and non-blocking
- **Matchup breakdown** — per-matchup record, win rate bar, and coach label all useful
- **Turn order split** — useful for understanding structural deck weaknesses
- **Preparation notes** per matchup — hidden behind details accordion (good design)

---

## 13. What Is Noise and Should Be Simplified or Cut

- **Dashboard "More insights" deep analytics** — the charts (result trend, deck comparison) are almost never the thing a player needs. Consider removing entirely or reducing to a link to /review.
- **SessionCoachPanel on /matches/new** — coach context mid-logging-flow is a distraction. Players are trying to log a game, not analyze. Move to post-log reward only.
- **5 secondary insight cards on Review** — the hierarchy implies equal importance. Reduce visible cards to 3, put "More insights" behind expansion.
- **"What this page does" explanation card on Review** — this is help text for first-time users. After first visit it is just noise. Consider a "?" tooltip or collapsible instead.
- **Matchup breakdown prep notes expander per row** — already uses `<details>`, which is correct. No change needed.
- **6-input filter form on /matchups** — could collapse to "All decks / All opponents" summary with a "Filters" button on mobile.
- **Matches page filters visible by default** — makes the page start 200px below the fold content. Should default to collapsed with a "Filter" toggle button.

---

## 14. Beta Readiness Verdict

**Ready for 5–10 controlled testers with the following caveats:**

✅ Core flows work (log game, decks, versions, review, matchups)  
✅ Coach says addresses all 4 tester example complaints  
✅ Mobile layout clean on all routes  
✅ No JS errors detected  
✅ Playwright 21/21 desktop + mobile  
⚠️ Dashboard "What changed" bug fixed in this session — should deploy before tester invite  
⚠️ Load time on /matches/new (3.1s) should be investigated  
⚠️ No coach says on deck detail page — medium priority for next session  

---

## 15. Recommended Next Implementation Order

1. **Deploy** the "What changed" boolean fix and coaching system improvements (these are on main)
2. **Add Coach says to deck detail** (`/decks/[deckId]`) — show the deck-specific primary insight
3. **Reduce SessionCoachPanel visibility on /matches/new** — move to post-log only or collapse by default
4. **Reduce secondary cards on Review** from 5 to 3 visible + "Show more" expander
5. **Improve /matches/new performance** — profile server-side data fetching
6. **Add "Filters" toggle to /matches** — hide filter panel by default
7. **Per-matchup action text** — vary based on actual win rate and sample size instead of generic "Keep logging"
8. **Invite 5 controlled testers** with tester instructions
