/**
 * Wipe transcript_chunks rows for specific files so a subsequent
 * `npx tsx scripts/ingest.ts` will re-ingest them with fresh content.
 *
 * Use when a transcript on Drive has been updated but the filename is
 * unchanged — the default ingest dedupe is by filename and would
 * otherwise skip it.
 *
 * Usage:
 *   npx tsx scripts/wipe-files.ts "Rahool Gadkari.txt" "Manisha-Pande-Transcript.txt"
 *   npx tsx scripts/ingest.ts
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error("Usage: npx tsx scripts/wipe-files.ts <filename> [filename ...]");
    process.exit(1);
  }

  for (const name of targets) {
    const { count: before } = await supabase
      .from("transcript_chunks")
      .select("*", { count: "exact", head: true })
      .eq("file_name", name);
    const { error } = await supabase
      .from("transcript_chunks")
      .delete()
      .eq("file_name", name);
    if (error) console.error(`❌ ${name}: ${error.message}`);
    else console.log(`🗑  Wiped ${before ?? 0} chunks for: ${name}`);
  }
}

main().catch(console.error);
