# Ask TGP — Project State (Phase 1 Complete)

**Last updated:** 2026-04-19
**Live:** https://asktgp.vercel.app (custom domain asktgp.com pending DNS setup)
**Repo:** github.com/nimkarkedar/mondo-wiki

---

## What It Is

An AI oracle built on **The Gyaan Project** podcast archive (300+ episodes with Indian designers, artists, architects, musicians, writers). User asks a question about design or art; the system retrieves relevant transcript passages and returns a three-part answer:

1. **Short answer (koan)** — 2 to 5 words, sourced from a famous quote (poets, philosophers, artists, scientists)
2. **Long answer** — 120 to 150 words, verbatim or near-verbatim from ONE single episode
3. **Ending question** — one James-Clear-3-2-1-style contemplative closer

---

## Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind v4
- **LLM:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) via `@anthropic-ai/sdk`
- **Embeddings:** Voyage AI `voyage-3`
- **Vector DB:** Supabase pgvector with `match_chunks` RPC
- **Ingestion source:** Google Drive folder (164+ transcripts, PDFs, DOCX)
- **Logging:** Google Sheets (Q + IP/city), Supabase `qa_history` (for Explore feed)
- **Deployment:** Vercel
- **Free tier caveat:** Supabase free-tier pauses after inactivity. Deferred: daily keep-alive cron + graceful UI fallback.

---

## Archive Contents (273 distinct episodes as of last ingest)

- **Sources:** `.txt`, `.pdf`, `.srt`, `.doc`, `.docx`, `.epub`
- **Chunking:** 750 words with 100-word overlap (ingest.ts)
- **Embedding enrichment:** episode title prepended to each chunk at embed time so short/topical queries find the right episode (body content kept clean in storage)
- **Known gaps:** `Deshna Mehta -2.txt`, `Book-Sample-Chapters.pdf` didn't extract text (likely scanned PDF / empty file)

---

## Retrieval Pipeline (the core of the project)

Three stages, in order, in [`app/api/ask/route.ts`](app/api/ask/route.ts):

### 1. Name-aware match (direct title lookup)
If the question names a guest — exact, prefix, or Levenshtein-1 typo — pull that episode's chunks directly.
- Fetches all distinct `episode_title` values from Supabase, cached 5 min
- Tokenizes both question and titles, stripping stopwords and topic-nouns
- Exact/prefix = score 3; fuzzy Lev-1 = score 2; consecutive bigram hit = +5 bonus
- Threshold ≥3, or score 2 if the title has ≤2 name tokens (allows single-name typos like "Sushmita" → Susmita Mohanty)
- Handles: "Susmita", "Sushmita", "Pinki De" (typo for Pinaki), "Ayush on type", "Gunjan", etc.

### 2. Keyword AND search (topical match)
- Stems question words (`communities` → `communit`, `colors` → `color`)
- Requires ALL keywords to appear in the chunk (AND filter, highly selective)
- Ranks by keyword density (total occurrences)
- Fallback: if AND returns nothing, OR search with hit-count ranking
- Catches topical matches vector search misses (e.g. Sarover Zaidi for "communities form color" — vector ranked her nowhere, keyword found her top 6 with density 19)

### 3. Vector search (semantic match)
- Runs in parallel with keyword search
- `voyage-3` embedding → pgvector `match_chunks` RPC, top 10
- Catches semantic paraphrases the keyword path misses

**Merge:** keyword and vector results interleaved, dedupe by (episode, chunk_index), max 14 chunks passed to Claude.

---

## Answer Generation

Claude receives the merged chunks + the system prompt built from [`PROMPT.md`](PROMPT.md). PROMPT.md contains the three-part answer spec and the **anti-slop rules** (banned phrases like "delve into", "leverage", "tapestry", "journey as metaphor"; simplify wordy phrases; no preambles or motivational closers).

Claude returns JSON:
```json
{
  "short": "2 to 5 words",
  "long": "120-150 words, verbatim from ONE episode",
  "endingQuestion": "single contemplative sentence",
  "references": [{ "name": "Guest", "profession": "Designer" }]
}
```

Or `{ "outOfSyllabus": true }` when excerpts genuinely don't address the question (anti-bluff rule).

Post-processing in the route:
- Sanitize: strip URLs, "Learn more" lines, em-dashes, hyphen dashes
- Soft cap 150 words on long answer
- Fallback: if references array empty, use episode titles directly
- Save to `qa_history` with 2-minute dedupe (sentinel `__OUT_OF_SYLLABUS__` for OOS rows, filtered out of Explore)

---

## UI State (locked design system — 16px body, #656565 min text, #ff6900 orange, 1200px card template)

### Homepage ([`app/page.tsx`](app/page.tsx))
- **34/66 panel split** (orange left, black right)
- Input field with floating label, full-width submit button, helper text "Expect a philosophical answer. See examples"
- Loading states with rotating phrases ("Brewing the wisdom…", "Asking neighbours…", etc.), answer block pushes down 70px to align with input
- Answer rendering: Short → Long (split on `\n\n` paragraphs) → italic Ending Question with top divider
- Feedback row: 👍 Agree / 👎 Disagree / 📋 Copy
- **Rich copy**: writes both `text/html` (with `asktgp.com` hyperlink) and `text/plain` via `ClipboardItem` API
- OOS state uses the "everything is design, but seems like askTGP oracle was not able to find what you are looking for" copy
- Closing line: "AI can make mistakes. Use your Vivek." (linked to Wikipedia)

### About ([`app/about/page.tsx`](app/about/page.tsx))
- Same 34/66 layout, "About" headline
- Body: Ask TGP intro → Kedar Nimkar (linked) → The Gyaan Project (linked to thegyaanproject.com and YouTube channel) → contact email
- Fixed bottom copyright

### Explore ([`app/explore/page.tsx`](app/explore/page.tsx))
- Feed of real past Q&A pairs from `qa_history` (excludes OOS sentinel rows)
- Endpoint: `/api/history`

### API routes
- `POST /api/ask` — the main oracle
- `POST /api/feedback` — thumbs up/down
- `GET /api/history` — explore feed
- `GET /api/ping` — Supabase health check

---

## Key Scripts

- [`scripts/ingest.ts`](scripts/ingest.ts) — Drive → parse → chunk → embed → Supabase. Default: skip already-ingested. `REINGEST=true` wipes and re-ingests.
- [`scripts/debug-query.ts`](scripts/debug-query.ts) — Run a question through vector search, show top 10 matches with episode titles.
- [`scripts/test-name-match.ts`](scripts/test-name-match.ts) — Test suite for name-aware retrieval (13/13 passing).
- [`scripts/test-hybrid.ts`](scripts/test-hybrid.ts) — Compare keyword vs vector on real queries.

---

## Environment Variables (`.env.local`)

```
ANTHROPIC_API_KEY
VOYAGE_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_SHEET_ID
```

---

## Deferred / Phase 2 Candidates

1. **Custom domain**: wire up asktgp.com in Vercel → Domains. Currently the clipboard footer links to asktgp.com but the site lives at asktgp.vercel.app.
2. **Free-tier hardening**:
   - Daily GitHub Actions cron hitting `/api/ping` to keep Supabase from pausing
   - Graceful UI fallback when Supabase is down (currently just errors)
3. **Re-ranking layer**: after hybrid retrieval, pass top 20 chunks through Voyage `rerank-2.5` for a precision boost. ~30% improvement typical.
4. **Episode → Spotify mapping**: previously tried and got 16% confidence coverage (27/167 files); shelved. Would need better episode metadata or manual mapping.
5. **OCR for scanned PDFs**: `Book-Sample-Chapters.pdf` failed extraction. Add Tesseract fallback if more scanned docs arrive.
6. **Query expansion**: for vague questions, use Claude to generate 3-5 alternative phrasings before embedding, merge retrieval via RRF.
7. **Richer episode_title metadata**: many stored titles are just the guest's name (e.g. "Sarover Zaidi" instead of her real episode title "Colours and communities with Sarover Zaidi"). Enriching these at ingest time would improve retrieval further.
8. **Analytics on out-of-syllabus questions**: `qa_history` already logs these with sentinel. Build a view to see what people are asking that's falling outside the archive → informs what to ingest next.

---

## Git Hygiene

- `main` branch, push to auto-deploy on Vercel
- Commit convention: conventional-ish, "Co-Authored-By: Claude Opus 4.7" on AI-assisted commits
- All phase 1 work shipped and on main

---

## User Preferences Observed

- Strongly values directness over ceremony in responses
- Will call out AI puffery and bluffing immediately — the grounding rule in PROMPT.md exists because of this
- Prefers design changes committed and pushed immediately, not staged
- Uses the site name as **asktgp.com** (domain not yet wired; currently lives at asktgp.vercel.app)
- The design system is locked (see user memory: 16px body, #656565 min text, #ff6900 orange, 1200px card)

---

## One-Line Summary for Context Resume

> Ask TGP is a Next.js 15 RAG oracle over 273 podcast transcripts. Phase 1 shipped: hybrid retrieval (name-aware + keyword AND + vector), three-part verbatim answers, anti-slop prompt rules, rich clipboard copy, locked design system. Deployed at asktgp.vercel.app. Phase 2 candidates: custom domain, free-tier hardening, reranking, richer title metadata.
