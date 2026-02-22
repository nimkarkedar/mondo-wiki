import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { question, short_answer, long_answer, rating, qa_history_id } = await req.json();

  const { error } = await supabase.from("feedback").insert({
    question,
    short_answer,
    long_answer,
    rating,
    ...(qa_history_id ? { qa_history_id } : {}),
  });

  if (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
