# Playtest 200 Performance Audit

Date: 2026-06-11

## Route timings

- /decks/f0d790b1-e410-438c-b64e-27f072a52a19: 4831ms
- /matches/new: 4567ms
- /matches: 3891ms
- /matchups: 3535ms
- /decks: 3258ms
- /matches/new: 2661ms
- /matches: 1609ms
- /matches?page=2: 1509ms
- /matchups: 1465ms
- /dashboard: 1432ms
- /: 1300ms
- /decks/f0d790b1-e410-438c-b64e-27f072a52a19: 1242ms
- /decks: 1151ms
- /review: 1142ms
- /demo: 1136ms
- /dashboard: 1095ms
- /: 1079ms
- /review: 980ms
- /demo/matches/new: 875ms
- /demo: 842ms
- /login: 817ms
- /demo/matches/new: 744ms
- /signup: 707ms

## Observations

- Pagination on /matches still works with 200 matches and keeps the first render bounded.
- Dashboard, review, and matchups remain usable at seeded volume.
- No obvious browser console errors were recorded during the final audit run.
- Local dev timings are directional only; they are most useful here for identifying routes that feel comparatively heavier.

## Console errors

- None
