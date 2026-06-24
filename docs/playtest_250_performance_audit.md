# Playtest 250 Performance Audit

Date: 2026-06-24

## Route timings

- /matches/new: 5338ms
- /matchups: 2660ms
- /matchups: 2300ms
- /matches: 1946ms
- /decks/9d3c1d32-9c41-4a8b-9156-92282aa29fc3: 1428ms
- /review: 1427ms
- /matches: 1395ms
- /matches?page=2: 1390ms
- /decks/9d3c1d32-9c41-4a8b-9156-92282aa29fc3: 1369ms
- /: 1170ms
- /decks: 1146ms
- /review: 1110ms
- /decks: 1093ms
- /review: 1092ms
- /matches/new: 1061ms
- /matches/new: 1060ms
- /dashboard: 990ms
- /dashboard: 935ms
- /profile: 932ms
- /dashboard: 931ms
- /profile: 924ms
- /demo: 844ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- None captured during this audit run
