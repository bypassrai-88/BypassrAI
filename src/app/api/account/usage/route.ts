import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/account/usage — usage history (words per period) for the logged-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("usage")
    .select("period_start, words_used")
    .eq("user_id", user.id)
    .order("period_start", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json({ error: "Could not load usage." }, { status: 500 });
  }

  return NextResponse.json({
    usage: (rows ?? []).map((r) => ({
      period_start: r.period_start,
      words_used: r.words_used ?? 0,
    })),
  });
}
