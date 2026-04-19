/**
 * Test the name-aware retrieval against real archive titles.
 * Mirrors the logic in app/api/ask/route.ts exactly.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NON_NAME_TOKENS = new Set([
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
  "designing", "making", "writing", "drawing", "painting", "building",
  "discussing", "creating", "learning", "teaching", "reading", "knowing",
  "understanding", "hiring", "leading", "working", "studying",
  "type", "typography", "book", "books", "space", "spaces", "leadership",
  "leader", "leaders", "illustration", "illustrator", "music", "film",
  "films", "cinema", "poetry", "writer", "photographer", "photography",
  "painter", "cover", "covers", "brand", "branding", "logo", "logos",
  "identity", "product", "craft", "culture", "taste", "voice", "vision",
  "critique", "feedback", "client", "brief", "career", "portfolio",
  "process", "practice", "inspiration", "muse", "research", "synthesis",
  "education", "history", "philosophy", "aesthetic", "material", "method",
  "methods", "approach", "story", "stories", "narrative", "path", "work",
  "works", "project", "projects", "piece", "pieces", "series", "collection",
  "show", "exhibition", "museum", "gallery", "studio", "agency", "company",
  "startup", "student", "students", "teacher", "mentor", "lesson", "lessons",
  "context", "style", "styles", "movement", "concept", "concepts",
  "principle", "principles", "rule", "rules", "color", "colour", "form",
  "line", "print", "digital", "web", "app", "mobile", "tool", "tools",
  "design", "art", "artist", "designer", "creative", "creativity", "idea",
  "ideas", "podcast", "conversation", "feat", "ft", "india", "indian",
  "architecture", "films", "thinking", "generalists", "specialists",
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct",
  "nov", "dec", "january", "february", "march", "april", "june", "july",
  "august", "september", "october", "november", "december",
]);

function tokenizeTitle(title: string): string[] {
  return title
    .split(/[\s._\-]+/)
    .map((t) => t.toLowerCase().replace(/[^a-z]/g, ""))
    .filter((t) => t.length >= 3 && !/^\d+$/.test(t) && !NON_NAME_TOKENS.has(t));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i, ...new Array(b.length).fill(0)];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    for (let k = 0; k <= b.length; k++) prev[k] = cur[k];
  }
  return prev[b.length];
}

function matchStrength(q: string, t: string): number {
  if (q === t) return 3;
  if (q.length >= 5 && t.length >= 5) {
    if (t.startsWith(q) || q.startsWith(t)) return 3;
  }
  if (q.length >= 5 && t.length >= 5 &&
      Math.abs(q.length - t.length) <= 1 &&
      levenshtein(q, t) <= 1) {
    return 2;
  }
  return 0;
}

function scoreTitle(qTokens: string[], tTokens: string[]): number {
  let score = 0;
  for (const q of qTokens) {
    let best = 0;
    for (const t of tTokens) {
      best = Math.max(best, matchStrength(q, t));
      if (best === 3) break;
    }
    score += best;
  }
  for (let i = 0; i < qTokens.length - 1; i++) {
    for (let j = 0; j < tTokens.length - 1; j++) {
      if (matchStrength(qTokens[i], tTokens[j]) > 0 &&
          matchStrength(qTokens[i + 1], tTokens[j + 1]) > 0) {
        score += 5;
      }
    }
  }
  return score;
}

async function main() {
  const seen = new Set<string>();
  for (let offset = 0; offset < 20000; offset += 1000) {
    const { data } = await supabase
      .from("transcript_chunks")
      .select("episode_title")
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const r of data) seen.add(r.episode_title as string);
    if (data.length < 1000) break;
  }
  const entries = Array.from(seen).map((title) => ({ title, tokens: tokenizeTitle(title) }));
  console.log(`📚 ${entries.length} distinct episodes\n`);

  const tests: Array<[string, string]> = [
    ["What is Design by Susmita", "Susmita Mohanty"],
    ["Tell me about Susmita Mohanty", "Susmita Mohanty"],
    ["What did Ahlawat say about designing a book", "Ahlawat Gunjan"],
    ["Pinki De on illustration", "PINAKI DE"],
    ["Rupali Gupte space", "Rupali Gupte"],
    ["Ayush on type", "Ayush Chauhan"],
    ["Summarise Sushmita's episode", "Susmita Mohanty"],
    ["What does Gunjan say about covers", "Ahlawat Gunjan"],
    ["Design a book", "(vector)"],
    ["How do I find my voice as a designer", "(vector)"],
    ["What is creativity", "(vector)"],
    ["Something random about cricket", "(vector)"],
    ["Tell me about design leadership", "(vector)"],
  ];

  let pass = 0, fail = 0;
  for (const [q, expect] of tests) {
    const qTokens = q
      .split(/[\s,.?!]+/)
      .map((w) => w.toLowerCase().replace(/[^a-z']/g, "").replace(/'s$/, ""))
      .filter((w) => w.length >= 3 && !NON_NAME_TOKENS.has(w));
    let best: { title: string; score: number } | null = null;
    for (const e of entries) {
      const s = scoreTitle(qTokens, e.tokens);
      if (s > 0 && (!best || s > best.score)) best = { title: e.title, score: s };
    }
    let result = "(vector)";
    if (best) {
      if (best.score >= 3) result = best.title;
      else if (best.score === 2) {
        const entry = entries.find((e) => e.title === best!.title);
        if (entry && entry.tokens.length <= 2) result = best.title;
      }
    }
    const ok = result.toLowerCase().includes(expect.toLowerCase()) ||
               (expect === "(vector)" && result === "(vector)");
    if (ok) pass++; else fail++;
    console.log(`${ok ? "✅" : "❌"} "${q}"\n   [${qTokens.join(", ")}] → ${result}  (score ${best?.score ?? 0})`);
  }
  console.log(`\n${pass}/${pass + fail} passed`);
}

main().catch(console.error);
