---
name: prizemap-release-check
description: Run a pre-launch PrizeMap release audit covering deploy readiness, environment safety, mobile QA, broken assets, metadata, and obvious product-quality issues before shipping.
---

# PrizeMap Release Check

Use this skill before:
- deploying to Vercel
- sharing with early users
- posting screenshots publicly
- demoing PrizeMap
- cutting a milestone release

This skill is a **pre-launch guardrail**.  
Its job is to catch obvious problems before users do.

## Product context

PrizeMap is a premium-feeling competitive Pokémon TCG tracker and matchup analysis tool.

Before release, the product must feel:
- stable
- coherent
- trustworthy
- intentional
- polished enough to show real users

A release check is not for adding new features.  
It is for verifying quality and removing launch risk.

---

## Release priorities

Check these in order:

1. **Build and deploy safety**
2. **Environment variable safety**
3. **Navigation and route sanity**
4. **UI polish and screenshot readiness**
5. **Mobile usability**
6. **Asset integrity**
7. **Copy / placeholder cleanup**
8. **Trustworthiness / product readiness**

---

## 1. Build and deploy safety

Always verify:

- `npm run lint`
- `npm run build`
- `git diff --check`

If relevant, confirm:
- no unresolved merge markers
- no TypeScript errors
- no dead imports
- no obviously unused temporary debug code

Flag:
- `console.log` debug noise left in production paths
- temporary audit/debug UI still visible
- any TODOs in user-facing surfaces

---

## 2. Environment variable safety

Confirm that:

- `.env.local` is not committed
- only publishable Supabase keys are used in frontend code
- no service role key is exposed in client components
- Vercel-required environment variables are documented

For PrizeMap, expected frontend envs are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not expose secrets in:
- client code
- committed files
- screenshots
- README examples if avoidable

---

## 3. Routing and navigation sanity

Verify all major routes work and feel intentional:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/decks`
- `/decks/[id]`
- `/matches`
- `/matches/new`
- `/matches/[id]/edit`
- `/matchups`

Check:
- page titles make sense
- nav active states are correct
- no broken links
- no orphaned pages
- sign out is available but visually secondary
- app shell is consistent

If a page feels out of family with the rest of the app, flag it.

---

## 4. UI and screenshot readiness

Audit whether the product is visually ready to be shown publicly.

Check:
- logo alignment
- sprite rendering
- empty state quality
- chart readability
- CTA hierarchy
- spacing rhythm
- card consistency
- landing page text density
- dashboard “aha” visibility

Flag anything that makes the app look:
- unfinished
- too dense
- visually inconsistent
- obviously placeholder-heavy

If needed, recommend which screenshots are best for:
- landing page
- dashboard
- match logging
- matchup analysis

---

## 5. Mobile QA

Release is not ready until mobile is acceptable.

Explicitly audit these at phone-like widths:
- landing page
- dashboard
- decks
- deck detail
- matches/new
- matches
- matchups

Look for:
- cramped rows
- broken wrapping
- oversized charts
- tiny tap targets
- long forms without hierarchy
- nav crowding
- misplaced submit buttons
- poor one-handed flow

Prefer concrete fixes over vague comments.

---

## 6. Asset integrity

Confirm all required static assets exist and resolve correctly.

Especially check:
- logo assets / inline logo
- archetype sprites in `public/sprites/`
- any landing page preview media
- favicon / metadata assets if present

For PrizeMap, verify:
- sprites load from `/sprites/...`
- filenames match mapping exactly
- fallback badges only appear where expected

Flag:
- broken image paths
- mismatched extensions
- missing sprite files
- stale local-only assets not committed

---

## 7. Copy and placeholder cleanup

Before release, remove or clearly label anything fake.

Check for:
- placeholder metrics
- placeholder testimonials
- “demo” values that look real
- lorem ipsum or filler copy
- fake traction claims
- fake social proof
- unfinished labels

If demo values are necessary for layout, ensure they are clearly presented as illustrative.

Rewrite copy to be:
- concise
- trustworthy
- concrete
- not overhyped

---

## 8. Product readiness and trust check

Ask:

- Does PrizeMap communicate value within 5 seconds?
- Does it look credible enough to trust with match tracking?
- Is the core loop clear?
- Would a competitive player understand why to use it?
- Does the app feel better than a spreadsheet or notes app?
- Is there an obvious next step after signup?

Flag the top trust-breakers if present.

---

## Release checklist output format

When using this skill, always return:

### A. Release status
Choose one:
- **Ready to ship**
- **Ready with minor fixes**
- **Not ready**

### B. Critical blockers
List only true blockers.

### C. High-value polish items
Top 3–5 improvements that would most improve perceived quality.

### D. Route-by-route quick notes
Short notes for:
- landing page
- dashboard
- decks
- matches/new
- matchups

### E. Mobile verdict
Say whether mobile is:
- solid
- acceptable
- needs work

### F. Deployment notes
Mention:
- env vars
- assets
- anything likely to break on Vercel

### G. Suggested next action
Choose one:
- deploy now
- fix blockers then deploy
- run one more UI pass

---

## Implementation guidance

If making fixes during the release check:
- keep them small and targeted
- do not redesign the app
- do not add new features
- prioritize trust and polish
- preserve behavior

---

## Hard constraints

Do not:
- change auth flows
- change schema
- change calculations
- add dependencies for minor issues
- add fake claims or fake social proof
- leave debug code in production

---

## Success standard

A successful release check means:

- the app builds cleanly
- the main routes work
- mobile is acceptable
- assets resolve correctly
- no embarrassing placeholders remain
- the product looks intentional enough to share with real users
