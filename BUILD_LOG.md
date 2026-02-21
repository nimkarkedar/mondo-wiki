# Building Mondo.Wiki — A Build Log

> A running record of every decision, step, and iteration made while building [mondo.wiki](https://mondo.wiki). Written for a future blog post.

---

## The Idea

The Gyaan Project (formerly Audiogyan) is a podcast hosted by Kedar Nimkar that has, since 2016, recorded over 300 conversations with some of India's finest creative minds — designers, artists, musicians, writers, and thinkers. That's more than 50,000 minutes of dialogue. Transcripts sat in Google Drive, largely unread after the episodes aired.

The question: what if you could ask a question — any question on design and art — and get an answer distilled from all of those conversations at once?

The name came from Zen Buddhism. **Mondo** (問答) means "The Way of Dialogue" — a spontaneous question-and-answer exchange between a Zen master and a student. It felt right. The podcast had always been about transmission of wisdom through conversation. This would be its oracle form.

---

## Day 1 — February 20, 2026

### 10:00 – Project scaffolded

Started with `create-next-app`. Chose the defaults: TypeScript, Tailwind CSS, App Router, no src directory. Called the project `mondo-wiki-temp` (placeholder name while the domain was being sorted).

**Stack decided upfront:**
- **Next.js 16** — React framework, handles both frontend and API routes
- **Tailwind CSS 4** — utility-first styling
- **Supabase** — Postgres database with `pgvector` extension for vector similarity search
- **Voyage AI** — embedding model (`voyage-3`) to turn text into vectors
- **Anthropic Claude** (`claude-sonnet-4-6`) — the LLM that generates answers
- **Google Drive API** — source of all transcript files
- **Vercel** — deployment target

---

### The Architecture: RAG (Retrieval-Augmented Generation)

The core mechanic is a classic **RAG pipeline**:

1. All podcast transcripts (and later, books, white papers, presentations) are ingested from Google Drive
2. Each document is chunked into ~500-word segments
3. Each chunk is embedded into a 1024-dimensional vector using Voyage AI's `voyage-3` model
4. Vectors are stored in Supabase with `pgvector`
5. When a user asks a question, the question is embedded using the same model
6. A cosine similarity search (`match_chunks` RPC in Supabase) finds the 5 most relevant transcript chunks
7. Those chunks are passed as context to Claude, which synthesises a response

No answers are pre-written or cached. Every response is generated fresh from the source material.

---

### The Ingestion Script (`scripts/ingest.ts`)

The first real piece of code. This script:

- Authenticates with Google Drive via a service account (JWT auth)
- Lists all files in a designated Drive folder
- Supports multiple formats: `.txt`, `.pdf`, `.srt`, `.docx`, `.doc`, `.epub`
- Parses each format differently:
  - `.srt` files: strips timestamps and indices, keeps only dialogue
  - `.pdf` files: uses `pdf-parse`
  - `.docx`/`.doc`: uses `mammoth`
  - `.epub`: uses `epub2`
- Chunks text into ~500-word segments
- Embeds chunks in batches of 10 (to respect API rate limits)
- Stores everything in Supabase's `transcript_chunks` table
- Skips files already ingested (idempotent — safe to re-run)

**Key detail:** The script was originally written just for `.txt` and `.srt` (podcast transcripts). Later it was expanded to handle `.pdf`, `.docx`, and `.epub` when we decided to include books, white papers, and design presentations in the knowledge base.

---

### Initial Launch (`6ed5c2e`) — ~20:32

The first working version went live. A basic two-pane layout:
- Left pane (orange): logo, tagline, question input, submit button
- Right pane (white): answer display

The API route at `/api/ask` handled the full RAG pipeline: embed question → search Supabase → build context → call Claude → return JSON.

The AI was instructed to respond in a specific JSON format:
```json
{
  "short": "The koan (2–5 words)",
  "long": "The detailed answer, paragraphs separated by \\n\\n",
  "links": []
}
```

---

### Favicon troubles (20:43 – 20:56)

Three commits in a row fixing the favicon:
1. First attempt: tried Next.js's `app/icon.png` convention — didn't work cleanly
2. Second attempt: explicit `<link>` tag in `<head>` — still inconsistent
3. Third attempt: converted the PNG to a proper `.ico` file and placed it in `/public/favicon.ico` alongside an explicit link tag in the layout

Lesson: Next.js App Router's icon handling can be fiddly. Explicit `<link>` tags in the layout are more predictable.

---

### Small UX details (20:45 – 20:50)

- **Removed named attributions** from AI answers. Early versions mentioned specific guests by name. This felt wrong — the wisdom should feel unified, as if coming from a single voice that has absorbed all the conversations. Prompt updated accordingly.
- **Added About page** with back navigation
- **Made the logo clickable** — clicking it returns you to the home page
- **Added source description** below the heading ("Answers are fetched from The Gyaan Project's 300+ conversations using AI. It can make mistakes.")

---

### About Page (20:48)

Built a static `/about` page explaining:
- What "Mondo" means (the Zen Buddhist practice)
- What Mondo.Wiki is and how it works
- What The Gyaan Project is
- Who created it

Same two-pane layout as the home page for visual consistency. The orange pane carries only the logo; the white pane holds all the text content.

---

## Day 1 Evening

### Subtitle copy refined (22:34)

The homepage subtitle went through a few iterations. The goal was something honest about the AI without being dismissive. Landed on: *"Answers are fetched from The Gyaan Project's 300+ conversations using AI. It can make mistakes."*

### About page copy finalised (22:50 – 22:54)

Two commits to get the About page copy right. The "What is Mondo?" section explaining the Zen etymology came last — it grounded the whole project conceptually.

---

### Layout overhaul — contained card design (22:57, `589247a`)

Significant visual change. The full-bleed layout (where the orange pane stretched edge to edge on desktop) was replaced with a **contained card**:

- Max width: 1200px, centered on screen
- Rounded corners (`rounded-2xl`), large drop shadow
- Background of the page itself: warm off-white (not pure white, not grey)
- Card height on desktop: `88vh` — tall but not full screen
- On mobile: reverts to full-screen stacked layout (orange pane on top, white pane below)

This made the whole thing feel more like a considered product and less like a webpage.

---

### Expanded knowledge base (23:08, `b440a32`)

Ingestion script updated to handle `.pdf`, `.docx`, `.doc`, and `.epub` files. The knowledge base grew beyond podcast transcripts to include:
- Books on design and art
- White papers
- Conference presentations

The system prompt was updated to reflect this: *"300+ podcast conversations with artists, designers, and creative thinkers, alongside books, white papers, and presentations on design and art."*

---

### Final push — UI polish, feedback system, OG image (00:01, `8c9197b`)

**Typewriter placeholder animation:**
A custom typewriter effect cycles through 15 example questions in the input field. When the user starts typing, the placeholder disappears. When they clear the input, it resumes. Each phrase types at ~55ms/char, pauses 2.2 seconds, then deletes at ~28ms/char. Built without any library — pure `setTimeout` recursion.

Example prompts rotate through:
> "How do I find my voice as a designer?"
> "What makes a design truly original?"
> "How do I deal with creative block?"
> "What is the relationship between art and commerce?"

**Loading state labels:**
While waiting for the API response, the submit button rotates through whimsical loading messages (changing every 1.8 seconds):
> "Asking the elders…"
> "Consulting 300 souls…"
> "Shaking the oracle…"
> "Summoning the Gyaan…"

**Clear button:**
When the user has typed something, a small ✕ button appears inside the input field to clear it and reset the answer panel.

**Feedback system:**
After each answer, two buttons appear: 👍 *Makes sense* and 👎 *Doesn't make sense*. Clicking either:
- Locks the buttons (prevents double submission)
- Posts to `/api/feedback` which writes the question, both answers, and the rating to a `feedback` table in Supabase
- Shows "Thanks for the feedback." in place of the buttons

This feedback data will be used to evaluate answer quality over time.

**OG meta image:**
A 1200×630 PNG (`/public/meta-image.png`) was created for Open Graph / Twitter card previews. Metadata added to `layout.tsx` for both `og:` and `twitter:` tags, pointing to the deployed Vercel URL.

**Font:**
`Literata` (Google Fonts) — a serif typeface with good readability at paragraph sizes. Loaded via Next.js's `next/font/google` integration.

---

## The Prompt Architecture (`PROMPT.md`)

One of the more considered decisions: making the AI prompt a **live, editable file** (`PROMPT.md`) rather than hardcoded in the API route. The API reads this file at runtime with `fs.readFileSync`, so the tone and style of responses can be tuned without redeploying.

The prompt defines two response modes, inspired by Zen Mondo structure:

**The Koan (short answer):** 2–5 words. Provocative, paradoxical, poetic. Not a direct answer — an unexpected reframe. Examples: *"Who pushed Humpty Dumpty?"* / *"The map is the territory."*

**In Detail (long answer):** ~120 words. Written in first person as a wise teacher who has absorbed all these conversations. Specific, grounded in concrete ideas. Broken into 2–3 paragraphs. Ends with something the reader can carry.

**The tone brief:** Conversational and unhurried. Never lectures. Like sitting across from someone who has spent years listening carefully to brilliant people. Humble without being self-deprecating. Contemplative with flashes of wit. Generous — opens doors rather than closes them.

**Hard rules:** No names of guests or interviewees. No hyphens or em-dashes. Unified voice throughout.

---

## Infrastructure Setup (not in git history, done in parallel)

### Supabase
- Created a new Supabase project
- Enabled the `pgvector` extension
- Created `transcript_chunks` table with columns: `file_name`, `episode_title`, `chunk_index`, `content`, `embedding` (vector 1024)
- Created the `match_chunks` RPC function using `<=>` cosine distance operator
- Created `feedback` table: `question`, `short_answer`, `long_answer`, `rating`, `created_at`

### Google Drive
- Created a Google Cloud project
- Enabled Drive API
- Created a service account with read-only Drive access
- Shared the transcripts folder with the service account email
- Downloaded credentials JSON

### Environment variables
Managed via `.env.local` (not committed). Variables:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VOYAGE_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`

### Deployment
- Deployed to Vercel
- All environment variables mirrored in Vercel's project settings
- Domain: `mondo.wiki` (pointed to Vercel deployment)

---

## What's Next

- Rate limiting / auth (the UI has a placeholder: *"First question is free. Then you have to Register."*)
- Better episode links in answers (currently placeholders)
- Search history or bookmarking answers
- Analytics on which questions get asked most
- Potential: a "Today's Koan" feature — a daily question surfaced from the archive

---

## Tech Stack Summary

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Font | Literata (Google Fonts) |
| LLM | Anthropic Claude Sonnet 4.6 |
| Embeddings | Voyage AI `voyage-3` |
| Vector DB | Supabase + pgvector |
| File parsing | pdf-parse, mammoth, epub2 |
| Drive access | Google APIs (googleapis) |
| Hosting | Vercel |

---

*Last updated: February 21, 2026*
