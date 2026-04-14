create extension if not exists pgcrypto;

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archetype text not null,
  format text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.deck_versions (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  name text not null,
  decklist text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_version_id uuid not null references public.deck_versions(id) on delete cascade,
  opponent_archetype text not null,
  opponent_variant text,
  result text not null check (result in ('win', 'loss')),
  went_first boolean,
  event_type text check (event_type in ('casual', 'testing', 'tournament')),
  format text,
  notes text,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.match_tags (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  tag text not null
);

create table if not exists public.matchup_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  your_archetype text not null,
  opponent_archetype text not null,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.decks enable row level security;
alter table public.deck_versions enable row level security;
alter table public.matches enable row level security;
alter table public.match_tags enable row level security;
alter table public.matchup_notes enable row level security;

create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists deck_versions_deck_id_idx on public.deck_versions(deck_id);
create index if not exists matches_user_id_idx on public.matches(user_id);
create index if not exists matches_deck_version_id_idx on public.matches(deck_version_id);
create index if not exists match_tags_match_id_idx on public.match_tags(match_id);

drop policy if exists decks_select_own on public.decks;
drop policy if exists decks_insert_own on public.decks;
drop policy if exists decks_update_own on public.decks;
drop policy if exists decks_delete_own on public.decks;

create policy decks_select_own
on public.decks
for select
to authenticated
using (user_id = auth.uid());

create policy decks_insert_own
on public.decks
for insert
to authenticated
with check (user_id = auth.uid());

create policy decks_update_own
on public.decks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy decks_delete_own
on public.decks
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists deck_versions_select_own_deck on public.deck_versions;
drop policy if exists deck_versions_insert_own_deck on public.deck_versions;
drop policy if exists deck_versions_update_own_deck on public.deck_versions;
drop policy if exists deck_versions_delete_own_deck on public.deck_versions;

create policy deck_versions_select_own_deck
on public.deck_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = deck_versions.deck_id
      and decks.user_id = auth.uid()
  )
);

create policy deck_versions_insert_own_deck
on public.deck_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.decks
    where decks.id = deck_versions.deck_id
      and decks.user_id = auth.uid()
  )
);

create policy deck_versions_update_own_deck
on public.deck_versions
for update
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = deck_versions.deck_id
      and decks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.decks
    where decks.id = deck_versions.deck_id
      and decks.user_id = auth.uid()
  )
);

create policy deck_versions_delete_own_deck
on public.deck_versions
for delete
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = deck_versions.deck_id
      and decks.user_id = auth.uid()
  )
);

drop policy if exists matches_select_own on public.matches;
drop policy if exists matches_insert_own on public.matches;
drop policy if exists matches_update_own on public.matches;
drop policy if exists matches_delete_own on public.matches;

create policy matches_select_own
on public.matches
for select
to authenticated
using (user_id = auth.uid());

create policy matches_insert_own
on public.matches
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.deck_versions
    join public.decks on decks.id = deck_versions.deck_id
    where deck_versions.id = matches.deck_version_id
      and decks.user_id = auth.uid()
  )
);

create policy matches_update_own
on public.matches
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.deck_versions
    join public.decks on decks.id = deck_versions.deck_id
    where deck_versions.id = matches.deck_version_id
      and decks.user_id = auth.uid()
  )
);

create policy matches_delete_own
on public.matches
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists match_tags_select_own_match on public.match_tags;
drop policy if exists match_tags_insert_own_match on public.match_tags;
drop policy if exists match_tags_update_own_match on public.match_tags;
drop policy if exists match_tags_delete_own_match on public.match_tags;

create policy match_tags_select_own_match
on public.match_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.matches
    where matches.id = match_tags.match_id
      and matches.user_id = auth.uid()
  )
);

create policy match_tags_insert_own_match
on public.match_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.matches
    where matches.id = match_tags.match_id
      and matches.user_id = auth.uid()
  )
);

create policy match_tags_update_own_match
on public.match_tags
for update
to authenticated
using (
  exists (
    select 1
    from public.matches
    where matches.id = match_tags.match_id
      and matches.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.matches
    where matches.id = match_tags.match_id
      and matches.user_id = auth.uid()
  )
);

create policy match_tags_delete_own_match
on public.match_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.matches
    where matches.id = match_tags.match_id
      and matches.user_id = auth.uid()
  )
);

drop policy if exists matchup_notes_select_own on public.matchup_notes;
drop policy if exists matchup_notes_insert_own on public.matchup_notes;
drop policy if exists matchup_notes_update_own on public.matchup_notes;
drop policy if exists matchup_notes_delete_own on public.matchup_notes;

create policy matchup_notes_select_own
on public.matchup_notes
for select
to authenticated
using (user_id = auth.uid());

create policy matchup_notes_insert_own
on public.matchup_notes
for insert
to authenticated
with check (user_id = auth.uid());

create policy matchup_notes_update_own
on public.matchup_notes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy matchup_notes_delete_own
on public.matchup_notes
for delete
to authenticated
using (user_id = auth.uid());
