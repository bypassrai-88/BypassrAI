import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  checkAnonymousQuota,
  countWords,
  incrementAnonymousUsage,
  setAnonCookie,
} from "@/lib/quota-anonymous";
import { checkUserQuota, incrementUserUsage } from "@/lib/quota-user";
import { SUMMARIZE_SYSTEM } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (_) {}

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Missing or empty text." },
      { status: 400 }
    );
  }

  const maxChars = 10000;
  if (text.length > maxChars) {
    return NextResponse.json(
      { error: `Text is too long. Maximum ${maxChars} characters.` },
      { status: 400 }
    );
  }

  const wordCount = countWords(text);
  const maxWordsPerRequest = 2500;
  if (wordCount > maxWordsPerRequest) {
    return NextResponse.json(
      { error: `Maximum ${maxWordsPerRequest.toLocaleString()} words per request.` },
      { status: 400 }
    );
  }
  if (user) {
    const quota = await checkUserQuota(user.id, wordCount);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }
  } else {
    const quota = await checkAnonymousQuota(request, wordCount);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: SUMMARIZE_SYSTEM,
      messages: [{ role: "user", content: text }],
    });

    const block = message.content.find((b) => b.type === "text");
    const result =
      block && block.type === "text" ? block.text.trim() : "";

    if (!result) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 502 }
      );
    }

    if (user) {
      const quota = await checkUserQuota(user.id, wordCount);
      if (quota.allowed) {
        await incrementUserUsage(user.id, wordCount, quota.periodStart);
      }
    } else {
      const quota = await checkAnonymousQuota(request, wordCount);
      if (quota.allowed) {
        await incrementAnonymousUsage(quota.anonymousId, wordCount);
      }
    }
    const response = NextResponse.json({ result });
    if (!user) {
      const quota = await checkAnonymousQuota(request, wordCount);
      if (quota.allowed && quota.setCookie) {
        setAnonCookie(response, quota.anonymousId);
      }
    }
    return response;
  } catch (err) {
    console.error("Summarize API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 502 }
    );
  }
}
