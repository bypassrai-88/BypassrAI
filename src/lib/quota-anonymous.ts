import type { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPortfolioMode } from "@/config/site-variant";
import { QUOTA_PORTFOLIO_PREFIX } from "@/lib/quota-messages";
import { PORTFOLIO_FREE_WORDS_PER_MONTH } from "@/lib/quota-user";

const COOKIE_NAME = "bypassrai_anon_id";
const MAX_ANON_USES = 2;
const MAX_ANON_WORDS_PER_USE = 500;
/** Portfolio demo: generous caps without requiring sign-in (still abuse-bounded). */
const MAX_ANON_USES_PORTFOLIO = 80;
const MAX_ANON_WORDS_PORTFOLIO = 2500;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

export function getOrCreateAnonId(request: NextRequest): { id: string; isNew: boolean } {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value) {
    return { id: cookie.value, isNew: false };
  }
  const id = crypto.randomUUID();
  return { id, isNew: true };
}

export function setAnonCookie(response: NextResponse, anonId: string): void {
  response.cookies.set(COOKIE_NAME, anonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

type AnonymousQuotaResult =
  | { allowed: true; anonymousId: string; setCookie: boolean }
  | { allowed: false; status: number; error: string };

export async function checkAnonymousQuota(
  request: NextRequest,
  wordCount: number
): Promise<AnonymousQuotaResult> {
  const { id: anonymousId, isNew } = getOrCreateAnonId(request);
  const portfolio = isPortfolioMode();
  const maxWordsPerUse = portfolio ? MAX_ANON_WORDS_PORTFOLIO : MAX_ANON_WORDS_PER_USE;
  const maxUses = portfolio ? MAX_ANON_USES_PORTFOLIO : MAX_ANON_USES;

  if (wordCount > maxWordsPerUse) {
    return {
      allowed: false,
      status: 400,
      error: portfolio
        ? `${QUOTA_PORTFOLIO_PREFIX} up to ${maxWordsPerUse.toLocaleString()} words per request. Try a shorter passage or sign in for a higher monthly total.`
        : `Free tier allows up to ${MAX_ANON_WORDS_PER_USE} words per use. Create an account for more.`,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("anonymous_usage")
      .select("uses_count")
      .eq("anonymous_id", anonymousId)
      .maybeSingle();

    const usesCount = row?.uses_count ?? 0;
    if (usesCount >= maxUses) {
      return {
        allowed: false,
        status: 403,
        error: portfolio
          ? `${QUOTA_PORTFOLIO_PREFIX} request limit reached (${maxUses} uses per browser). Sign in for up to ${PORTFOLIO_FREE_WORDS_PER_MONTH.toLocaleString()} words/month without a subscription, or try again later.`
          : "Create an account to use more.",
      };
    }

    return { allowed: true, anonymousId, setCookie: isNew };
  } catch {
    return {
      allowed: false,
      status: 500,
      error: "Could not check usage. Please try again.",
    };
  }
}

export async function incrementAnonymousUsage(
  anonymousId: string,
  wordCount: number
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("anonymous_usage")
      .select("uses_count, words_used")
      .eq("anonymous_id", anonymousId)
      .maybeSingle();

    const now = new Date().toISOString();
    if (row) {
      await supabase
        .from("anonymous_usage")
        .update({
          uses_count: row.uses_count + 1,
          words_used: (row.words_used ?? 0) + wordCount,
          updated_at: now,
        })
        .eq("anonymous_id", anonymousId);
    } else {
      await supabase.from("anonymous_usage").insert({
        anonymous_id: anonymousId,
        uses_count: 1,
        words_used: wordCount,
        updated_at: now,
      });
    }
    // Log event for admin stats by period (all time, last month, week, today)
    try {
      await supabase.from("anonymous_usage_events").insert({
        anonymous_id: anonymousId,
        words_used: wordCount,
        created_at: now,
      });
    } catch {
      // Table may not exist yet; run the SQL in docs/SUPABASE_ANONYMOUS_EVENTS.md
    }
  } catch (e) {
    console.error("Failed to increment anonymous usage:", e);
  }
}
