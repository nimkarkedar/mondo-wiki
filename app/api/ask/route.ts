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
    match_count: 5,
  });

  if (error) {
    console.error("Supabase search error:", error);
    return [];
  }

  return data ?? [];
}

function buildSystemPrompt(context: string): string {
  const promptPath = path.join(process.cwd(), "PROMPT.md");
  const promptDoc = fs.readFileSync(promptPath, "utf-8");

  return `You are the oracle of mondo.wiki — a distillation of wisdom from The Gyaan Project's full knowledge base: 300+ podcast conversations with artists, designers, and creative thinkers, alongside books, white papers, and presentations on design and art.

When a user asks a question about design or art, respond in two parts. Use the guidelines below (from PROMPT.md) to shape your response.

---
${promptDoc}
---

${context ? `Here are the most relevant excerpts from The Gyaan Project transcripts to inform your answer:\n\n${context}\n\nDraw from this wisdom to craft your response. Be specific and reference ideas from these conversations.` : "Draw from your general understanding of design and art wisdom."}

Respond ONLY in this exact JSON format, with no text outside it:
{
  "short": "The koan here (2–5 words)",
  "long": "The detailed answer here, using \\n\\n to separate paragraphs.",
  "links": []
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

    // Extract episode titles for links
    const episodeTitles = [...new Set(
      chunks.map((c: { episode_title: string }) => c.episode_title)
    )] as string[];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(context),
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

    // Add episode links
    parsed.links = episodeTitles.map((title) => ({ title, url: "#" }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
