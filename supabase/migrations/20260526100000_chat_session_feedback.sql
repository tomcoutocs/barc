-- End-of-chat session feedback (testing / training review).

create table public.chat_session_feedback (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text,
  pet_id uuid references public.pets (id) on delete set null,
  comment text not null default '',
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint chat_session_feedback_thread_id_key unique (thread_id)
);

create index chat_session_feedback_user_id_idx on public.chat_session_feedback (user_id);
create index chat_session_feedback_created_at_idx on public.chat_session_feedback (created_at desc);

alter table public.chat_session_feedback enable row level security;

create policy "chat_session_feedback_insert_own"
  on public.chat_session_feedback for insert
  with check (auth.uid() = user_id);

create policy "chat_session_feedback_select_own"
  on public.chat_session_feedback for select
  using (auth.uid() = user_id);
