import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest) {
  // Fetch a small buffer so dedupe by question still leaves ~10 unique items.
  const fetchLimit = 25;
  const displayLimit = 10;

  const { data: raw, error } = await supabase
    .from("qa_history")
    .select("id, question, short_answer, long_answer, created_at")
    .neq("short_answer", "__OUT_OF_SYLLABUS__")
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (raw ?? []).slice(0, displayLimit);

  const enriched = await Promise.all(
    items.map(async (item) => {
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("rating")
        .eq("qa_history_id", item.id);

      const thumbsUp = feedbackData?.filter((f) => f.rating === "makes_sense").length ?? 0;
      const thumbsDown = feedbackData?.filter((f) => f.rating === "doesnt_make_sense").length ?? 0;

      return { ...item, thumbsUp, thumbsDown };
    })
  );

  return NextResponse.json({ items: enriched });
}
