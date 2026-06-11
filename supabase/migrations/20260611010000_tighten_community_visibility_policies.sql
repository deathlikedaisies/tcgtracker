drop policy if exists profiles_select_visible_or_own on public.profiles;
create policy profiles_select_visible_or_own
on public.profiles
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or profile_visibility = 'public'
);

drop policy if exists profile_public_stats_select_visible_or_own on public.profile_public_stats;
create policy profile_public_stats_select_visible_or_own
on public.profile_public_stats
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.user_id = profile_public_stats.user_id
      and profiles.profile_visibility = 'public'
      and profiles.analytics_visibility <> 'private'
  )
);

drop policy if exists shared_reports_select_visible_or_own on public.shared_reports;
create policy shared_reports_select_visible_or_own
on public.shared_reports
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or visibility = 'public'
);

drop policy if exists profile_reactions_select_visible_targets_or_own on public.profile_reactions;
create policy profile_reactions_select_visible_targets_or_own
on public.profile_reactions
for select
to authenticated, anon
using (
  actor_id = auth.uid()
  or (
    target_type = 'profile'
    and exists (
      select 1
      from public.profiles
      where profiles.user_id = profile_reactions.target_user_id
        and profiles.profile_visibility = 'public'
    )
  )
  or (
    target_type = 'shared_report'
    and exists (
      select 1
      from public.shared_reports
      where shared_reports.id = profile_reactions.target_id
        and shared_reports.visibility = 'public'
    )
  )
);
