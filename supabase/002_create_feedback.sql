-- Create the feedback table that the app has been writing to since launch.
-- It was referenced by /api/feedback but never actually created, so every
-- thumbs up/down has silently failed. Table ships with RLS enabled from the
-- start — the app uses the service role which bypasses RLS.
--
-- Applied to production 2026-04-22.

create table public.feedback (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  question       text        not null,
  short_answer   text,
  long_answer    text,
  rating         text        not null check (rating in ('makes_sense','doesnt_make_sense')),
  qa_history_id  uuid        references public.qa_history(id) on delete set null
);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

create index feedback_qa_history_id_idx on public.feedback(qa_history_id);
