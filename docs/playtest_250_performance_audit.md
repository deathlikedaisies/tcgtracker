# Playtest 250 Performance Audit

Date: 2026-06-12

## Route timings

- /matchups: 15096ms
- /matches/new: 4647ms
- /matches/new: 2885ms
- /matches: 2532ms
- /matchups: 2063ms
- /decks/4b741cf6-8f28-4b2b-afea-45d085fffd83: 2035ms
- /matches: 1522ms
- /decks: 1262ms
- /dashboard: 1255ms
- /dashboard: 1211ms
- /demo: 1191ms
- /review: 1132ms
- /: 1121ms
- /review: 1119ms
- /settings/profile: 973ms
- /settings/profile: 915ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

- None captured during this audit run
