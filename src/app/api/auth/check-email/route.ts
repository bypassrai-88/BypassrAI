import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    return NextResponse.json({ exists: !!data });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
