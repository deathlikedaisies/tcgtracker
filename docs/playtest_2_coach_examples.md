# SixPrizer Playtest 2 — Coach Output Examples

**Generated from:** 100-game playtest dataset  
**Test account:** pokeleaguenl@gmail.com  
**Date:** 2026-06-04

---

## Good Coach Messages (generated correctly)

### Deck quality — opening hand

> **"Opening hands are hurting your results"**
>
> You lose 64% of games when your opening hand is Bad or Okay in your recent games. Compare that to 31 of 44 games with a Good or Great opening hand. Before changing tech cards, check whether this pattern holds across the full sample.
>
> **Evidence:** 36 of 44 games with a bad or okay opening hand were losses.

**Assessment:** Excellent. Specific percentage, comparison group included, cautious "check whether" framing. Matches tester example ("You seem to lose a lot of games where you have a bad or okay start") closely. ✓

---

### Issue tag — Item Lock

> **'"Item Lock" is your most common loss tag'**
>
> You tagged "Item Lock" in 10 of 15 losses. It rarely shows up in wins. That is the clearest issue signal in your current data.
>
> **Evidence:** 10 of 15 losses tagged with "Item Lock".

**Assessment:** Excellent. Exact counts, win comparison included, no overclaiming. Matches tester example ("You lose a lot to Item Lock because you tagged Item Lock in 60% of games that you've lost") closely. ✓

---

### Positive tag — Good Tech

> **'"Good Tech" appears often in your wins'**
>
> You marked "Good Tech" in 5 of 10 wins. That usually signals a tech or line that is worth keeping while you test other changes. Do not cut it before logging more games.
>
> **Evidence:** 5 of 10 wins tagged with "Good Tech".

**Assessment:** Excellent. The preservation advice ("Do not cut it before logging more games") is exactly the right coaching framing. Matches tester example ("You have marked Good Tech a lot of times") closely. ✓

---

### Matchup leak

> **"Raging Bolt is your priority watchlist"**
>
> Raging Bolt has your worst win rate in your recent games. Keep logging normally — when this matchup appears, tag what breaks first instead of changing the list based on feel.
>
> **Evidence:** 6-11-1 across 18 games.

**Assessment:** Good. Win rate context is clear. The framing "keep logging normally" correctly reflects priority watchlist mode (can't choose the opponent). The evidence includes ties which is correct. ✓

---

### Sequencing quality

> **"Sequencing issues are costing you games"**
>
> You lose 70% of games when your sequencing is Bad or Okay. Compare that to 2 of 9 games with Good or Great sequencing. Before changing tech cards, check whether this pattern holds across the full sample.
>
> **Evidence:** 9 of 13 games with a bad or okay sequencing were losses. Early signal only.

**Assessment:** Good. "Early signal only" suffix is correctly applied to low-sample data. Percentage is specific. ✓

---

## Messages That Are Too Vague

### Next action card — no dominant signal

> **"What to test next"**
>
> No single leak is dominant yet. Keep logging normal games with clean tags and quality ratings until one pattern separates itself. Every log should answer a testing question.
>
> **Evidence:** A five-game block with consistent tagging is the fastest path to a real coaching read.

**Assessment:** This message is correct for low-signal states but tells the player nothing specific. When shown with 100 games in the sample, it implies the coach couldn't find a pattern — but the real issue is that this card only appears when the matchup/quality/tag cards already covered the main patterns. The "next action" card is largely redundant when the above cards are present.

**Suggested fix:** Either remove this card when 3+ primary insights exist, or make it always specific: "Keep logging Mega Greninja games — that is still where the clearest signal is building."

---

### Matchup per-row action text

> "Keep logging and tag every loss." (shown for both Raging Bolt 38% and Charizard ex 40%)

**Assessment:** Generic. The same text for a 38% win rate matchup and a 40% matchup is meaningless differentiation. The player needs to know WHY this matchup is a problem.

**Suggested replacement:**
- For 38% win rate, 18 games: "Your worst-win-rate matchup. Bench pressure and missed setup appear in losses — start with those tags."
- For 40% win rate, 5 games: "Early signal only — too few games to act on. Keep logging before changing plans."

---

## Messages That Overclaim

None detected in this dataset. The low-sample safeguards are working:
- "Early signal only" suffix appears correctly on 5–9 game samples
- The sequencing insight (13 games) correctly showed "Early signal only"
- No "solved" or "proven" language appears anywhere

---

## Suggested Copy Improvements

### Dashboard — deck coaching card CTA
**Current:** "Open Review"  
**Problem:** Generic, doesn't say what the player will find  
**Better:** "See opening hand analysis →" or "Review this pattern →"

### Review — "What this page does" explainer
**Current:** "Review the games, not just the totals — This page looks for repeated matchup leaks, weak quality patterns, recurring issue tags, positive tech signals, and version gaps."  
**Problem:** Describes the system, not the player's situation  
**Better:** Show a context-aware version: "Based on 100 logged games, we found 4 patterns worth reviewing." (count the cards)

### Review — Sample context card reason text
**Current:** "There is enough logged signal here to review before changing the list."  
**Problem:** Same text regardless of what was found  
**Better:** "Your opening hand pattern is strong enough to act on. Your Item Lock signal also stands out."

### Matchups — per-row action text
**Current:** "Run 5 targeted games and tag every loss." (for Actionable leak matchups)  
**Problem:** Assumes the player can arrange targeted games (priority watchlist mode, they can't)  
**Better:** "When this matchup appears, tag bench pressure and setup speed — those are where the losses start."

### Post-log reward (not yet implemented)
**Suggested copy:**
- After a loss tagged with Item Lock: "This game adds to your Item Lock pattern. 10 of 16 losses now tagged — the signal is growing."
- After a win tagged Good Tech: "Good Tech appears in 6 of your 11 wins now. The preservation case is getting stronger."
- After a bad opening hand loss: "Another bad opening hand loss. 37 of 45 bad opening hands have been losses — this pattern is consistent."

---

## Summary Assessment

| Coach surface | Quality | Ready for testers |
|---|---|---|
| Review Coach says hero | Excellent | Yes |
| Issue tag insights | Excellent | Yes |
| Positive tag insights | Excellent | Yes |
| Quality pattern insights | Good | Yes |
| Matchup watchlist | Good | Yes |
| Dashboard deck coaching card | Good | Yes (after boolean fix deployed) |
| Next action card | Fair | Yes (but consider removing when 3+ primary insights exist) |
| Per-matchup action text | Fair | Needs improvement before beta |
| Post-log reward coaching | Missing | Not yet implemented |
