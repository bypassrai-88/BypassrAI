import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/account — profile, subscription, and current period usage for the logged-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();

  const [profileRes, subRes] = await Promise.all([
    admin.from("profiles").select("trial_used, stripe_customer_id, username").eq("id", user.id).maybeSingle(),
    admin.from("subscriptions").select("status, plan, words_included, current_period_start, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileRes.data;
  const subscription = subRes.data;
  const canManageBilling = Boolean(profile?.stripe_customer_id);

  let wordsUsed = 0;
  let periodStart: string | null = null;
  if (subscription?.current_period_start) {
    periodStart = new Date(subscription.current_period_start).toISOString().slice(0, 10);
    const { data: usageRow } = await admin
      .from("usage")
      .select("words_used")
      .eq("user_id", user.id)
      .eq("period_start", periodStart)
      .maybeSingle();
    wordsUsed = usageRow?.words_used ?? 0;
  }

  return NextResponse.json({
    email: user.email,
    created_at: user.created_at ?? null,
    profile: {
      trial_used: profile?.trial_used ?? false,
      can_manage_billing: canManageBilling,
      username: profile?.username ?? null,
    },
    subscription: subscription
      ? {
          status: subscription.status,
          plan: subscription.plan,
          words_included: subscription.words_included ?? 0,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        }
      : null,
    usage: periodStart ? { words_used: wordsUsed, period_start: periodStart } : null,
  });
}

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * PATCH /api/account — update profile (e.g. username).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.username !== undefined) {
    const raw = typeof body.username === "string" ? body.username.trim() : "";
    if (raw.length < USERNAME_MIN || raw.length > USERNAME_MAX) {
      return NextResponse.json(
        { error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.` },
        { status: 400 }
      );
    }
    if (!USERNAME_REGEX.test(raw)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens." },
        { status: 400 }
      );
    }
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("profiles")
      .update({ username: raw, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
      }
      return NextResponse.json({ error: "Could not update username." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
