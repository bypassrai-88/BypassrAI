import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const meta = data.user.user_metadata?.username;
      const raw = typeof meta === "string" ? meta.trim() : "";
      if (
        raw.length >= USERNAME_MIN &&
        raw.length <= USERNAME_MAX &&
        USERNAME_REGEX.test(raw)
      ) {
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .update({ username: raw, updated_at: new Date().toISOString() })
          .eq("id", data.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
