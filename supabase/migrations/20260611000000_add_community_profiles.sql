create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  country text,
  favorite_archetype text,
  main_deck_name text,
  current_testing_focus text,
  profile_visibility text not null default 'private',
  analytics_visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format_check check (
    handle = lower(handle)
    and handle ~ '^[a-z0-9_-]{3,30}$'
    and handle not in (
      'admin',
      'settings',
      'dashboard',
      'login',
      'signup',
      'api',
      'demo',
      'review',
      'matchups',
      'decks',
      'matches',
      'u'
    )
  ),
  constraint profiles_display_name_length_check check (char_length(trim(display_name)) between 1 and 60),
  constraint profiles_profile_visibility_check check (
    profile_visibility in ('private', 'link_only', 'public')
  ),
  constraint profiles_analytics_visibility_check check (
    analytics_visibility in ('private', 'aggregate_only', 'detailed')
  )
);

create table if not exists public.profile_public_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_matches integer not null default 0,
  total_decks integer not null default 0,
  total_versions integer not null default 0,
  win_count integer not null default 0,
  loss_count integer not null default 0,
  tie_count integer not null default 0,
  win_rate numeric,
  active_weeks integer not null default 0,
  most_played_deck text,
  strongest_matchup text,
  weakest_matchup text,
  current_focus text,
  best_improvement text,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  report_type text not null,
  title text not null,
  summary jsonb not null default '{}'::jsonb,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_reports_slug_format_check check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9-]{4,120}$'
  ),
  constraint shared_reports_type_check check (
    report_type in (
      'profile_summary',
      'matchup',
      'deck',
      'version',
      'review',
      'tournament_prep'
    )
  ),
  constraint shared_reports_visibility_check check (
    visibility in ('private', 'link_only', 'public')
  )
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table if not exists public.profile_reactions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  constraint profile_reactions_target_type_check check (
    target_type in ('profile', 'shared_report')
  ),
  constraint profile_reactions_reaction_type_check check (
    reaction_type in ('kudos', 'useful', 'testing_this_too', 'good_tech')
  ),
  constraint profile_reactions_unique_actor_target unique (
    actor_id,
    target_type,
    target_id,
    reaction_type
  )
);

create index if not exists profiles_handle_idx on public.profiles(handle);
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_visibility_idx on public.profiles(profile_visibility);
create index if not exists shared_reports_slug_idx on public.shared_reports(slug);
create index if not exists shared_reports_user_id_idx on public.shared_reports(user_id);
create index if not exists shared_reports_visibility_idx on public.shared_reports(visibility);
create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists profile_reactions_target_idx on public.profile_reactions(target_type, target_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists profile_public_stats_set_updated_at on public.profile_public_stats;
create trigger profile_public_stats_set_updated_at
before update on public.profile_public_stats
for each row
execute function public.set_updated_at();

drop trigger if exists shared_reports_set_updated_at on public.shared_reports;
create trigger shared_reports_set_updated_at
before update on public.shared_reports
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_public_stats enable row level security;
alter table public.shared_reports enable row level security;
alter table public.follows enable row level security;
alter table public.profile_reactions enable row level security;

drop policy if exists profiles_select_visible_or_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select_visible_or_own
on public.profiles
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or profile_visibility in ('public', 'link_only')
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy profiles_delete_own
on public.profiles
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists profile_public_stats_select_visible_or_own on public.profile_public_stats;
drop policy if exists profile_public_stats_insert_own on public.profile_public_stats;
drop policy if exists profile_public_stats_update_own on public.profile_public_stats;
drop policy if exists profile_public_stats_delete_own on public.profile_public_stats;

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
      and profiles.profile_visibility in ('public', 'link_only')
      and profiles.analytics_visibility <> 'private'
  )
);

create policy profile_public_stats_insert_own
on public.profile_public_stats
for insert
to authenticated
with check (user_id = auth.uid());

create policy profile_public_stats_update_own
on public.profile_public_stats
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy profile_public_stats_delete_own
on public.profile_public_stats
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists shared_reports_select_visible_or_own on public.shared_reports;
drop policy if exists shared_reports_insert_own on public.shared_reports;
drop policy if exists shared_reports_update_own on public.shared_reports;
drop policy if exists shared_reports_delete_own on public.shared_reports;

create policy shared_reports_select_visible_or_own
on public.shared_reports
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or visibility in ('public', 'link_only')
);

create policy shared_reports_insert_own
on public.shared_reports
for insert
to authenticated
with check (user_id = auth.uid());

create policy shared_reports_update_own
on public.shared_reports
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy shared_reports_delete_own
on public.shared_reports
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists follows_select_related_to_self on public.follows;
drop policy if exists follows_insert_own on public.follows;
drop policy if exists follows_delete_own on public.follows;

create policy follows_select_related_to_self
on public.follows
for select
to authenticated
using (
  follower_id = auth.uid()
  or following_id = auth.uid()
);

create policy follows_insert_own
on public.follows
for insert
to authenticated
with check (follower_id = auth.uid());

create policy follows_delete_own
on public.follows
for delete
to authenticated
using (follower_id = auth.uid());

drop policy if exists profile_reactions_select_visible_targets_or_own on public.profile_reactions;
drop policy if exists profile_reactions_insert_own on public.profile_reactions;
drop policy if exists profile_reactions_delete_own on public.profile_reactions;

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
        and profiles.profile_visibility in ('public', 'link_only')
    )
  )
  or (
    target_type = 'shared_report'
    and exists (
      select 1
      from public.shared_reports
      where shared_reports.id = profile_reactions.target_id
        and shared_reports.visibility in ('public', 'link_only')
    )
  )
);

create policy profile_reactions_insert_own
on public.profile_reactions
for insert
to authenticated
with check (actor_id = auth.uid());

create policy profile_reactions_delete_own
on public.profile_reactions
for delete
to authenticated
using (actor_id = auth.uid());
