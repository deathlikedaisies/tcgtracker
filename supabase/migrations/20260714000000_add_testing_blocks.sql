create table if not exists public.testing_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid references public.decks(id) on delete set null,
  deck_version_id uuid references public.deck_versions(id) on delete set null,
  target_matchup text,
  focus_tags text[] not null default '{}'::text[],
  target_games integer not null default 5 check (target_games between 1 and 50),
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  source_review_reason text,
  source_event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.matches
add column if not exists testing_block_id uuid references public.testing_blocks(id) on delete set null;

create index if not exists testing_blocks_user_status_created_idx
on public.testing_blocks(user_id, status, created_at desc);

create index if not exists testing_blocks_deck_version_idx
on public.testing_blocks(deck_version_id);

create index if not exists matches_testing_block_id_idx
on public.matches(testing_block_id)
where testing_block_id is not null;

alter table public.testing_blocks enable row level security;

drop policy if exists testing_blocks_select_own on public.testing_blocks;
drop policy if exists testing_blocks_insert_own on public.testing_blocks;
drop policy if exists testing_blocks_update_own on public.testing_blocks;
drop policy if exists testing_blocks_delete_own on public.testing_blocks;

create policy testing_blocks_select_own
on public.testing_blocks
for select
to authenticated
using (user_id = auth.uid());

create policy testing_blocks_insert_own
on public.testing_blocks
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    deck_id is null
    or exists (
      select 1
      from public.decks
      where decks.id = testing_blocks.deck_id
        and decks.user_id = auth.uid()
    )
  )
  and (
    deck_version_id is null
    or exists (
      select 1
      from public.deck_versions
      join public.decks on decks.id = deck_versions.deck_id
      where deck_versions.id = testing_blocks.deck_version_id
        and decks.user_id = auth.uid()
    )
  )
  and (
    source_event_id is null
    or exists (
      select 1
      from public.events
      where events.id = testing_blocks.source_event_id
        and events.user_id = auth.uid()
    )
  )
);

create policy testing_blocks_update_own
on public.testing_blocks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy testing_blocks_delete_own
on public.testing_blocks
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists matches_insert_own on public.matches;
drop policy if exists matches_update_own on public.matches;

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
  and (
    testing_block_id is null
    or exists (
      select 1
      from public.testing_blocks
      where testing_blocks.id = matches.testing_block_id
        and testing_blocks.user_id = auth.uid()
    )
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
  and (
    testing_block_id is null
    or exists (
      select 1
      from public.testing_blocks
      where testing_blocks.id = matches.testing_block_id
        and testing_blocks.user_id = auth.uid()
    )
  )
);
