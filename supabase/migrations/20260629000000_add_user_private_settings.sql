create table if not exists public.user_private_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pokemon_tcg_live_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_private_settings_tcg_live_username_check check (
    pokemon_tcg_live_username is null
    or pokemon_tcg_live_username ~ '^[A-Za-z0-9_]{2,32}$'
  )
);

drop trigger if exists user_private_settings_set_updated_at on public.user_private_settings;
create trigger user_private_settings_set_updated_at
before update on public.user_private_settings
for each row
execute function public.set_updated_at();

alter table public.user_private_settings enable row level security;

drop policy if exists user_private_settings_select_own on public.user_private_settings;
drop policy if exists user_private_settings_insert_own on public.user_private_settings;
drop policy if exists user_private_settings_update_own on public.user_private_settings;
drop policy if exists user_private_settings_delete_own on public.user_private_settings;

create policy user_private_settings_select_own
on public.user_private_settings
for select
using (auth.uid() = user_id);

create policy user_private_settings_insert_own
on public.user_private_settings
for insert
with check (auth.uid() = user_id);

create policy user_private_settings_update_own
on public.user_private_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy user_private_settings_delete_own
on public.user_private_settings
for delete
using (auth.uid() = user_id);
