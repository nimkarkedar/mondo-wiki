-- Clean up two Supabase Security Advisor warnings.
-- Applied to production 2026-04-22.

-- 1. Lock down match_chunks search_path so no one can hijack the RPC by
--    shadowing objects in a higher-priority schema.
alter function public.match_chunks(query_embedding vector, match_count integer)
  set search_path = public, pg_catalog;

-- 2. Drop two leftover policies with USING (true) / WITH CHECK (true) on
--    qa_history. They did nothing useful (service role bypasses RLS; anon
--    and authenticated have been revoked table privileges) but the linter
--    correctly flags "always true" policies as risky patterns.
drop policy if exists "Allow public read"         on public.qa_history;
drop policy if exists "Allow service role insert" on public.qa_history;
