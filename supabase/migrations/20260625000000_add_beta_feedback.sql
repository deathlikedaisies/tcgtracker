create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  page_area text,
  severity text not null,
  message text not null,
  contact_ok boolean not null default false,
  user_email text,
  user_agent text,
  path text,
  created_at timestamptz not null default now(),
  constraint beta_feedback_type_check check (
    type in (
      'Bug',
      'Confusing / unclear',
      'Mobile layout issue',
      'Coaching insight felt wrong',
      'Slow / performance issue',
      'Suggestion',
      'Other'
    )
  ),
  constraint beta_feedback_page_area_check check (
    page_area is null
    or page_area in (
      'Dashboard',
      'Log game',
      'Logs',
      'Decks',
      'Matchups',
      'Review',
      'Profile',
      'Public profile / report',
      'Signup / login',
      'Other'
    )
  ),
  constraint beta_feedback_severity_check check (
    severity in ('Blocker', 'Annoying', 'Minor', 'Suggestion')
  ),
  constraint beta_feedback_message_length_check check (
    char_length(trim(message)) between 5 and 2000
  ),
  constraint beta_feedback_path_length_check check (
    path is null or char_length(path) <= 200
  )
);

create index if not exists beta_feedback_user_id_idx
  on public.beta_feedback(user_id);

create index if not exists beta_feedback_created_at_idx
  on public.beta_feedback(created_at desc);

alter table public.beta_feedback enable row level security;

drop policy if exists beta_feedback_insert_own on public.beta_feedback;
drop policy if exists beta_feedback_select_own on public.beta_feedback;

create policy beta_feedback_insert_own
on public.beta_feedback
for insert
to authenticated
with check (user_id = auth.uid());

create policy beta_feedback_select_own
on public.beta_feedback
for select
to authenticated
using (user_id = auth.uid());
