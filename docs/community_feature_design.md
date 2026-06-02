# SixPrizer Community Feature Design

## Summary

Community should extend SixPrizer from a private testing tool into a product that supports identity, belonging, and healthy comparison without turning into a toxic leaderboard app. The default experience should remain private and coach-like. Public sharing should be opt-in, granular, and conservative.

The best Community version of SixPrizer is not "who has the best win rate." It is:
- who is testing consistently
- who is finding clear signals faster
- who is improving their list and matchup process
- who is contributing useful, reviewable data

## 1. Current App Structure Audit

### Existing routes

Current authenticated app areas:
- `/dashboard`
- `/decks`
- `/matches/new`
- `/matches`
- `/matchups`
- `/onboarding`

Current demo routes mirror the core product.

### Existing navigation

The current sidebar/nav focuses on:
- Overview
- Log game
- Sessions
- Decks
- Matchups

There is no Community entry point yet.

### Existing user/data model

Current persistent user-linked data is mostly:
- `auth.users` for authentication
- `decks`
- `deck_versions`
- `matches`
- `match_tags`

There is no dedicated profile/community schema yet.

### Public/private profile support

There is no profile table and no explicit public profile model today.

Implication:
- Community should not rely on `auth.users.user_metadata` as the primary profile store.
- Public sharing needs its own table and settings model.
- Private-by-default should be the baseline.

## 2. Recommended Information Architecture

### MVP pages

Recommended first-phase routes:
- `/community` - community home, featured profiles, lightweight aggregate views, and opt-in prompts
- `/profile` - the signed-in user's profile
- `/profile/edit` - edit profile and privacy settings
- `/community/leaderboards` - healthy, non-toxic comparison surfaces

### Later pages

Potential later additions:
- `/community/groups`
- `/community/groups/[groupId]`
- `/community/leaderboards/[boardId]`
- `/profile/[username]` for public profile viewing

### Navigation placement

Community should appear as a first-class tab in the authenticated nav, but not replace core testing actions.

Recommended nav order:
- Overview
- Log game
- Sessions
- Decks
- Matchups
- Community

The Community tab should feel secondary to logging and analysis, not a distraction from them.

## 3. Profile Design

### Core profile fields

Recommended profile fields:
- `username` or `display_name`
- avatar
- favorite archetype
- main deck
- local league / region, optional
- public/private profile toggle
- current mission, optional public
- recent testing focus, optional public

### Profile UX goals

The profile should feel like a player card and a testing identity, not a social media clone.

Useful elements:
- current avatar and display name
- favorite deck/archetype
- current testing focus
- recent improvement trend
- optional community badges
- optional "currently testing" card

### What should not be public by default

Never expose by default:
- private notes
- match learnings
- raw session text
- hidden match comments

## 4. Privacy Model

### Default stance

Profiles should default to private or limited visibility.

### Suggested visibility modes

1. Private profile
   - only the owner can see the full profile

2. Public profile, anonymized analytics
   - display name, avatar, archetype identity
   - summary analytics only
   - no raw match notes

3. Public profile with selected stats
   - user chooses which metrics are public
   - still no private notes or learnings

### Recommended visibility controls

Allow toggles for:
- profile visible to others
- recent mission visible
- current testing focus visible
- win rate visible
- improvement trend visible
- league / region visible

### Hard privacy rules

Never expose private match notes by default.
Never expose private learnings by default.
Never expose raw opponent scouting text by default unless explicitly shared.

## 5. Community Analytics

Community analytics should be opt-in and aggregate-first.

Recommended aggregate views:
- most tested archetypes
- most common issue tags by matchup
- community matchup pressure
- popular deck versions / archetypes
- weekly meta snapshot

### Design principle

Community analytics should answer:
- What is the field testing right now?
- What is the community struggling with?
- Which archetypes are getting worked on?

Not:
- who is "best" overall
- who has the highest win rate this week
- who logged the most volume

## 6. Leaderboard Recommendations

### Avoid as a default leaderboard

Do not make raw win rate the hero leaderboard.
Do not rank small samples against serious testing blocks.

### Better leaderboard types

Recommended leaderboards:
- Mission completions
- Most improved matchup
- Best testing consistency
- Best documented testing block
- Deck scientist: versions tested
- Meta scout: unique archetypes logged
- Comeback analyst: reviewed losses

### If win-rate leaderboards are included

Make them opt-in and heavily gated:
- minimum sample size
- confidence labels
- recent season windows
- clear "needs more games" state
- no ranking on tiny samples

### Healthy comparison design

Comparison should emphasize:
- progress
- signal quality
- testing quality
- improvement
- consistency

Not:
- raw grind volume
- small-sample luck
- absolute win rate alone

## 7. Retention Loops

Community improves retention by strengthening three motivations:

### Identity

Users own a profile that reflects their testing identity:
- favorite archetype
- deck family
- current mission
- testing focus

This makes the product feel personal, not generic.

### Competence

Community surfaces improvement:
- clearer matchup readings
- documented testing blocks
- mission completions
- version comparisons

This rewards users for learning, not just winning.

### Relatedness

Lightweight social proof makes the product feel shared:
- group pages later
- weekly meta snapshot
- community archetype trends
- opt-in comparison

This creates "I am part of a testing community" without requiring chat or noisy social features.

## 8. Recommended MVP

### MVP scope

Phase 1 should include:
- profile table
- privacy settings table
- `/profile`
- `/profile/edit`
- `/community`
- `/community/leaderboards`
- public profile cards
- aggregate community views
- opt-in sharing controls

### MVP behavior

The MVP should support:
- setting a display name and avatar
- selecting favorite archetype and main deck
- choosing public vs private visibility
- showing a limited public profile card
- showing safe aggregate stats

### MVP exclusions

Hold back until later:
- groups
- comments
- direct messaging
- broad public feeds
- open leaderboard by raw win rate

## 9. Later Phases

### Phase 2

Add:
- `/community/groups`
- shared testing groups
- group-specific mission boards
- weekly community challenge prompts

### Phase 3

Add:
- leaderboard snapshots
- public profile comparison views
- community season recaps
- opt-in badge system

### Phase 4

Add:
- controlled social actions like endorsements or reactions
- curated group feeds
- shared deck experiments

## 10. Minimal Technical Model

### Proposed tables

#### `profiles`
Primary user profile table keyed to `auth.users.id`.

Suggested fields:
- `user_id` uuid primary key references `auth.users(id)`
- `username` text unique
- `display_name` text
- `avatar_url` text
- `favorite_archetype` text
- `main_deck_id` uuid nullable
- `region` text nullable
- `current_mission_public` boolean default false
- `testing_focus_public` boolean default false
- `profile_visibility` text default `'private'`
- `created_at`, `updated_at`

#### `profile_settings`
Optional settings table if you want to separate preferences from public identity.

Suggested fields:
- `user_id` uuid primary key
- `show_win_rate` boolean default false
- `show_recent_focus` boolean default false
- `show_current_mission` boolean default false
- `show_region` boolean default false
- `allow_public_comparison` boolean default false
- `hide_notes_always` boolean default true
- `updated_at`

#### `public_profile_stats`
Could be a computed view or materialized table later.

Suggested outputs:
- recent matches played
- matchup improvement metrics
- deck versions tested
- mission completions
- confidence-aware matchup summaries

### Later tables

#### `groups`
- group identity
- invite / membership
- shared mission context

#### `leaderboard_snapshots`
- season
- leaderboard type
- snapshot timestamp
- aggregate ranking rows

### Implementation note

Keep public stats computed from existing match/deck tables rather than duplicating core facts early. That keeps the schema simple and avoids data drift.

## 11. Product UI Proposal

### Community home (`/community`)

The Community page should answer:
- what the community is testing
- what is trending
- what missions people are completing
- what I should compare my own data against

Suggested sections:
- featured community profiles
- weekly meta snapshot
- popular archetypes
- healthy leaderboards
- opt-in profile setup CTA

### Profile page (`/profile`)

The profile page should show:
- avatar
- display name
- favorite archetype
- main deck
- region
- public/private status
- public stats preview
- recent mission cards

### Edit page (`/profile/edit`)

Should prioritize:
- identity
- visibility toggles
- safe sharing controls
- content preview

### Leaderboards page (`/community/leaderboards`)

Should default to:
- mission completions
- improved matchup
- testing consistency
- documented testing blocks

Raw win rate should be behind filters and confidence controls.

## 12. Risk Assessment

### Privacy risk

Risk:
- leaking private notes or scouting details

Mitigation:
- private-by-default
- explicit visibility toggles
- no raw notes in public surfaces
- separate public summary model

### Toxic comparison risk

Risk:
- users chase raw win rate or volume

Mitigation:
- prioritize improvement, consistency, and mission completion
- avoid raw win-rate hero boards
- gate rankings with confidence and sample size

### Small sample risk

Risk:
- misleading comparisons from tiny samples

Mitigation:
- minimum sample sizes
- confidence labels
- windowed metrics
- suppress "best" labels when evidence is weak

### Metric gaming risk

Risk:
- users avoid logging losses or cherry-pick data

Mitigation:
- reward documented testing blocks
- highlight improvement, not just wins
- show reviewable mission progress

### Social friction risk

Risk:
- users feel forced to share too much

Mitigation:
- opt-in sharing
- granular visibility controls
- private remains first-class

## 13. Recommended Leaderboard Policy

If a leaderboard exists, the policy should be:
- no default raw win-rate ranking
- no ranking on tiny samples
- no private-note exposure
- confidence labels on every metric
- improvement and testing quality first

Best default ordering:
1. Mission completions
2. Most improved matchup
3. Testing consistency
4. Documented testing blocks
5. Deck scientist / meta scout

## 14. Why This Helps Retention

Community can improve retention if it reinforces:
- ownership: "this is my profile and testing identity"
- progress: "my decisions are becoming clearer"
- belonging: "other players are testing too"
- accountability: "my mission is visible"
- usefulness: "the community data helps me choose what to test next"

This is healthier than classic social competition because the core reward is learning, not status.

## 15. Recommendation

Build Community in this order:

1. Profile foundation
   - profile table
   - privacy settings
   - profile edit page

2. Community home
   - safe aggregate views
   - opt-in profile cards
   - weekly meta snapshot

3. Healthy leaderboards
   - mission completions
   - improvement
   - consistency

4. Groups later
   - testing groups
   - shared mission contexts

This sequence keeps the feature aligned with SixPrizer's core value: better testing decisions.
