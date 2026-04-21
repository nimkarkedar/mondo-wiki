# Security — Ask TGP

## The rule that matters most

**Every table in the `public` schema must have Row Level Security enabled.**

Supabase exposes the `public` schema via PostgREST on the `anon` role whether
or not the app uses the anon key. RLS is the only barrier between that
endpoint and the database. A table without RLS = publicly readable /
writable by anyone who knows the project URL.

Our API routes use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS — so
turning RLS on with no policies locks out the public internet without
breaking the app.

## Before shipping a schema change

1. Added a new table?
   ```sql
   alter table public.<name> enable row level security;
   revoke all on public.<name> from anon, authenticated;
   ```
2. Added a new RPC? Default is `SECURITY INVOKER` — leave it that way.
   Only use `SECURITY DEFINER` with a clear reason and a narrow function.
3. Run the **Supabase Security Advisor** (Dashboard → Advisors → Security).
   Fix every error before deploying. Warnings get a judgement call.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` — never logged, never sent to the client,
  never committed. Lives only in Vercel env vars + local `.env.local`.
- `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` — same treatment.
- `GOOGLE_PRIVATE_KEY` — same.
- `.env.local` is gitignored. Verify with `git check-ignore .env.local`.

## When something gets flagged

Don't dismiss it. Walk through:

1. Can the **anon** role hit it? (If yes, fix immediately.)
2. Can the **authenticated** role hit it if we add auth later? (Plan a
   policy.)
3. Can it leak data via joins / RPCs? (Check `SECURITY DEFINER` functions.)

## Applied migrations

- [`supabase/001_enable_rls.sql`](supabase/001_enable_rls.sql) — RLS on
  `transcript_chunks` and `qa_history`; revoked anon/authenticated
  privileges. Applied: **2026-04-22** (fixing Supabase Security Advisor
  "RLS Disabled in Public" on `public.transcript_chunks`).
- [`supabase/002_create_feedback.sql`](supabase/002_create_feedback.sql) —
  created the missing `feedback` table that `/api/feedback` had been
  writing to since launch (silently failing because the table never
  existed). Ships with RLS enabled from birth. Applied: **2026-04-22**.
