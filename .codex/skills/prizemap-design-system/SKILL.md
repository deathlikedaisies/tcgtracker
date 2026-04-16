---
name: prizemap-design-system
description: Enforce the PrizeMap visual system across landing page and product UI, including colors, spacing, buttons, cards, forms, nav, charts, and sprite usage.
---

# PrizeMap Design System

Use this skill whenever working on:
- new UI components
- page redesigns
- landing page updates
- navigation changes
- dashboard polish
- form polish
- chart styling
- sprite integration
- visual cleanup after Codex-generated changes

This skill exists to stop the UI from drifting.

## Product context

PrizeMap is a competitive Pokémon TCG tracker and matchup analysis tool.

It should feel:
- premium
- modern
- sharp
- dark
- strategic
- product-led
- Pokémon-native, but not childish

The UI should communicate:
- performance
- clarity
- confidence
- testing discipline
- competitive edge

## Core visual principles

### 1. Premium dark product shell
PrizeMap should feel like a polished gaming/productivity hybrid, not a generic admin panel.

Use:
- rich dark surfaces
- layered depth
- careful contrast
- restrained glow
- strong typography

Avoid:
- flat bland dark gray
- overly neon styling
- noisy gradients everywhere
- sci-fi clutter
- cartoonish elements

### 2. Utility first, flair second
Every decorative choice must support:
- recognition
- hierarchy
- scanability
- premium feel

If a visual element does not improve clarity or delight, remove it.

### 3. Fewer, stronger UI patterns
PrizeMap should rely on a small number of repeatable patterns:
- app shell
- section header
- primary card
- secondary card
- button hierarchy
- input styles
- stat treatment
- list row treatment

Do not invent new micro-styles for each page.

## Brand tokens

### Colors
Use these as the default system:

- Midnight: `#0B1020`
- Slate: `#1A2238`
- Soft Slate: `#94A3B8`
- Off White: `#F8FAFC`
- Electric Gold: `#F5C84C`
- Map Blue: `#4F8CFF`
- Emerald Win: `#22C55E`
- Rose Loss: `#F43F5E`

### Color usage rules

#### Midnight / Slate
Use for:
- page backgrounds
- app shell
- cards
- nav
- panels

#### Off White
Use for:
- primary text
- major headings
- key labels

#### Soft Slate
Use for:
- support text
- secondary text
- descriptions
- helper copy

#### Electric Gold
Use sparingly for:
- primary CTA
- strongest emphasis
- selected nav item only when truly primary
- key accent moments

Do **not** use gold for everything.

#### Map Blue
Use for:
- active secondary states
- input focus
- links
- selected chips when not primary
- strategic emphasis
- sprite or panel accent glow

#### Emerald Win / Rose Loss
Use only for:
- win/loss stats
- result indicators
- charts
- matchup performance highlights

Do not repurpose them for general UI accents.

## Typography rules

### Headings
Headings should be:
- bold
- clear
- minimal
- high contrast

Page titles:
- strong
- obvious
- not over-decorated

Landing hero headline:
- biggest text on page
- no more than 2–3 lines on desktop
- fewer words is better

### Support text
Support text must be:
- shorter than you think
- quieter than headings
- easy to scan

If support text becomes paragraph-heavy, cut it.

### Labels
Form labels and micro labels should be:
- readable
- consistent
- not too small
- clearly separated from input values

## Spacing rules

### General
Prefer whitespace over separators.

Use spacing to create hierarchy before adding borders or dividers.

### Section rhythm
Each page should have:
- clear top area
- page header
- primary content block
- secondary content blocks

Avoid stacked sections with the same visual weight.

### Internal card spacing
Cards should breathe.
Do not cram:
- headings
- metrics
- buttons
- support text

## Card system

### Primary cards
Use for:
- major content blocks
- hero product previews
- dashboard summaries
- key forms

Should feel:
- slightly elevated
- structured
- premium

### Secondary cards
Use for:
- feature summaries
- list rows
- supporting analytics

Should feel lighter than primary cards.

### Card rules
Prefer:
- soft border or subtle contrast shift
- light shadow or glow if useful
- consistent radius
- strong padding rhythm

Avoid:
- overly thick outlines
- card-inside-card-inside-card structures
- too many competing card styles

## Buttons

### Button hierarchy

#### Primary button
Use Electric Gold background.
Use only for the main action in a region.

Examples:
- Get started
- Save and log another
- Create deck
- Apply only if it is the page’s main action

#### Secondary button
Use darker background with blue or subtle border emphasis.

#### Tertiary button / text action
Use for low emphasis actions only.

### Button rules
- do not make every button look primary
- maintain consistent height
- keep padding generous
- text should be concise

## Forms

### Inputs
Inputs should feel:
- clean
- dark
- readable
- high contrast
- not overoutlined

Use:
- subtle border
- clear focus state with Map Blue
- generous padding

Avoid:
- heavy outlines everywhere
- tiny inputs
- inconsistent input heights

### Form layout
- important fields first
- optional fields quieter
- notes fields smaller by default unless needed
- field groups should feel intentionally organized

### Match logging form
This is the most important form in the product.

Priorities:
1. deck version
2. opponent archetype
3. result
4. went first
5. event type
6. format
7. tags
8. notes

Make it feel:
- fast
- light
- deliberate

## Navigation

### Desktop nav
Should feel:
- compact
- premium
- clear
- not cramped

### Mobile nav
Should feel intentionally designed, not just wrapped buttons.

Rules:
- primary nav obvious
- active state clear
- sign out visually secondary
- easy tap targets
- no accidental crowding

## Charts

Charts should:
- support insight
- not dominate pages
- use restrained styling
- remain legible on mobile

Rules:
- no unnecessary legend clutter
- no decorative chart chrome
- use semantic colors carefully
- align chart card styling with the rest of the app

## Sprites

Sprites are supporting identity, not the core UI.

Use sprites:
- beside deck labels
- in matchup rows
- in recent matches
- in carefully chosen hero/product previews

Rules:
- keep them small
- text remains primary
- use at most 2 sprites for combo archetypes
- do not create visual clutter

Fallback:
- clean initials badge is acceptable when sprite missing

## Landing page rules

The landing page should:
- feel premium
- be lighter than a feature dump
- show the product fast
- use fewer words
- make signup easy

Preferred structure:
1. simple header
2. strong hero
3. product preview
4. one concise value strip
5. one feature section
6. final CTA

Do not let landing pages become essay pages.

## Output expectations when using this skill

When applying this skill:
1. identify which design system rules are currently violated
2. fix the highest-impact inconsistencies
3. centralize style patterns where practical
4. keep implementation clean and production-ready

When reporting back, include:
- what inconsistencies were fixed
- which shared patterns were reinforced
- what pages/components were aligned
- what still needs future cleanup

## Hard constraints

Do not:
- change auth flows
- change schema
- change calculations
- add style libraries
- add decorative motion unless clearly justified
- make Pokémon visuals overwhelm product clarity

## Success standard

A successful pass with this skill should make PrizeMap feel:
- more cohesive
- more premium
- easier to scan
- more confident
- more “real product”
- less like a collection of individually styled pages
