import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function getRelevantChunks(question: string) {
  const embedding = await embedQuestion(question);

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
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  // Never Gonna Give You Up
  "https://www.youtube.com/watch?v=QH2-TGUlwu4",  // Nyan Cat
  "https://www.youtube.com/watch?v=OQSNhk5ICTI",  // Double Rainbow
  "https://www.youtube.com/watch?v=KmtzQCSh6xk",  // Numa Numa
  "https://www.youtube.com/watch?v=sCNrK-n68CM",  // Mr. Bean at the Olympics
  "https://www.youtube.com/watch?v=HBFoSEMGLIA",  // Dramatic Chipmunk
  "https://www.youtube.com/watch?v=tLt5rBfNucc",  // Sneezing Panda
];

function buildSystemPrompt(context: string, episodeTitles: string[]): string {
  const promptPath = path.join(process.cwd(), "PROMPT.md");
  const promptDoc = fs.readFileSync(promptPath, "utf-8");

  const referencesInstruction = episodeTitles.length > 0
    ? `The transcripts you are drawing from belong to the following guests — use these names exactly as written:
${episodeTitles.map((t) => `- ${t}`).join("\n")}

In the "references" array, include each name exactly as listed above, and pair it with their primary profession as you can determine from the transcript content (e.g. Designer, Architect, Artist, Illustrator, Typographer, Filmmaker, Writer, Musician, Photographer — one or two words). If a title looks like a book, paper, or document title rather than a person's name, exclude it from references.`
    : `Use an empty "references" array.`;

  return `You are the oracle of Ask TGP — a distillation of wisdom from The Gyaan Project's full knowledge base: 300+ podcast conversations with artists, designers, and creative thinkers, alongside books, white papers, and presentations on design and art.

IMPORTANT: First, judge whether this question is genuinely about design, art, creativity, or creative practice. If it is completely unrelated (e.g. sports, cooking, finance, politics, science, math, personal advice unrelated to creative work), respond ONLY with this exact JSON and nothing else:
{ "outOfSyllabus": true }

If the question is relevant but the provided excerpts don't contain enough to answer it meaningfully, still return { "outOfSyllabus": true }.

Otherwise, when a user asks a question about design or art, respond in two parts. Use the guidelines below (from PROMPT.md) to shape your response.

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
      system: buildSystemPrompt(context, episodeTitles),
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

    if (parsed.outOfSyllabus) {
      const funUrl = FUN_URLS[Math.floor(Math.random() * FUN_URLS.length)];
      return NextResponse.json({ outOfSyllabus: true, funUrl });
    }

    if (!Array.isArray(parsed.references)) parsed.references = [];

    // Fallback: if Claude returned no references, use episode titles directly
    if (parsed.references.length === 0) {
      parsed.references = episodeTitles.map((title) => ({ name: title, profession: "" }));
    }


    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
