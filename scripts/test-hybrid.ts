/**
 * Test hybrid (keyword + vector) retrieval against real queries.
 * Shows what episodes surface for each query.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STOPWORDS = new Set([
  "ep", "episode", "transcript", "part", "vol", "volume", "interview",
  "the", "a", "an", "and", "or", "of", "on", "in", "at", "to", "for",
  "with", "by", "from", "about", "is", "are", "was", "were", "be", "been",
  "between", "into", "onto", "over", "under", "through",
  "what", "who", "how", "why", "when", "where", "which", "tell", "say",
  "said", "think", "thinks", "thought", "know", "knows", "did", "does",
  "do", "can", "could", "would", "should", "will", "shall", "may", "might",
  "please", "give", "show", "describe", "explain", "summarise", "summarize",
  "summary", "overview", "advice", "thoughts", "view", "views", "opinion",
  "perspective", "according", "example", "examples", "like", "love", "hate",
  "mean", "means", "meaning", "talk", "talks", "talked", "talking",
  "find", "want", "need", "feel", "look", "make", "made", "take", "took",
  "come", "came", "went", "use", "used", "good", "bad", "best", "better",
  "worse", "more", "less", "most", "least", "many", "much", "some", "any",
  "all", "none", "every", "thing", "things", "stuff", "really", "very",
  "just", "quite", "also", "only", "even", "still", "yet", "then", "than",
  "too", "here", "there", "form", "forms",
]);

function stemLite(w: string): string {
  const x = w.toLowerCase();
  if (x.length <= 4) return x;
  if (x.endsWith("ies")) return x.slice(0, -3);
  if (x.endsWith("ing") && x.length > 5) return x.slice(0, -3);
  if (x.endsWith("ed") && x.length > 4) return x.slice(0, -2);
  if (x.endsWith("s") && !x.endsWith("ss")) return x.slice(0, -1);
  return x;
}

function extractKeywords(q: string): string[] {
  const raw = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of raw) {
    const s = stemLite(w);
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ model: "voyage-3", input: [text] }),
  });
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function run(q: string) {
  console.log(`\n❓ "${q}"`);
  const kws = extractKeywords(q);
  console.log(`   keywords: [${kws.join(", ")}]`);

  // Keyword search — AND first
  let kwTop: Array<{ episode_title: string; content: string; score: number }> = [];
  if (kws.length >= 2) {
    let q = supabase.from("transcript_chunks").select("episode_title, content");
    for (const k of kws) q = q.ilike("content", `%${k}%`);
    const { data } = await q.limit(30);
    if (data && data.length > 0) {
      kwTop = data.map((r) => {
        const low = (r.content as string).toLowerCase();
        let density = 0;
        for (const k of kws) {
          const m = low.match(new RegExp(k, "g"));
          density += m ? m.length : 0;
        }
        return { episode_title: r.episode_title as string, content: r.content as string, score: density };
      }).sort((a, b) => b.score - a.score).slice(0, 8);
    }
  }
  if (kwTop.length === 0 && kws.length > 0) {
    const orFilter = kws.map((k) => `content.ilike.%${k}%`).join(",");
    const { data } = await supabase.from("transcript_chunks").select("episode_title, content").or(orFilter).limit(500);
    kwTop = (data || []).map((r) => ({
      episode_title: r.episode_title as string, content: r.content as string,
      score: kws.filter((k) => (r.content as string).toLowerCase().includes(k)).length,
    })).sort((a, b) => b.score - a.score).slice(0, 8);
  }
  console.log(`   🔤 Keyword top 8:`);
  kwTop.forEach((r, i) => console.log(`      ${i+1}. [${r.score}] ${r.episode_title}`));

  // Vector search
  const emb = await embed(q);
  const { data: vec } = await supabase.rpc("match_chunks", { query_embedding: emb, match_count: 8 });
  console.log(`   🧠 Vector top 8:`);
  (vec || []).forEach((r: { episode_title: string }, i: number) =>
    console.log(`      ${i+1}. ${r.episode_title}`)
  );
}

async function main() {
  await run("How do communities form color?");
  await run("What is design");
  await run("How do I deal with creative block");
  await run("Thoughts on typography in India");
  await run("The role of rituals in architecture");
}

main().catch(console.error);
