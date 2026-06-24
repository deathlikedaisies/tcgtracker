# Archetype Refresh Workflow (Limitless)

Date of refresh: 2026-06-24

## Purpose
SixPrizer keeps a local curated archetype list for:
- opponent matchup pickers
- deck creation/manual archetype pickers
- profile `Favorite deck`
- decklist detection
- demo and seeded beta flows

This list should be refreshed from current Limitless metagame and decklist pages before beta releases or format shifts. The app should not fetch Limitless at runtime.

## Source pages checked
- https://limitlesstcg.com/decks
- https://limitlesstcg.com/decks/lists
- https://play.limitlesstcg.com/decks?game=PTCG

## Repeatable refresh command
Run:

```bash
node scripts/archetype_refresh_limitless.mjs
```

This writes a local snapshot to:

```text
results/archetype_refresh_limitless_YYYY-MM-DD.json
```

Use that snapshot plus manual review of current top decks to decide which archetypes should be promoted, added, kept as legacy, or left out.

## Current Limitless-driven archetypes promoted near the top
Based on the pages above on 2026-06-24, SixPrizer should prioritize these names near the top of the curated list:

- Dragapult
- Dragapult Dusknoir
- Mega Greninja
- Slowking
- N's Zoroark
- Crustle
- Alakazam Dudunsparce
- Ogerpon Meganium Hydrapple
- Hydrapple
- Ogerpon Box
- Beedrill
- Lillie's Clefairy
- Lucario Hariyama
- Rocket's Honchkrow
- Mega Lucario
- Rocket's Mewtwo
- Dragapult Blaziken
- Festival Lead
- Raging Bolt
- Alakazam

## Archetypes added or promoted
- Dragapult
- Ogerpon Meganium Hydrapple
- Slowking
- Crustle
- Hydrapple
- Ogerpon Box
- Lillie's Clefairy
- Alakazam Dudunsparce
- Lucario Hariyama

## Archetypes kept as legacy compatibility values
These remain in the local list so existing user data and older seeded/demo values do not break:

- Dragapult ex
- Mega Lucario ex
- Mega Zygarde ex
- Charizard ex
- Gardevoir ex
- Gholdengo ex
- Miraidon ex
- Roaring Moon ex
- Chien-Pao ex
- Lugia VSTAR
- older rogue and beta-testing archetypes already in the local list

## Archetypes intentionally not promoted
These may appear on Limitless, but were not promoted into the top block because they are too narrow, too rogue, or too low-share for a beta-facing picker:

- single-event rogue decks
- narrow tech variants with no clear identity beyond one list
- highly ambiguous labels that overlap a broader archetype

They can still be typed manually through existing archetype picker behavior if needed.

## Detection rule updates
Decklist detection was updated conservatively for:
- Dragapult
- Slowking
- Crustle
- Ogerpon Meganium Hydrapple
- Hydrapple
- Ogerpon Box
- Lillie's Clefairy

Detection uses core card groups and avoids overclaiming from a single support card where possible.

### Detection notes
- `Dragapult`
  - core: `Dragapult ex`, `Drakloak` or `Dreepy`
  - excluded: Dusknoir line, Blaziken line, Dudunsparce line
- `Ogerpon Meganium Hydrapple`
  - core: Ogerpon + Meganium line + Hydrapple line
  - optional: Rare Candy, Applin, Dipplin
  - risk: medium overlap with Ogerpon/Meganium shells, handled by requiring all three engines
- `Hydrapple`
  - core: Hydrapple line
  - excluded: Meganium line and Ogerpon shell
- `Ogerpon Box`
  - core: Ogerpon shell
  - excluded: Meganium line and Hydrapple line
- `Slowking`
  - core: Slowking ex or Slowking
- `Crustle`
  - core: Crustle
- `Lillie's Clefairy`
  - core: Lillie's Clefairy ex or Lillie's Clefairy

## Notes on ambiguous names
- Limitless currently surfaces `Dragapult` more often than `Dragapult ex`, so SixPrizer now promotes `Dragapult` as the current label while keeping `Dragapult ex` for legacy compatibility.
- `Ogerpon Meganium Hydrapple` and `Ogerpon Meganium` overlap; the combined build should only trigger when all three engines are present.
- `Hydrapple` and `Ogerpon Box` should stay conservative because partial overlap is common in current lists.
