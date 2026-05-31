alter table public.matches
add column if not exists metadata jsonb;

update public.matches
set metadata = '{}'::jsonb
where metadata is null;

alter table public.matches
alter column metadata set default '{}'::jsonb;

alter table public.matches
alter column metadata set not null;

do $$
declare
  constraint_name text;
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'matches'
      and c.conname = 'matches_result_check'
  ) then
    alter table public.matches
    drop constraint matches_result_check;
  end if;

  for constraint_name in
    select distinct c.conname
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'matches'
      and c.contype = 'c'
      and lower(pg_get_constraintdef(c.oid)) like '%result%'
      and lower(pg_get_constraintdef(c.oid)) like '%win%'
      and lower(pg_get_constraintdef(c.oid)) like '%loss%'
      and lower(pg_get_constraintdef(c.oid)) not like '%tie%'
  loop
    execute format(
      'alter table public.matches drop constraint %I',
      constraint_name
    );
  end loop;

  alter table public.matches
  add constraint matches_result_check
  check (result in ('win', 'loss', 'tie'));
end
$$;
