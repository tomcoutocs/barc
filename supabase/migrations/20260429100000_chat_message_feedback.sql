-- Per-message thumbs feedback for steering future replies (stored hints, not model weights).
alter table public.chat_messages
  add column if not exists feedback_rating text;

alter table public.chat_messages drop constraint if exists chat_messages_feedback_rating_check;

alter table public.chat_messages
  add constraint chat_messages_feedback_rating_check
  check (feedback_rating is null or feedback_rating in ('up', 'down'));

alter table public.chat_messages
  add column if not exists feedback_at timestamptz;
