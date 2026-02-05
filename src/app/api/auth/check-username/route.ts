import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function POST(request: NextRequest) {
  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const raw = typeof body.username === "string" ? body.username.trim() : "";
  if (raw.length < USERNAME_MIN || raw.length > USERNAME_MAX) {
    return NextResponse.json({ error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.` }, { status: 400 });
  }
  if (!USERNAME_REGEX.test(raw)) {
    return NextResponse.json({ error: "Username can only contain letters, numbers, underscores, and hyphens." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", raw)
      .maybeSingle();
    return NextResponse.json({ taken: !!data });
  } catch {
    return NextResponse.json({ taken: false });
  }
}
