# Community Profiles Privacy Audit

Date: 2026-06-11

## Scope

This audit covers the new community/profile MVP:

- `profiles`
- `profile_public_stats`
- `shared_reports`
- `follows`
- `profile_reactions`
- `/settings/profile`
- `/profile/setup`
- `/u/[handle]`
- `/r/[slug]`

## Default Privacy

- New profiles default to `profile_visibility = private`.
- New profiles default to `analytics_visibility = private`.
- Public profile pages do not read directly from raw `matches`, `match_tags`, or private notes.
- Public-facing analytics come from `profile_public_stats` and owner-approved `shared_reports`.

## What Remains Private

- Raw match logs
- Match notes
- Match-by-match history
- Opponent identities beyond aggregate matchup names
- Full decklists
- Private deck version notes
- Private/shared reports with `visibility = private`

## What Can Become Public

- Display name
- Handle
- Avatar URL
- Bio
- Favorite archetype
- Main deck name
- Current testing focus
- Aggregate stats in `profile_public_stats` when analytics visibility allows it
- Explicitly shared reports in `shared_reports`

## Visibility Model

### Profiles

- `private`: owner only
- `link_only`: viewable by direct route, not listed anywhere in the MVP
- `public`: viewable by direct route

### Analytics

- `private`: no public aggregate stats
- `aggregate_only`: safe aggregate profile stats only
- `detailed`: aggregate stats plus public/shared reports

### Shared Reports

- `private`: owner only
- `link_only`: viewable by direct slug
- `public`: viewable by direct slug

## RLS Summary

RLS was added to all community tables.

- `profiles`
  - owner can read/write own row
  - only `public` profiles are selectable through normal anon/authenticated table reads
  - `link_only` profiles are served only through server-side handle lookup logic
- `profile_public_stats`
  - owner can read/write own row
  - public reads require a `public` profile and non-private analytics visibility
- `shared_reports`
  - owner can manage own reports
  - only `public` reports are selectable through normal anon/authenticated table reads
  - `link_only` reports are served only through server-side slug lookup logic
- `follows`
  - reads limited to rows involving the authenticated user
  - writes limited to `follower_id = auth.uid()`
- `profile_reactions`
  - writes limited to `actor_id = auth.uid()`
  - reads allowed for visible public targets and the acting user

## Security Fixes Made During Audit

- Added `import "server-only"` protection to the Supabase admin helper and verified it is not imported by any client component.
- Tightened public RLS so `link_only` profiles and reports are no longer discoverable through regular table queries.
- Stopped listing `link_only` reports on public profile pages.
- Prevented report-page owner identity leakage when the owner profile is private.
- Added target visibility validation before follow/reaction writes that use admin helpers.
- Removed handle-based slug seeding for shared reports to avoid leaking a private profile handle through public/link-only report URLs.
- Fixed Playwright config to load `.env.local`, so authenticated/community routes actually run in E2E instead of skipping.

## Server-Side Safety

- Public pages use a server-side DAL in `src/lib/community.ts`.
- The DAL applies manual visibility checks before returning profile or report data.
- Public stats are derived by `buildPublicProfileStats(userId)` and exclude private notes and raw logs.
- Matchup shared reports only include safe aggregate fields:
  - matchup name
  - deck name or scope label
  - aggregate record
  - public issue/positive tags
  - recommendation

## Manual Checks Performed

- Dedicated test account profile was created with default `private/private` visibility.
- Anonymous request to `/u/domz_test` while private returned the branded `Profile unavailable` state.
- The same profile was temporarily switched to `public/detailed`, refreshed, and then:
  - anonymous request to `/u/domz_test` rendered the public profile correctly
  - aggregate stats were visible
  - no raw match IDs, decklists, or private notes appeared on the page
- Temporary `public` and `private` audit reports were created for the dedicated test account.
  - anonymous request to `/r/audit-public-report` rendered the report page correctly
  - anonymous request to `/r/audit-private-report` returned the branded `Report unavailable` state
  - the public report exposed only safe summary JSON, not raw history or notes
- The persisted `/matchups` -> `Create report link` flow was verified after the server-action fix.
  - clicking the button created a `link_only` report and redirected to `/r/[slug]`
  - the resulting report page showed only safe aggregate data
  - anonymous request to the same link-only slug succeeded by direct URL
  - because the owner profile was private at the time, the anonymous report view did not expose the owner's `@handle`
- The dedicated test profile was reverted back to `private/private` after the audit.
- Temporary audit reports were deleted after the audit.
- Authenticated `/settings/profile`, `/dashboard`, and `/matches/new` loaded without horizontal overflow in the manual browser pass.
- Public `/demo`, `/u/domz_test`, and `/r/audit-public-report` loaded without horizontal overflow during the temporary public audit state.
- Anonymous `/profile/setup` correctly redirected to the login page.

## Manual Check Limitations

- I did not create a second production auth user just to test cross-user mutation attempts. Instead, I verified the protection through:
  - UI owner/non-owner control separation
  - server action auth requirements
  - RLS policy checks
  - server-side target visibility validation
- The `/matchups` persisted share-link button currently falls back to `?share_error=1` instead of completing successfully. Public/private report privacy was still verified using temporary safe audit rows for the dedicated test account.

## Remaining Limitations

- Link-only visibility is implemented as direct-route accessibility rather than a separate unlisted indexing system.
- The MVP does not yet include profile discovery or listings, so link-only and public are both effectively direct-link only.
- Reactions and follows have no feed or notifications yet.
- Shared report creation is currently implemented from Matchups first; other report types can be layered in later.

## Conclusion

The MVP community layer keeps private testing data private by default and exposes only safe profile fields, derived aggregate stats, and explicitly shared reports.
