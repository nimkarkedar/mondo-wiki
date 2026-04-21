-- Enable Row Level Security on all public tables.
-- Context: every Supabase project exposes a public anon role via PostgREST
-- regardless of whether the app uses the anon key. RLS is the only barrier
-- between the public internet and these tables.
--
-- This app's API routes use SUPABASE_SERVICE_ROLE_KEY exclusively, which
-- bypasses RLS. So enabling RLS with no policies locks out anon + authenticated
-- while keeping our server-side code working.

alter table public.transcript_chunks enable row level security;
alter table public.qa_history        enable row level security;
alter table public.feedback          enable row level security;

-- Also revoke table privileges from anon / authenticated so PostgREST refuses
-- the request up-front rather than returning an empty RLS-filtered result.
revoke all on public.transcript_chunks from anon, authenticated;
revoke all on public.qa_history        from anon, authenticated;
revoke all on public.feedback          from anon, authenticated;

-- Sanity check: anyone adding a new public table in future should also run
-- `alter table public.<name> enable row level security;` before committing.
