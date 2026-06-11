# Playtest 200 Visual Audit

Date: 2026-06-11

## Routes checked

- /
- /demo
- /demo/matches/new
- /login
- /signup
- /dashboard
- /review
- /matchups
- /decks
- /decks/f0d790b1-e410-438c-b64e-27f072a52a19
- /matches
- /matches?page=2
- /matches/new

## Desktop observations

- /: heading "From testing games to
six-prize turns.", overflow=false, load=1300ms
- /demo: heading "SixPrizer demo workspace", overflow=false, load=1136ms
- /demo/matches/new: heading "Log a demo game", overflow=false, load=875ms
- /login: heading "Log in to SixPrizer", overflow=false, load=817ms
- /signup: heading "Create your SixPrizer account", overflow=false, load=707ms
- /dashboard: heading "Overview", overflow=false, load=1432ms
- /review: heading "Review", overflow=false, load=1142ms
- /matchups: heading "Matchup Intelligence", overflow=false, load=3535ms
- /decks: heading "Deck Experiments", overflow=false, load=3258ms
- /decks/f0d790b1-e410-438c-b64e-27f072a52a19: heading "Playtest 200 - Raging Bolt Lab", overflow=false, load=4831ms
- /matches: heading "Matches", overflow=false, load=3891ms
- /matches?page=2: heading "Matches", overflow=false, load=1509ms
- /matches/new: heading "Log a game", overflow=false, load=4567ms

## Mobile observations

- /: heading "From testing games to
six-prize turns.", overflow=false, load=1079ms
- /demo: heading "SixPrizer demo workspace", overflow=false, load=842ms
- /demo/matches/new: heading "Log a demo game", overflow=false, load=744ms
- /dashboard: heading "Overview", overflow=false, load=1095ms
- /review: heading "Review", overflow=false, load=980ms
- /matchups: heading "Matchup Intelligence", overflow=false, load=1465ms
- /decks: heading "Deck Experiments", overflow=false, load=1151ms
- /matches: heading "Matches", overflow=false, load=1609ms
- /matches/new: heading "Log a game", overflow=false, load=2661ms
- /decks/f0d790b1-e410-438c-b64e-27f072a52a19: heading "Playtest 200 - Raging Bolt Lab", overflow=false, load=1242ms

## Consistency notes

- Premium metallic/glass styling appears on public, demo, and authenticated routes in the captured screenshots.
- No clipped headline text or route-level overflow remained in the final browser pass.
- Cards at 200-match volume remain readable on dashboard, review, matchups, decks, and matches.
- Match logging keeps clear selected states and large tap targets on mobile.

## Exceptions

- None
