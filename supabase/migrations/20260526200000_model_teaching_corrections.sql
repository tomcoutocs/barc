-- Vet teaching corrections: global hints injected into future consult chats.

create table public.model_teaching_corrections (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  message_id uuid references public.chat_messages (id) on delete set null,
  thread_id uuid references public.chat_threads (id) on delete set null,
  scenario_context text not null default '',
  assistant_excerpt text not null default '',
  verdict text not null check (verdict in ('correct', 'incorrect', 'partial')),
  correction_notes text not null default '',
  species text check (species is null or species in ('dog', 'cat')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index model_teaching_corrections_active_created_idx
  on public.model_teaching_corrections (active, created_at desc);

alter table public.model_teaching_corrections enable row level security;

-- Active corrections are readable by any signed-in user (fed into model hints).
create policy "model_teaching_corrections_select_active"
  on public.model_teaching_corrections for select
  to authenticated
  using (active = true);

create policy "model_teaching_corrections_insert_own"
  on public.model_teaching_corrections for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "model_teaching_corrections_update_own"
  on public.model_teaching_corrections for update
  to authenticated
  using (auth.uid() = created_by);
