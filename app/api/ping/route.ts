import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Keep-alive endpoint — called by Vercel Cron every 3 days to prevent
// Supabase free-tier from pausing the project due to inactivity.
export async function GET() {
  const { error } = await supabase
    .from("qa_history")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Ping failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
