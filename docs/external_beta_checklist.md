# SixPrizer External Beta Checklist

## Must fix before testers
- No hard blockers found for a small controlled beta.

## Should fix soon
- Harden login against pre-hydration native submit fallback.
- Align matchups-page wording more explicitly with `Priority watchlist`.
- Keep watching `/matches` and `/matchups` performance as testers add data.

## Tester instructions
- Use the demo first if you want a quick preview.
- Create one deck and one version before logging games.
- Use `Can't remember` for turn order instead of guessing.
- Log normal testing games; the watchlist is guidance, not a forced matchup.
- Send screenshots and route names with any bug report.

## Monitoring checklist during beta
- auth/login failures
- match save failures
- route-level error boundaries
- mobile overflow or unusable buttons
- decklist parse confusion
- mission wording confusion
- slow `/matches` or `/matchups`

## Rollback / emergency notes
- Pause new tester invites first.
- Keep demo available even if authenticated routes need maintenance.
- If auth regressions appear, treat them as top priority before expanding the cohort.
