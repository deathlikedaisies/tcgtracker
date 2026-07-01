alter table public.events
add column if not exists match_structure text not null default 'bo1';

alter table public.events
drop constraint if exists events_match_structure_check;

alter table public.events
add constraint events_match_structure_check
check (match_structure in ('bo1', 'bo3'));
