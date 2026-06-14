# Full Site Visual Polish Audit

Date: 2026-06-14

Product lens:
- SixPrizer should feel premium, sharp, dark navy/gold/blue, and coaching-oriented.
- Dashboard should behave like a command center.
- Review should behave like an evidence-backed coach read.
- Mobile should feel intentionally compact, not like a desktop UI compressed downward.

Routes inspected:
- Public: `/`, `/login`, `/signup`, `/demo`, `/u/domz_test` unavailable state
- Authenticated: `/dashboard`, `/matches/new`, `/matches`, `/matchups`, `/decks`, `/review`, `/profile`

Viewports inspected:
- Mobile: `390x844`
- Desktop: `1440x1200`

Artifacts:
- Screenshots captured under `C:\Users\domzi\AppData\Local\Temp\sixprizer-visual-audit`
- Metrics captured in `C:\Users\domzi\AppData\Local\Temp\sixprizer-visual-audit\metrics.json`

High-level findings:
- The product is structurally stable. No route audited here showed page-level horizontal overflow.
- The main remaining polish issues are not layout breakages. They are hierarchy, repetition, and panel weight.
- The most obvious polish debt is concentrated in `/dashboard`, `/matches/new`, `/review`, plus a few copy remnants on `/matches`, `/decks`, `/demo`, and the public home preview.

## Do Not Change
- The overall dark navy / gold / blue visual language is coherent and worth preserving.
- The authenticated shell is now structurally correct. Desktop sidebar ownership is clear and mobile nav is readable.
- `/matches/new` is materially better than previous versions. The fast path is working and should not be rebuilt.
- `/review` already has a clearer top-card hierarchy than earlier passes. It needs refinement, not redesign.
- Public auth pages (`/login`, `/signup`) feel aligned with the rest of the product and do not need broad visual work.
- No global overflow hack is needed. The current route set inspected here is horizontally stable.

## Issues

### 1. Dashboard hero is still too visually dominant
- Route: `/dashboard`
- Viewport: mobile and desktop
- Severity: high
- Problem: The top `Next best action` panel is calmer than the old mission hero, but it still behaves like the page’s entire personality. It stacks too many nested panels: focus, evidence, signal, progress, why-this, reward, next move, read unlocked, and dual CTAs.
- Suggested fix: Reduce the number of nested sub-panels, remove low-value reward framing from the hero, and keep one clear action plus compact supporting context.
- Files likely involved: `src/components/auth/DashboardContent.tsx`
- Fix now or defer: fix now

### 2. Dashboard sidebar insight duplicates the main focus
- Route: `/dashboard`
- Viewport: desktop
- Severity: high
- Problem: The sidebar footer mini-card repeats the same focus/title already shown in the main hero. This makes Overview feel like Review leaking in twice.
- Suggested fix: Remove the dashboard sidebar insight card entirely, or replace it with nothing on Overview.
- Files likely involved: `src/components/auth/DashboardContent.tsx`, `src/components/AppSidebar.tsx`
- Fix now or defer: fix now

### 3. “Mission” phrasing still survives in user-facing copy
- Route: `/matches`, `/decks`, `/demo`, public `/`
- Viewport: all
- Severity: medium
- Problem: The app is mostly on “focus / review / next best action,” but there are still visible remnants like `Current mission`, `Review mission`, and `Show games that advance the current mission`.
- Suggested fix: Standardize remaining user-facing phrasing to `current focus`, `open review`, or `review signal`.
- Files likely involved: `src/lib/session-coach.ts`, `src/app/matches/page.tsx`, `src/app/decks/page.tsx`, `src/app/page.tsx`, `src/app/demo/page.tsx`
- Fix now or defer: fix now

### 4. Match logging still starts too low on mobile
- Route: `/matches/new`
- Viewport: mobile
- Severity: high
- Problem: The flow is faster now, but the `Current focus` helper still consumes a full panel above the form, so the first input starts lower than it should.
- Suggested fix: Compress the helper into a lighter strip or smaller card with one sentence and a compact progress badge.
- Files likely involved: `src/components/matches/MatchLogForm.tsx`
- Fix now or defer: fix now

### 5. Match logging post-save state is still visually heavy
- Route: `/matches/new`
- Viewport: mobile
- Severity: medium
- Problem: The post-save focus panel still carries stacked status, reward, and progress language that reads like a second mission card after the log flow.
- Suggested fix: Keep the post-save signal, but trim reward emphasis and reduce the number of stacked sub-elements.
- Files likely involved: `src/components/matches/MatchLogForm.tsx`
- Fix now or defer: fix now

### 6. Review secondary section feels orphaned
- Route: `/review`
- Viewport: desktop and mobile
- Severity: medium
- Problem: `More review signals` appears as a plain disclosure between the supporting cards and analytics. It reads like a leftover control instead of a deliberate section.
- Suggested fix: Wrap the secondary insights in a proper section container with a short description.
- Files likely involved: `src/app/review/page.tsx`
- Fix now or defer: fix now

### 7. Review supporting cards are slightly too tall
- Route: `/review`
- Viewport: mobile
- Severity: low
- Problem: Supporting insight cards are readable, but they still carry more vertical space than their information density needs.
- Suggested fix: Slightly tighten card copy spacing and keep the section subordinate to the primary insight.
- Files likely involved: `src/app/review/page.tsx`, `src/components/review/ReviewDetailedAnalytics.tsx`
- Fix now or defer: defer

### 8. Match history filter copy is inconsistent with new focus language
- Route: `/matches`
- Viewport: mobile and desktop
- Severity: medium
- Problem: Match history still says `Show games that advance the current mission` and `that advance the current mission`, which breaks the newer coaching language.
- Suggested fix: Rename to `current focus`.
- Files likely involved: `src/app/matches/page.tsx`
- Fix now or defer: fix now

### 9. Decks page still surfaces “Mission:” in deck cards
- Route: `/decks`
- Viewport: desktop and mobile
- Severity: medium
- Problem: The first deck card still shows `Mission:` as a badge, which feels out of step with the rest of the app’s updated wording.
- Suggested fix: Rename to `Current focus:` or fold it into the deck status copy.
- Files likely involved: `src/app/decks/page.tsx`
- Fix now or defer: fix now

### 10. Matchups page is content-rich but still acceptable
- Route: `/matchups`
- Viewport: desktop
- Severity: low
- Problem: The page is information-dense and slightly busy, especially with the right-hand `What to test next` card plus the hero plus long rows.
- Suggested fix: No immediate change. The density is understandable for the route’s purpose, and the hierarchy still holds.
- Files likely involved: `src/app/matchups/page.tsx`
- Fix now or defer: defer

### 11. Profile page remains very long on mobile
- Route: `/profile`
- Viewport: mobile
- Severity: medium
- Problem: The profile page is coherent, but it is a very tall settings surface. The link box, preview card, privacy summary, and large section cards create a long scroll before save.
- Suggested fix: Keep current structure for beta. Consider later collapsing lower-priority sections or making the preview/privacy panels less tall.
- Files likely involved: `src/components/community/ProfileSettingsPageContent.tsx`
- Fix now or defer: defer

### 12. Public home preview still uses “Current mission”
- Route: `/`
- Viewport: desktop and mobile
- Severity: medium
- Problem: The product preview card still says `Current mission`, which conflicts with the newer app language and makes the product look less refined.
- Suggested fix: Rename to `Current focus`.
- Files likely involved: `src/app/page.tsx`
- Fix now or defer: fix now

### 13. Demo still uses older “mission” framing
- Route: `/demo`
- Viewport: desktop and mobile
- Severity: medium
- Problem: The demo still teaches the product using `current mission` wording, which is inconsistent with the rest of the product direction.
- Suggested fix: Rename visible demo copy to `current focus` where it is user-facing.
- Files likely involved: `src/app/demo/page.tsx`
- Fix now or defer: fix now

### 14. Public profile unavailable state is fine
- Route: `/u/domz_test` unavailable state
- Viewport: desktop
- Severity: low
- Problem: None. The unavailable state is branded, short, and clear.
- Suggested fix: None.
- Files likely involved: `src/app/u/[handle]/page.tsx`
- Fix now or defer: defer

### 15. Public share/report surfaces not fully audited with a stable seeded URL
- Route: `/r/[slug]`
- Viewport: all
- Severity: low
- Problem: No stable local shared-report slug was available during this audit pass, so the route was not visually inspected end-to-end here.
- Suggested fix: Re-check against a stable seeded shared report in a later polish sweep.
- Files likely involved: `src/app/r/[slug]/page.tsx`
- Fix now or defer: defer

## Fix-Now Patch Scope
- Remove duplicated focus/insight repetition from Overview and the log route sidebar.
- Reduce dashboard hero panel weight without redesigning the page.
- Compress the match logging top helper and post-save focus surface.
- Standardize remaining user-facing `mission` copy to `focus` / `review`.
- Wrap Review secondary signals in a clearer section.

## Deferred
- Major rebalancing of `/matchups`
- Making `/profile` significantly shorter
- Reworking demo route structure beyond copy alignment
- Additional Review analytics compaction
- Full public report surface re-audit with a stable seeded report slug
