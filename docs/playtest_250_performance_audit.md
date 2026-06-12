# Playtest 250 Performance Audit

Date: 2026-06-12

## Route timings

- /decks/4b741cf6-8f28-4b2b-afea-45d085fffd83: 5694ms
- /matches/new: 2923ms
- /matches/new: 2923ms
- /matchups: 2476ms
- /matchups: 2142ms
- /matches: 1596ms
- /matches: 1442ms
- /decks: 1404ms
- /: 1196ms
- /review: 1108ms
- /dashboard: 1087ms
- /settings/profile: 1050ms
- /dashboard: 1041ms
- /review: 981ms
- /settings/profile: 935ms
- /demo: 927ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- None captured during this audit run
