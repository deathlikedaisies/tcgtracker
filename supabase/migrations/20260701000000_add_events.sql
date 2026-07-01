create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  event_date date not null,
  event_type text not null check (
    event_type in (
      'Local',
      'League Challenge',
      'League Cup',
      'Regional',
      'International',
      'Online tournament',
      'TCG Live ladder session',
      'Testing block',
      'Other'
    )
  ),
  format text not null default 'Standard' check (format in ('Standard', 'Expanded', 'Other')),
  deck_id uuid references public.decks(id) on delete set null,
  deck_version_id uuid references public.deck_versions(id) on delete set null,
  placement text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round_number integer not null,
  opponent_deck_id uuid references public.decks(id) on delete set null,
  opponent_deck_name text not null,
  result text not null check (result in ('win', 'loss', 'tie')),
  match_score text,
  went_first boolean,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, round_number)
);

create unique index if not exists event_rounds_match_id_unique_idx
on public.event_rounds(match_id)
where match_id is not null;

create index if not exists events_user_id_event_date_idx on public.events(user_id, event_date desc);
create index if not exists events_deck_version_id_idx on public.events(deck_version_id);
create index if not exists event_rounds_event_id_idx on public.event_rounds(event_id);
create index if not exists event_rounds_user_id_idx on public.event_rounds(user_id);
create index if not exists event_rounds_match_id_idx on public.event_rounds(match_id);

alter table public.events enable row level security;
alter table public.event_rounds enable row level security;

drop policy if exists events_select_own on public.events;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_update_own on public.events;
drop policy if exists events_delete_own on public.events;

create policy events_select_own
on public.events
for select
to authenticated
using (user_id = auth.uid());

create policy events_insert_own
on public.events
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    deck_id is null
    or exists (
      select 1
      from public.decks
      where decks.id = events.deck_id
        and decks.user_id = auth.uid()
    )
  )
  and (
    deck_version_id is null
    or exists (
      select 1
      from public.deck_versions
      join public.decks on decks.id = deck_versions.deck_id
      where deck_versions.id = events.deck_version_id
        and decks.user_id = auth.uid()
    )
  )
);

create policy events_update_own
on public.events
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy events_delete_own
on public.events
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists event_rounds_select_own on public.event_rounds;
drop policy if exists event_rounds_insert_own on public.event_rounds;
drop policy if exists event_rounds_update_own on public.event_rounds;
drop policy if exists event_rounds_delete_own on public.event_rounds;

create policy event_rounds_select_own
on public.event_rounds
for select
to authenticated
using (user_id = auth.uid());

create policy event_rounds_insert_own
on public.event_rounds
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.events
    where events.id = event_rounds.event_id
      and events.user_id = auth.uid()
  )
);

create policy event_rounds_update_own
on public.event_rounds
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy event_rounds_delete_own
on public.event_rounds
for delete
to authenticated
using (user_id = auth.uid());
