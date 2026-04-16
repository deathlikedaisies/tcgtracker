---
name: prizemap-ui-audit
description: Audit and refine PrizeMap UI for visual hierarchy, cleanliness, consistency, and premium product feel across landing page and core app screens.
---

# PrizeMap UI Audit

Use this skill when working on:
- landing page polish
- dashboard polish
- deck/deck version pages
- match logging UX
- match history readability
- matchup page clarity
- global visual consistency

This skill is for **high-signal UI refinement**, not random redesigns.

## Product context

PrizeMap is a premium-feeling competitive Pokémon TCG tracker focused on:
- fast match logging
- matchup analysis
- deck/deck version tracking
- format-aware testing
- actionable prep notes

The UI should feel:
- clean
- sharp
- premium
- modern
- competitive
- mobile-aware
- visually exciting, but restrained

Avoid:
- childish Pokémon styling
- clutter
- overly dense cards
- too many borders
- decorative elements that reduce readability
- generic SaaS fluff

## Brand direction

Use this visual direction consistently:
- dark premium shell
- high contrast typography
- controlled use of glow/depth
- gold only for strongest emphasis / primary CTA
- blue for active, focus, secondary emphasis
- semantic green/red only for wins/losses and related metrics

Core palette:
- Midnight: `#0B1020`
- Slate: `#1A2238`
- Soft Slate: `#94A3B8`
- Off White: `#F8FAFC`
- Electric Gold: `#F5C84C`
- Map Blue: `#4F8CFF`
- Emerald Win: `#22C55E`
- Rose Loss: `#F43F5E`

## UI rules

### 1. Hierarchy first
Every page should make it obvious:
- what this page is
- what the user should notice first
- what action matters most

When auditing a page, identify:
- primary headline
- primary CTA
- primary content block
- secondary content
- tertiary support text

If those are not obvious in 3 seconds, improve hierarchy.

### 2. Reduce visual heaviness
PrizeMap should not feel over-boxed.

Prefer:
- spacing
- background contrast
- subtle shadows
- panel separation
over:
- heavy outlines
- too many borders
- too many nested cards

When possible:
- reduce border count
- simplify containers
- remove redundant separators

### 3. Keep copy tight
Landing and in-app copy should be concise.

Rewrite copy to be:
- short
- concrete
- product-led
- competitive in tone
- not hypey or vague

Prefer:
- “See your real matchup win rates”
over:
- “Unlock deeper performance insights”

### 4. Product preview should feel valuable
Landing page previews or dashboard previews must look like:
- real product UI
- real value
- clear insight

Avoid fake-looking placeholder clutter.

### 5. Pokémon identity is supportive, not dominant
Sprites and TCG-inspired visuals should help recognition, but text and product utility remain primary.

Use sprites:
- beside deck names
- in matchup rows
- in recent match summaries

Avoid turning pages into fan-art compositions.

## Page-by-page audit checklist

### Landing page
Check:
- hero clarity
- above-the-fold value
- product preview prominence
- CTA visibility
- section count
- text volume
- visual depth without clutter

Questions:
- Does it communicate value in 5 seconds?
- Is the product preview visible and attractive?
- Is there too much text?
- Does it feel premium and modern?

### Dashboard
Check:
- immediate insight visibility
- empty state motivation
- clarity of stat cards/charts
- deck summary usefulness
- recent matches readability

Questions:
- Do I immediately learn something useful?
- Is there a clear “aha” moment?
- Is the page too boxy?

### Decks
Check:
- scanability of deck list
- clarity of actions
- form/list balance
- sprite integration quality

Questions:
- Can I understand my decks instantly?
- Are Manage/Delete actions visually organized?

### Match logging
Check:
- fastest path to log a match
- field order
- prominence of deck version selector
- visual density
- tag usability
- note field size

Questions:
- Can I log a match in 15–20 seconds?
- Is the form visually lighter than before?
- Are controls grouped logically?

### Matches history
Check:
- scanability
- filters clarity
- notes/tags noise
- edit/delete discoverability

### Matchups
Check:
- matchup rows clarity
- win-rate usefulness
- note editor weight
- filter usability
- sprite usage

## Output format when using this skill

When you finish an audit or UI pass, respond with:

1. **What feels strongest**
2. **What feels weakest**
3. **Top 3 changes with highest visual impact**
4. **Files to change**
5. **Short implementation plan**

If editing code, keep changes:
- cohesive
- minimal but high impact
- production-ready

## Refactor guidance

When refactoring:
- centralize repeated style rules
- prefer reusable shared UI patterns
- do not create unnecessary abstraction for one-off elements
- preserve existing behavior and logic

## Hard constraints

Do not:
- change auth flows
- change schema
- change calculations
- add unnecessary dependencies
- add decorative animations unless clearly helpful
- bloat the landing page with extra sections

## Preferred outcomes

A successful UI audit should make PrizeMap:
- easier to scan
- more premium
- more visually confident
- less cluttered
- more mobile-friendly
- more “real product” and less “project”
