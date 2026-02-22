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
      .limit(4);

    if (personChunks && personChunks.length > 0) {
      return personChunks;
    }
  }

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: 3,
  });

  if (error) {
    console.error("❌ Supabase match_chunks error:", JSON.stringify(error));
    return [];
  }

  return data ?? [];
}

const FUN_URLS = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  // Never Gonna Give You Up (Rickroll)
  "https://www.youtube.com/watch?v=QH2-TGUlwu4",  // Nyan Cat
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",  // Me at the zoo (first ever YouTube video)
  "https://www.youtube.com/watch?v=KmtzQCSh6xk",  // Numa Numa
  "https://www.youtube.com/watch?v=sCNrK-n68CM",  // Mr. Bean at the Olympics
  "https://www.youtube.com/watch?v=oHg5SJYRHA0",  // Never Gonna Give You Up but animated
  "https://www.youtube.com/watch?v=ZZ5LpwO-An4",  // Happiness (Nigel Stanford)
  "https://www.youtube.com/watch?v=_OBlgSz8sSM",  // This is Fine
];

function buildSystemPrompt(context: string, episodeTitles: string[], allowNeedsContext: boolean): string {
  const promptPath = path.join(process.cwd(), "PROMPT.md");
  const promptDoc = fs.readFileSync(promptPath, "utf-8");

  const referencesInstruction = episodeTitles.length > 0
    ? `The transcripts you are drawing from belong to the following guests — use these names exactly as written:
${episodeTitles.map((t) => `- ${t}`).join("\n")}

In the "references" array, include each name exactly as listed above, and pair it with their primary profession as you can determine from the transcript content (e.g. Designer, Architect, Artist, Illustrator, Typographer, Filmmaker, Writer, Musician, Photographer — one or two words). If a title looks like a book, paper, or document title rather than a person's name, exclude it from references.`
    : `Use an empty "references" array.`;

  return `You are the oracle of Ask TGP — a distillation of wisdom from The Gyaan Project's full knowledge base: 300+ podcast conversations with artists, designers, and creative thinkers, alongside books, white papers, and presentations on design and art.

IMPORTANT: First, judge whether this question is genuinely about design, art, creativity, or creative practice. Questions asking to summarise or describe a specific guest's episode from The Gyaan Project are ALWAYS valid — treat them as an invitation to distil that person's ideas and perspective. If the question is completely unrelated (e.g. sports, cooking, finance, politics, science, math), respond ONLY with:
{ "outOfSyllabus": true }

${allowNeedsContext ? `AMBIGUOUS QUESTIONS: If the question has no design or art keywords and is too vague to answer (e.g. "Which is better?", "How do I start?", "What should I choose?"), respond ONLY with:
{ "needsContext": true, "hint": "A one-sentence friendly suggestion asking them to specify the design or art context." }

Otherwise, when` : `When`} a user asks a question about design or art, respond in two parts. Use the guidelines below (from PROMPT.md) to shape your response.

---
${promptDoc}
---

${context ? `Here are the most relevant excerpts from The Gyaan Project transcripts to inform your answer:\n\n${context}\n\nDraw from this wisdom to craft your response. Be specific and reference ideas from these conversations.` : "Draw from your general understanding of design and art wisdom."}

${referencesInstruction}

HARD LIMIT: The "long" answer must be 120 words or fewer. Count every word. Stop writing before you reach 120 words. Do not exceed this under any circumstances.

Respond ONLY in this exact JSON format, with no text outside it:
{
  "short": "The koan here (2–5 words)",
  "long": "The detailed answer here, using \\n\\n to separate paragraphs. Maximum 120 words.",
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

    const hasDesignContext = /design|art|architect|creative|creativity|craft|typography|illustration|photography|film|music|theatre|dance|paint|sculpt|brand|ux|ui|summaris|summariz|episode|gyaan|tgp/i.test(question);

    // Search for relevant transcript chunks
    const chunks = await getRelevantChunks(question);

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
      system: buildSystemPrompt(context, episodeTitles, !hasDesignContext),
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


    // Strip any URLs or "Learn more" lines from long answer
    if (parsed.long) {
      parsed.long = parsed.long
        .replace(/\n*\s*Learn more[:\s].*$/gim, "")
        .replace(/https?:\/\/\S+/g, "")
        .trim();
    }

    // Hard enforce 120-word limit on long answer
    if (parsed.long) {
      const words = parsed.long.split(/\s+/);
      if (words.length > 120) {
        const truncated = words.slice(0, 120).join(" ");
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
      const funUrl = FUN_URLS[Math.floor(Math.random() * FUN_URLS.length)];
      return NextResponse.json({ outOfSyllabus: true, funUrl });
    }

    if (!Array.isArray(parsed.references)) parsed.references = [];

    // Fallback: if Claude returned no references, use episode titles directly
    if (parsed.references.length === 0) {
      parsed.references = episodeTitles.map((title) => ({ name: title, profession: "" }));
    }

    // Save to qa_history — skip if identical question saved in last 2 minutes
    let historyId: string | null = null;
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: dupe } = await supabase
        .from("qa_history")
        .select("id")
        .eq("question", question.trim())
        .gte("created_at", twoMinutesAgo)
        .maybeSingle();

      if (!dupe) {
        const { data: historyRow } = await supabase
          .from("qa_history")
          .insert({
            question: question.trim(),
            short_answer: parsed.short,
            long_answer: parsed.long,
          })
          .select("id")
          .single();
        historyId = historyRow?.id ?? null;
      } else {
        historyId = dupe.id;
      }
    } catch {
      // Ignore history save errors
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
