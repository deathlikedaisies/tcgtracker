# Playtest 200 Audit

Date: 2026-06-11

## Executive summary

The 200-log seeded playtest produced realistic deck, version, matchup, tag, and turn-order signal. The current app surfaces the main Raging Bolt into Mega Greninja leak, preserves low-sample ambiguity on noisy decks, and remains visually stable after the premium metallic/glass style pass.

## Seeded dataset

- Decks: 6
- Versions: 14
- Matches: 200
- Main leak: Raging Bolt vs Mega Greninja at 7W / 21L / 4T
- Sequencing leak: Dragapult bad/okay sequencing in 10 of 15 losses
- Item Lock signal: Control Counterlab losses tagged Item Lock in 9 of 9 losses
- Noisy sample: Rogue Box at 3W / 4L / 3T across 10 games

## What the coach detected well

- Dashboard mission: Current mission should target the Raging Bolt into Mega Greninja leak
- Review hero: Review should surface a real deck leak or quality pattern from the seeded sample
- Matchups page: Priority watchlist and action points should agree with the seeded leak
- Deck detail: Deck detail should show the active version and a clear version signal
- Matches page: Matches list should preserve totals and pagination at 200 logs

## What the coach missed or needs caution on

- Dashboard coach strip: Coach strip should reinforce the current mission without contradicting watchlist language (Needs wording check)
- Review secondary cards: Secondary review cards should expose repeated tag and positive-tech patterns (Could surface stronger tag analysis)
- Post-save reward: Saving a new game should produce a clear reward panel and coaching line (Needs selector check)

## UI and visual findings

- Horizontal overflow: None in final pass
- Post-style pass surfaces stayed consistent across dashboard, review, matchups, decks, matches, and demo routes.
- Match logging and review remained readable on mobile at seeded volume.

## Performance findings

- /decks/f0d790b1-e410-438c-b64e-27f072a52a19: 4831ms
- /matches/new: 4567ms
- /matches: 3891ms

## Post-log reward audit

- Temporary audit save created and deleted cleanly: 1 match
- Reward badge: Not captured
- Reward summary: Not captured

## Bugs found

### Blocker

- None

### Should-fix

- If any coach copy overstates early signal, tighten wording around low-sample cards and version comparisons.

### Polish

- Continue tightening deck-detail and review explanations so evidence lines are shorter on mobile.

### Later

- Add more automated route-level assertions for coach-specific text once product wording stabilizes.
