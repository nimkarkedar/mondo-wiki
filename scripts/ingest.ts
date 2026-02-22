/**
 * tgp.wiki — Transcript Ingestion Script
 *
 * Run this whenever you add new transcripts to Google Drive:
 *   npx tsx scripts/ingest.ts
 *
 * It will:
 * 1. Read all files from your Google Drive folder
 * 2. Parse each format (.txt, .pdf, .srt, .docx, .doc, .epub)
 * 3. Chunk the text into ~500 word segments
 * 4. Embed each chunk with Voyage AI
 * 5. Store everything in Supabase
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import os from "os";
import path from "path";
import dotenv from "dotenv";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

dotenv.config({ path: ".env.local" });

// ── Clients ──────────────────────────────────────────────────────────────────

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function embedText(texts: string[]): Promise<number[][]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: "voyage-3", input: texts }),
    });
    const data = await res.json() as { data?: { embedding: number[] }[]; error?: string; detail?: string };
    if (data.data) return data.data.map((d) => d.embedding);
    console.warn(`   ⚠️  Voyage API attempt ${attempt} failed [${res.status}]: ${JSON.stringify(data)} — retrying in 5s...`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Voyage AI embedding failed after 3 attempts");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function chunkText(text: string, wordsPerChunk = 500): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

function parseSRT(content: string): string {
  // Strip SRT timestamps and indices, keep only dialogue
  return content
    .replace(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();
}

async function parseFile(filePath: string, mimeType: string, fileName: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".txt" || ext === ".srt") {
    const content = fs.readFileSync(filePath, "utf-8");
    return ext === ".srt" ? parseSRT(content) : content;
  }

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx" || ext === ".doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === ".epub") {
    // Basic epub text extraction
    const EPub = (await import("epub2")).default;
    return new Promise((resolve, reject) => {
      const epub = new EPub(filePath);
      epub.on("ready", () => {
        const texts: string[] = [];
        let remaining = epub.flow.length;
        if (remaining === 0) resolve("");
        epub.flow.forEach((chapter) => {
          epub.getChapter(chapter.id, (err: Error | null, text: string) => {
            if (!err) texts.push(text.replace(/<[^>]+>/g, " "));
            remaining--;
            if (remaining === 0) resolve(texts.join(" "));
          });
        });
      });
      epub.on("error", reject);
      epub.parse();
    });
  }

  return "";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
  console.log("🔍 Fetching files from Google Drive...");

  const listRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType)",
    pageSize: 1000,
  });

  const files = listRes.data.files ?? [];
  console.log(`📁 Found ${files.length} files\n`);

  for (const file of files) {
    if (!file.id || !file.name) continue;

    const ext = path.extname(file.name).toLowerCase();
    const supported = [".txt", ".pdf", ".srt", ".doc", ".docx", ".epub"];
    if (!supported.includes(ext)) {
      console.log(`⏭  Skipping ${file.name} (unsupported format)`);
      continue;
    }

    // Check if already ingested
    const { count } = await supabase
      .from("transcript_chunks")
      .select("*", { count: "exact", head: true })
      .eq("file_name", file.name);

    if (count && count > 0) {
      console.log(`✅ Already ingested: ${file.name}`);
      continue;
    }

    console.log(`⬇️  Downloading: ${file.name}`);
    const tmpPath = path.join(os.tmpdir(), file.name);

    // Download file
    const dest = fs.createWriteStream(tmpPath);
    await drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" },
      (err, res) => {
        if (err || !res) return;
        res.data.pipe(dest);
      }
    );

    // Wait for download to finish
    await new Promise<void>((resolve) => dest.on("finish", resolve));

    // Parse text
    const text = await parseFile(tmpPath, file.mimeType ?? "", file.name);
    fs.unlinkSync(tmpPath);

    if (!text.trim()) {
      console.log(`⚠️  No text extracted from ${file.name}`);
      continue;
    }

    // Chunk
    const chunks = chunkText(text);
    console.log(`   📝 ${chunks.length} chunks — embedding...`);

    // Embed in batches of 10
    const BATCH = 10;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const embeddings = await embedText(batch);

      const rows = batch.map((content, j) => ({
        file_name: file.name,
        episode_title: file.name.replace(/\.[^.]+$/, ""),
        chunk_index: i + j,
        content,
        embedding: embeddings[j],
      }));

      const { error } = await supabase.from("transcript_chunks").insert(rows);
      if (error) console.error("   ❌ Insert error:", error.message);
      else console.log(`   ✅ Stored chunks ${i + 1}–${Math.min(i + BATCH, chunks.length)}`);
      await sleep(1000); // brief pause between batches
    }

    console.log(`🎉 Done: ${file.name}\n`);
  }

  console.log("✨ Ingestion complete!");
}

main().catch(console.error);
