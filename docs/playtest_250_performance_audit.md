# Playtest 250 Performance Audit

Date: 2026-06-12

## Route timings

- /matches/new: 3562ms
- /matches/new: 3171ms
- /matchups: 3108ms
- /matchups: 2391ms
- /matches: 1662ms
- /matches: 1557ms
- /decks: 1480ms
- /decks/4b741cf6-8f28-4b2b-afea-45d085fffd83: 1371ms
- /dashboard: 1187ms
- /: 1136ms
- /review: 1103ms
- /demo: 1071ms
- /dashboard: 1061ms
- /settings/profile: 1040ms
- /review: 1014ms
- /settings/profile: 931ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- None captured during this audit run
