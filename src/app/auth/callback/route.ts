import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/** Derive a default username from OAuth user_metadata (e.g. Google full_name or email). */
function defaultUsernameFromOAuth(user: { user_metadata?: Record<string, unknown>; email?: string; id?: string }): string {
  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name ?? meta.name) as string | undefined;
  let raw = typeof fullName === "string" ? fullName.trim() : "";
  raw = raw
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, USERNAME_MAX);
  if (raw.length >= USERNAME_MIN && USERNAME_REGEX.test(raw)) return raw;
  const email = (user.email ?? "").trim();
  const prefix = email.split("@")[0] ?? "";
  raw = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, USERNAME_MAX);
  if (raw.length >= USERNAME_MIN) return raw;
  const fallback = "user_" + (user.id ?? "").slice(0, 8);
  return fallback.slice(0, USERNAME_MAX);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const admin = createAdminClient();
      let usernameToSet: string | null = null;
      const meta = data.user.user_metadata?.username;
      const fromForm = typeof meta === "string" ? meta.trim() : "";
      if (
        fromForm.length >= USERNAME_MIN &&
        fromForm.length <= USERNAME_MAX &&
        USERNAME_REGEX.test(fromForm)
      ) {
        usernameToSet = fromForm;
      } else {
        // OAuth (e.g. Google): set default username from name/email
        usernameToSet = defaultUsernameFromOAuth(data.user);
      }
      if (usernameToSet) {
        await admin
          .from("profiles")
          .update({ username: usernameToSet, updated_at: new Date().toISOString() })
          .eq("id", data.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
