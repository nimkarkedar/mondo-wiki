import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logToSheet(question: string, ip: string) {
  if (!process.env.GOOGLE_SHEET_ID) return;
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), question, ip]],
      },
    });
  } catch (err) {
    console.error("Sheet log error:", err);
  }
}

async function embedQuestion(question: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: "voyage-3", input: [question] }),
  });
  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

// Extract a proper person name from the question (e.g. "Rupali Gupte")
function extractPersonName(question: string): string | null {
  // Words that start a sentence but are not part of a person's name
  const skipWords = new Set([
    "Summarise", "Summarize", "Tell", "What", "Who", "How", "Why",
    "Where", "When", "Describe", "Explain", "Show", "Give", "Can",
    "Does", "Did", "Is", "Are", "Was", "The", "This", "These",
  ]);

  // First: try multi-word name (e.g. "Sunit Singh")
  const matches = question.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+\b/g);
  if (matches) {
    for (const match of matches) {
      const words = match.split(" ");
      let start = 0;
      while (start < words.length && skipWords.has(words[start])) start++;
      const name = words.slice(start).join(" ");
      if (name.includes(" ")) return name;
    }
  }

  // Fallback: single first name with possessive in summary context
  // e.g. "Summarise Sunit's episode" → "Sunit"
  const possessive = question.match(
    /(?:summarise|summarize|tell me about|describe|about)\s+([A-Z][a-zA-Z]+)'s/i
  );
  if (possessive) return possessive[1];

  return null;
}

async function getRelevantChunks(question: string) {
  const embedding = await embedQuestion(question);

  // Check if question names a specific person — if so, pull their chunks directly
  const personName = extractPersonName(question);
  if (personName) {
    const { data: personChunks } = await supabase
      .from("transcript_chunks")
      .select("episode_title, content")
      .ilike("episode_title", `%${personName}%`)
      .order("chunk_index")
      .limit(6);

    if (personChunks && personChunks.length > 0) {
      return personChunks;
    }
  }

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: 10,
  });

  if (error) {
    console.error("❌ Supabase match_chunks error:", JSON.stringify(error));
    return [];
  }

  return data ?? [];
}

// Random meme / reaction GIFs shown when a question is out of syllabus.
// Direct Giphy media URLs — served as <img> on the client.
const FUN_GIFS = [
  "https://media.giphy.com/media/3o7TKsQ8gb44YHKMuY/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif",
  "https://media.giphy.com/media/xUPGcl3ijl0vAEyIRi/giphy.gif",
  "https://media.giphy.com/media/l0HlSNOxJB956qwfK/giphy.gif",
  "https://media.giphy.com/media/l1J9sBOj2EqwFIbvG/giphy.gif",
  "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
  "https://media.giphy.com/media/5xtDarEbYqD1pVxVZio/giphy.gif",
  "https://media.giphy.com/media/l2Je66zG6mAAZxgqI/giphy.gif",
  "https://media.giphy.com/media/3o6Zt90lm0dkRB4ZAQ/giphy.gif",
];

// Sentinel stored in qa_history.short_answer to flag out-of-syllabus rows.
// These rows record question + timestamp + location for analytics but are
// filtered out of the public Explore feed.
const OUT_OF_SYLLABUS_MARKER = "__OUT_OF_SYLLABUS__";

function buildSystemPrompt(
  context: string,
  episodeTitles: string[],
  allowNeedsContext: boolean,
  allowOutOfSyllabus: boolean
): string {
  const promptPath = path.join(process.cwd(), "PROMPT.md");
  const promptDoc = fs.readFileSync(promptPath, "utf-8");

  const referencesInstruction = episodeTitles.length > 0
    ? `The transcripts you are drawing from belong to the following guests — use these names exactly as written:
${episodeTitles.map((t) => `- ${t}`).join("\n")}

In the "references" array, include each name exactly as listed above, and pair it with their primary profession as you can determine from the transcript content (e.g. Designer, Architect, Artist, Illustrator, Typographer, Filmmaker, Writer, Musician, Photographer — one or two words). If a title looks like a book, paper, or document title rather than a person's name, exclude it from references.`
    : `Use an empty "references" array.`;

  const outOfSyllabusRule = `GROUNDING RULE — read carefully:

You may ONLY answer from the excerpts provided below. You may NOT use general knowledge, general design wisdom, or anything outside these excerpts. If the excerpts do not contain enough material to give a grounded, specific answer to the question, respond ONLY with:
{ "outOfSyllabus": true }

Return outOfSyllabus when:
- The question is unrelated to design, art, or creative practice (e.g. sports, politics, recipes).
- The excerpts are present but genuinely do not address the question — even loosely. Do not stretch unrelated excerpts into an answer.
- You would have to invent, generalise, or speak from outside the archive to answer.

Do NOT return outOfSyllabus just because the excerpts require interpretation. If there is a plausible thread in the excerpts that connects to the question, draw from it. But never fabricate, never bluff, never "puff" an answer using general AI knowledge.

When in doubt between answering weakly and returning outOfSyllabus — choose outOfSyllabus.`;

  return `You are the oracle of Ask TGP — a distillation of wisdom from The Gyaan Project's full knowledge base: 300+ podcast conversations with artists, designers, and creative thinkers, alongside books, white papers, and presentations on design and art.

${outOfSyllabusRule}

${allowNeedsContext ? `AMBIGUOUS QUESTIONS: If the question has no design or art keywords and is too vague to answer (e.g. "Which is better?", "How do I start?", "What should I choose?"), respond ONLY with:
{ "needsContext": true, "hint": "A one-sentence friendly suggestion asking them to specify the design or art context." }

Otherwise, when` : `When`} a user asks a question about design or art, respond in two parts. Use the guidelines below (from PROMPT.md) to shape your response.

---
${promptDoc}
---

${context ? `Here are the most relevant excerpts from The Gyaan Project transcripts to inform your answer:\n\n${context}\n\nDraw from this wisdom to craft your response. Be specific and reference ideas from these conversations.` : "Draw from your general understanding of design and art wisdom."}

${referencesInstruction}

HARD LIMIT: The "long" answer must be 130 words or fewer. Count every word. Stop writing before you reach 130 words. Do not exceed this under any circumstances.

Respond ONLY in this exact JSON format, with no text outside it:
{
  "short": "The koan here (2–5 words)",
  "long": "The detailed answer here, using \\n\\n to separate paragraphs. Maximum 130 words.",
  "references": [
    { "name": "Guest Name", "profession": "Profession" }
  ]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string" || question.trim() === "") {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    // Handle meta questions about Ask TGP directly, without hitting the AI
    const metaPatterns = /what\s+is\s+(this|ask\s+tgp|the\s+gyaan\s+project|tgp)|how\s+does\s+this\s+work|who\s+(made|created|built)\s+this|what\s+can\s+(i|you)\s+(ask|do)/i;
    if (metaPatterns.test(question.trim())) {
      return NextResponse.json({
        short: "A window into 300 conversations.",
        long: "Ask TGP is an AI oracle built on The Gyaan Project — a podcast by Kedar Nimkar featuring 300+ conversations with India's finest designers, artists, architects, musicians, and creative thinkers.\n\nAsk it anything about design, art, or creative practice. It draws from those conversations to give you a short answer and a long answer — distilled wisdom, not a search result.\n\nThink of it as sitting across from someone who has spent years listening carefully to brilliant people, and is now quietly passing on what they heard.",
        references: [],
      });
    }

    const hasDesignContext = /design|art|artist|architect|creative|creativity|craft|typography|type\b|illustration|illustrat|photograph|film|cinema|music|theatre|dance|paint|sculpt|brand|logo|identity|ux|ui|product|studio|maker|making|aesthetic|culture|cultural|writer|writing|poet|theatre|performance|summaris|summariz|episode|gyaan|tgp|material|space|craft|process|practice|inspiration|muse|voice|style|taste|vision|critique|feedback|client|brief|career|portfolio/i.test(question);

    // Search for relevant transcript chunks
    const chunks = await getRelevantChunks(question);

    // Trust the model's own judgment: it sees the excerpts and decides
    // whether they genuinely support a grounded answer. Forcing an answer
    // causes bluffing, which we want to avoid.
    const allowOutOfSyllabus = true;

    // Build context from top chunks
    const context = chunks
      .map((c: { episode_title: string; content: string }) =>
        `[From: ${c.episode_title}]\n${c.content}`
      )
      .join("\n\n---\n\n");

    // Extract unique episode titles — these are the ground-truth guest names
    const episodeTitles = [...new Set(
      chunks.map((c: { episode_title: string }) => c.episode_title)
    )] as string[];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: buildSystemPrompt(context, episodeTitles, !hasDesignContext, allowOutOfSyllabus),
      messages: [{ role: "user", content: `Question: ${question.trim()}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Raw AI response:", raw);
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
    }


    // Strip URLs, "Learn more" lines, em-dashes, and hyphen dashes
    function sanitize(text: string): string {
      return text
        .replace(/\n*\s*Learn more[:\s].*$/gim, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/—/g, ",")      // em-dash to comma
        .replace(/–/g, ",")      // en-dash to comma
        .replace(/ - /g, ", ")   // spaced hyphen to comma
        .replace(/ -\s/g, ", ")
        .replace(/\s-\s/g, ", ")
        .trim();
    }

    if (parsed.long) parsed.long = sanitize(parsed.long);
    if (parsed.short) parsed.short = sanitize(parsed.short);

    // Hard enforce 130-word limit on long answer
    if (parsed.long) {
      const words = parsed.long.split(/\s+/);
      if (words.length > 130) {
        const truncated = words.slice(0, 130).join(" ");
        // Try to end at a sentence boundary
        const lastSentence = Math.max(
          truncated.lastIndexOf(". "),
          truncated.lastIndexOf("! "),
          truncated.lastIndexOf("? ")
        );
        parsed.long = lastSentence > truncated.length * 0.6
          ? truncated.slice(0, lastSentence + 1)
          : truncated;
      }
    }

    if (parsed.needsContext) {
      return NextResponse.json({ needsContext: true, hint: parsed.hint ?? "Try adding 'design' or 'art' to your question for a more focused answer." });
    }


    if (parsed.outOfSyllabus) {
      const funUrl = FUN_GIFS[Math.floor(Math.random() * FUN_GIFS.length)];

      // Record the question (no answer) so we can see what people are asking
      // that falls outside the archive. Flagged with sentinel short_answer.
      try {
        await supabase.from("qa_history").insert({
          question: question.trim(),
          short_answer: OUT_OF_SYLLABUS_MARKER,
          long_answer: "",
        });
      } catch {
        // non-fatal
      }

      const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "unknown");
      const country = req.headers.get("x-vercel-ip-country") ?? "";
      const location = country ? `${city}, ${country}` : city;
      logToSheet(`[OUT OF SYLLABUS] ${question.trim()}`, location).catch(() => {});

      return NextResponse.json({ outOfSyllabus: true, funUrl });
    }

    if (!Array.isArray(parsed.references)) parsed.references = [];

    // Fallback: if Claude returned no references, use episode titles directly
    if (parsed.references.length === 0) {
      parsed.references = episodeTitles.map((title) => ({ name: title, profession: "" }));
    }

    // Save to qa_history — skip only if an identical *answered* question exists
    // in the last 2 minutes. Sentinel (out-of-syllabus) rows must NOT block a
    // later real answer from being stored.
    let historyId: string | null = null;
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: dupeRows, error: dupeErr } = await supabase
        .from("qa_history")
        .select("id, short_answer")
        .eq("question", question.trim())
        .neq("short_answer", OUT_OF_SYLLABUS_MARKER)
        .gte("created_at", twoMinutesAgo)
        .limit(1);

      if (dupeErr) console.error("qa_history dedupe check error:", dupeErr.message);

      const dupe = dupeRows && dupeRows.length > 0 ? dupeRows[0] : null;

      if (!dupe) {
        const { data: historyRow, error: insertErr } = await supabase
          .from("qa_history")
          .insert({
            question: question.trim(),
            short_answer: parsed.short,
            long_answer: parsed.long,
          })
          .select("id")
          .single();
        if (insertErr) console.error("qa_history insert error:", insertErr.message);
        historyId = historyRow?.id ?? null;
      } else {
        historyId = dupe.id;
      }
    } catch (err) {
      console.error("qa_history save exception:", err);
    }

    // Log to Google Sheet (fire-and-forget)
    const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "unknown");
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const location = country ? `${city}, ${country}` : city;
    logToSheet(question.trim(), location).catch((err) => console.error("Sheet log failed:", err?.message ?? err));

    return NextResponse.json({ ...parsed, id: historyId });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
