---
name: prizemap-mobile-qa
description: Audit and improve PrizeMap for mobile usability, responsive layout quality, tap targets, navigation, and fast one-handed workflows.
---

# PrizeMap Mobile QA

Use this skill whenever changing:
- navigation
- landing page layout
- forms
- cards/lists
- charts
- matchup rows
- deck pages
- any shared shell or spacing system

This skill focuses on **real mobile usability**, not just “it technically fits.”

## Product context

PrizeMap will often be used:
- during testing sessions
- between rounds
- on the go
- while reviewing matchups quickly
- on phones, not just desktops

That means the mobile experience must feel:
- intentional
- uncluttered
- fast
- easy to tap
- easy to scan
- easy to recover from mistakes

## Core mobile principles

### 1. One-handed friendliness
Prefer layouts where the user can:
- navigate quickly
- log a match with minimal stretch
- tap primary actions cleanly

Avoid:
- tiny nav pills
- dense horizontal control rows
- stacked controls with no breathing room

### 2. Above-the-fold clarity
On mobile, the user should quickly see:
- page title
- core action
- most relevant content

If important content is pushed too low, simplify or reorder.

### 3. Tap target quality
Buttons, chips, toggles, and nav items must feel easy to hit.

Audit:
- height
- spacing between adjacent controls
- accidental-tap risk
- visual selected state clarity

### 4. Forms must feel lighter on mobile
Especially for `/matches/new` and edit flows.

Prioritize:
- deck selector
- opponent archetype
- result
- went first
- event type
- save action

Notes and secondary fields should not dominate.

### 5. Responsive layouts should be designed, not collapsed
Do not just let desktop rows wrap randomly.

Mobile should feel like:
- a deliberate layout
- reordered intelligently
- grouped intentionally

## Mobile audit checklist by page

### Landing page
Check:
- header simplicity
- hero stacking
- CTA visibility
- text density
- product preview size
- section spacing

Questions:
- Does it still feel premium on a phone?
- Is the hero too tall?
- Is the copy too long?

### Dashboard
Check:
- title and nav spacing
- empty state readability
- filter controls
- chart height and legibility
- deck summary scanability

Questions:
- What is visible before scrolling?
- Can the user quickly act?
- Are charts useful at this width?

### Decks
Check:
- card density
- manage/delete button layout
- create-deck form length
- whether list and form compete too much vertically

### Deck detail
Check:
- version list readability
- active version clarity
- form stacking
- action clarity

### Match logging
This is the highest-priority page.

Check:
- field order
- group spacing
- whether toggles are too cramped
- notes height
- tag chip wrapping
- save button visibility

Questions:
- Can I log a match fast with one hand?
- Is the important input near the top?
- Do any rows feel cramped or fatiguing?

### Matches
Check:
- filter stack order
- card/list readability
- edit/delete action placement
- note previews taking too much space

### Matchups
Check:
- filter stack
- row density
- note editor expansion
- whether matchup summaries remain readable on narrow screens

## Mobile navigation rules

Preferred mobile nav qualities:
- current page clearly visible
- not too many equally loud controls
- sign out separated from primary nav
- no awkward line wraps that feel accidental

If needed:
- simplify nav on mobile
- reduce label length only if still clear
- stack secondary actions below primary nav

## Mobile design standards

### Spacing
Use more vertical rhythm than on desktop.
Do not compress everything just to fit more.

### Cards
On mobile:
- fewer nested panels
- cleaner separation
- avoid deep card-inside-card structures

### Text
- support text should be shorter and quieter
- headings should stay strong
- labels should remain readable

### Charts
- only keep them if they remain legible
- reduce clutter
- simplify labels if needed

## Required output when using this skill

When you finish a mobile QA pass, report:

1. **Top mobile friction points found**
2. **What was improved**
3. **What still feels weak**
4. **The top 3 remaining mobile improvements**
5. **Files modified**

## Implementation guidance

When making mobile changes:
- keep desktop quality intact
- prefer layout/order improvements over adding UI complexity
- preserve functionality
- avoid introducing a dependency for something CSS/layout can solve

## Hard constraints

Do not:
- change auth flows
- change schema
- change calculations
- add heavy nav packages
- add unnecessary animation
- keep broken desktop-first layouts and call them responsive

## Success standard

A successful mobile QA pass means:
- navigation feels intentional
- landing page is clean and not overwhelming
- match logging is fast and comfortable
- deck/match/matchup pages are easy to scan
- nothing important feels cramped or hidden
