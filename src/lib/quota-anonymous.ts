import type { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "bypassrai_anon_id";
const MAX_ANON_USES = 2;
const MAX_ANON_WORDS_PER_USE = 500;

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

  if (wordCount > MAX_ANON_WORDS_PER_USE) {
    return {
      allowed: false,
      status: 400,
      error: `Free tier allows up to ${MAX_ANON_WORDS_PER_USE} words per use. Create an account for more.`,
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
    if (usesCount >= MAX_ANON_USES) {
      return {
        allowed: false,
        status: 403,
        error: "Create an account to use more.",
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

    if (row) {
      await supabase
        .from("anonymous_usage")
        .update({
          uses_count: row.uses_count + 1,
          words_used: (row.words_used ?? 0) + wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("anonymous_id", anonymousId);
    } else {
      await supabase.from("anonymous_usage").insert({
        anonymous_id: anonymousId,
        uses_count: 1,
        words_used: wordCount,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Failed to increment anonymous usage:", e);
  }
}
