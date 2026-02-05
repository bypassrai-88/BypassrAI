import { createAdminClient } from "@/lib/supabase/admin";

const TRIAL_WORDS = 5000;
const LITE_WORDS = 5000;   // $4.99/mo
const PRO_WORDS = 25000;   // $9.99/mo
const PREMIUM_WORDS = 250000; // $25/mo — Premium tier

type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string | null;
  plan: string | null;
  words_included: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export type UserQuotaResult =
  | { allowed: true; periodStart: string }
  | { allowed: false; status: number; error: string };

/**
 * Get subscription for user; if trial has ended, do lazy conversion (expire or convert to regular).
 */
export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, plan, words_included, current_period_start, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub) return null;

  const now = new Date();
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;

  // Trial ended: lazy conversion
  if (sub.status === "trial" && periodEnd && now >= periodEnd) {
    if (sub.cancel_at_period_end) {
      await supabase
        .from("subscriptions")
        .update({
          status: "expired",
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId);
      return null;
    }
    // Convert to Lite ($4.99/mo) — no Stripe yet, just DB
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan: "lite",
        words_included: LITE_WORDS,
        current_period_start: now.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);
    const { data: updated } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, plan, words_included, current_period_start, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .single();
    return updated;
  }

  if (sub.status === "expired") return null;
  return sub;
}

/**
 * Check if logged-in user can use wordCount words. Call only when user is logged in.
 */
export async function checkUserQuota(userId: string, wordCount: number): Promise<UserQuotaResult> {
  const sub = await getSubscription(userId);
  if (!sub) {
    return {
      allowed: false,
      status: 403,
      error: "Start a free trial or upgrade to continue.",
    };
  }

  const wordsIncluded = sub.words_included ?? 0;
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start).toISOString().slice(0, 10)
    : null;
  if (!periodStart) {
    return { allowed: false, status: 500, error: "Invalid subscription period." };
  }

  const supabase = createAdminClient();
  const { data: usageRow } = await supabase
    .from("usage")
    .select("words_used")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle();

  const wordsUsed = usageRow?.words_used ?? 0;
  if (wordsUsed + wordCount > wordsIncluded) {
    return {
      allowed: false,
      status: 400,
      error: `You've used ${wordsUsed} of ${wordsIncluded} words this period. Upgrade for more.`,
    };
  }

  return { allowed: true, periodStart };
}

/**
 * Increment usage after a successful AI call. periodStart = YYYY-MM-DD.
 */
export async function incrementUserUsage(
  userId: string,
  wordCount: number,
  periodStart: string
): Promise<void> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("usage")
    .select("words_used")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (row) {
    await supabase
      .from("usage")
      .update({
        words_used: row.words_used + wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("period_start", periodStart);
  } else {
    await supabase.from("usage").insert({
      user_id: userId,
      period_start: periodStart,
      words_used: wordCount,
      updated_at: new Date().toISOString(),
    });
  }
}

/** Words included in trial. */
export const TRIAL_WORDS_INCLUDED = TRIAL_WORDS;

/** Words per plan (for Stripe webhook mapping). */
export const WORDS_BY_PLAN: Record<string, number> = {
  lite: LITE_WORDS,
  pro: PRO_WORDS,
  premium: PREMIUM_WORDS,
};
