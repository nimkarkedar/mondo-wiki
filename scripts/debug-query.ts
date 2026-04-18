/**
 * Debug: for a given question, show the top matching chunks (which episodes/files).
 *
 * Usage:  npx tsx scripts/debug-query.ts "How to design a book?"
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: "voyage-3", input: [text] }),
  });
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function main() {
  const q = process.argv.slice(2).join(" ") || "How to design a book?";
  console.log(`❓ Question: "${q}"\n`);

  // First, list distinct episode titles containing "Ahlawat" or "Pinki" in DB.
  for (const name of ["Ahlawat", "Gunjan", "Pinki", "Pinky"]) {
    const { data } = await supabase
      .from("transcript_chunks")
      .select("episode_title")
      .ilike("episode_title", `%${name}%`)
      .limit(3);
    if (data && data.length > 0) {
      const titles = Array.from(new Set(data.map((d) => d.episode_title)));
      console.log(`📂 Archive contains "${name}":`, titles);
    } else {
      console.log(`❌ Archive has NO chunks matching "${name}"`);
    }
  }

  console.log("\n🔎 Top 10 vector matches:");
  const embedding = await embed(q);
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: 10,
  });
  if (error) {
    console.error(error);
    return;
  }
  (data ?? []).forEach((row: { episode_title: string; content: string }, i: number) => {
    console.log(`\n${i + 1}. ${row.episode_title}`);
    console.log(`   "${row.content.slice(0, 180).replace(/\s+/g, " ")}…"`);
  });
}

main().catch(console.error);
