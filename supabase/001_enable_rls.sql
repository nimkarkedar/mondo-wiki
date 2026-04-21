-- Enable Row Level Security on all public tables.
-- Context: every Supabase project exposes the public schema via PostgREST on
-- the anon role regardless of whether the app uses the anon key. RLS is the
-- only barrier between that endpoint and the database.
--
-- This app's API routes use SUPABASE_SERVICE_ROLE_KEY exclusively, which
-- bypasses RLS. So enabling RLS with no policies locks out anon + authenticated
-- while keeping our server-side code working.
--
-- Applied to production 2026-04-22.

alter table public.transcript_chunks enable row level security;
alter table public.qa_history        enable row level security;

revoke all on public.transcript_chunks from anon, authenticated;
revoke all on public.qa_history        from anon, authenticated;
