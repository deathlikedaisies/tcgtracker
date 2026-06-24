# Playtest 1000 Performance Audit

Date: 2026-06-24

## Route timings

- /matchups: 6751ms
- /matchups: 5984ms
- /matchups: 5641ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 2362ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 1809ms
- /decks/8229d2ee-0040-4226-8b0f-4c3c9f4ae501: 1768ms
- /matches?page=2: 1686ms
- /matches: 1661ms
- /matches: 1658ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 1649ms
- /review: 1592ms
- /decks/e8ece6e6-c779-4ba2-8626-b43844acb00f: 1560ms
- /matches?page=10: 1536ms
- /matches?page=5: 1521ms
- /decks/8229d2ee-0040-4226-8b0f-4c3c9f4ae501: 1436ms
- /dashboard: 1399ms
- /matches: 1372ms
- /review: 1371ms
- /review: 1309ms
- /review: 1293ms
- /dashboard: 1148ms
- /decks: 1133ms
- /matches/new: 1130ms
- /matches/new: 1094ms
- /decks: 1050ms
- /matches/new: 1010ms
- /decks: 1004ms
- /dashboard: 955ms
- /matches/new: 943ms
- /dashboard: 942ms
- /: 929ms
- /profile: 794ms
- /profile: 779ms
- /profile: 731ms
- /demo: 634ms
- /demo: 623ms
- /u/domz_test: 0ms

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 1000 logs.
- /profile builder flows should remain light even after the richer preview builder.

## Console errors

- None captured during this audit run
