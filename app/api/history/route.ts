import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const limit = 5;

  const since = new Date();
  since.setDate(since.getDate() - 10);

  const { data: items, error } = await supabase
    .from("qa_history")
    .select("id, question, short_answer, long_answer, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = await Promise.all(
    (items ?? []).map(async (item) => {
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("rating")
        .eq("qa_history_id", item.id);

      const thumbsUp = feedbackData?.filter((f) => f.rating === "makes_sense").length ?? 0;
      const thumbsDown = feedbackData?.filter((f) => f.rating === "doesnt_make_sense").length ?? 0;

      return { ...item, thumbsUp, thumbsDown };
    })
  );

  return NextResponse.json({
    items: enriched,
    hasMore: (items?.length ?? 0) === limit,
  });
}
