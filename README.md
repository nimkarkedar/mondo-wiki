# Ask TGP — Build Log

Live at: [asktgp.vercel.app](https://asktgp.vercel.app)

An AI oracle built on The Gyaan Project's 300+ podcast conversations with India's finest designers, artists, architects, musicians, and creative thinkers.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Embeddings | Voyage AI (voyage-3) |
| Vector DB | Supabase (pgvector) |
| Hosting | Vercel |
| Logging | Google Sheets API v4 |

---

## Architecture

1. **Ingestion** (`scripts/ingest.ts`): Reads transcripts from Google Drive (`.txt`, `.pdf`, `.srt`, `.docx`, `.epub`), chunks them into ~500-word segments, embeds with Voyage AI, stores in Supabase `transcript_chunks` table.

2. **Query** (`app/api/ask/route.ts`): Embeds the user's question with Voyage AI, runs vector similarity search (`match_chunks` RPC) to find the most relevant transcript excerpts, passes them to Claude as context, returns a short answer (koan) + long answer (≤120 words) + references.

3. **Explore** (`app/explore/page.tsx`): Shows Q&A history from the last 10 days, paginated, with thumbs up/down feedback.

4. **Logging** (`logToSheet`): Every question is logged to a Google Sheet (timestamp, question, city/country from Vercel geo headers).

---

## Supabase Tables

### `transcript_chunks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| file_name | text | Original file name |
| episode_title | text | File name without extension (used as guest name) |
| chunk_index | int | Order within file |
| content | text | ~500 words of transcript text |
| embedding | vector(1024) | Voyage AI embedding |

### `qa_history`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| question | text | |
| short_answer | text | |
| long_answer | text | |
| created_at | timestamptz | |

### `feedback`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| qa_history_id | uuid | FK → qa_history.id |
| question | text | |
| short_answer | text | |
| long_answer | text | |
| rating | text | `makes_sense` or `doesnt_make_sense` |
| created_at | timestamptz | |

---

## Environment Variables (Vercel)

```
ANTHROPIC_API_KEY
VOYAGE_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
```

---

## Key Features Built

### UI
- Two-pane layout: orange gradient left (question input) + white right (answer)
- Animated typewriter placeholder cycling through 15 design questions
- Rotating loading labels ("Asking the elders…", "Consulting 300 souls…", etc.)
- Staggered answer reveal animation (short → long → feedback)
- Logo click resets all state
- Clear button inside input field
- Toast notifications for clipboard copy
- Fully responsive (mobile + desktop)
- `borderPulse` animation on the Explore card in empty state

### Answer logic
- **Short answer**: 2–5 word koan
- **Long answer**: ≤120 words, server-side word-count enforcement
- **References**: Guest names + profession, drawn from episode titles
- **Out of syllabus**: Detected by Claude, returns a random fun YouTube URL
- **Needs context**: Ambiguous non-design questions get a friendly nudge
- **Error state**: Clean error message, no labels or feedback buttons
- URL stripping from answers (no links ever appear in responses)

### Person/episode lookup
- `extractPersonName()` detects named guests in questions (e.g. "Summarise Kirti Trivedi's episode")
- Strips leading skip-words (Summarise, Tell, What, etc.) before name matching
- Handles single-name possessives ("Summarise Sunit's episode")
- Direct chunk lookup by episode title bypasses vector search for named queries

### Explore page
- Accordion Q&A list, last 10 days
- Deduplication by question text (display + DB)
- Lookahead pagination (fetch limit+1 to know if more exist)
- `useRef` guard prevents React StrictMode double-invocation
- Feedback (thumbs up/down) linked to `qa_history` by UUID, not text-matching
- Copy to clipboard per item

### Google Sheets logging
- Logs timestamp (IST), question, city+country on every `/api/ask` call
- Service account auth via JWT
- Fire-and-forget (doesn't slow response)
- Required: Google Sheets API enabled in GCP project + service account as Editor on sheet

### About page
- What is Ask TGP, how it works, what TGP is, who made it
- Contact email

---

## Ingestion

To ingest new transcripts:

```bash
# Add files to the Google Drive folder, then:
npx tsx scripts/ingest.ts
```

Supported formats: `.txt`, `.srt`, `.pdf`, `.docx`, `.doc`, `.epub`

Already-ingested files are skipped automatically (checked by `file_name`).

---

## Next Steps (post-feedback)

- Custom domain
- Rate limiting / authentication if needed
- Search within Explore
- Share individual answers
