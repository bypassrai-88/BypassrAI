import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  checkAnonymousQuota,
  countWords,
  incrementAnonymousUsage,
  setAnonCookie,
} from "@/lib/quota-anonymous";
import {
  checkUserQuota,
  incrementUserUsage,
} from "@/lib/quota-user";
import { HUMANIZE_SYSTEM, HUMANIZE_REFINE_SYSTEM } from "@/lib/prompts";
import { humanizerPreprocess, humanizerPostProcess } from "@/lib/humanizer-pipeline";

/** Remove duplicate output if model repeated itself */
function dedupeResponse(raw: string): string {
  const minChunk = 80;
  if (raw.length < minChunk * 2) return raw;
  
  const firstChunk = raw.slice(0, minChunk);
  const rest = raw.slice(minChunk);
  const repeatIndex = rest.indexOf(firstChunk);
  
  if (repeatIndex !== -1) {
    return raw.slice(0, minChunk + repeatIndex).trim();
  }
  
  return raw;
}

/** Clean AI artifacts from output */
function cleanAIArtifacts(raw: string): string {
  let text = raw;
  
  // Remove markdown headers
  text = text.replace(/^#+ .*\n*/gm, "");
  text = text.replace(/^\*\*Rewritten.*?\*\*\n*/i, "");
  text = text.replace(/^Rewritten (?:Text|Version)[:\s]*/i, "");
  text = text.replace(/^Here(?:'s| is) the rewritten (?:text|version)[:\s]*/i, "");
  
  // Remove common AI openers
  text = text.replace(/^(Here'?s?|Okay,?\s*so|Alright,?\s*so|So,?\s*basically)\s*/i, "");
  
  return text.trim();
}

export async function POST(request: NextRequest) {
  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (_) {}

  let body: { text?: string; refine?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const refine = body.refine === true;
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text." }, { status: 400 });
  }

  const maxChars = 10000;
  if (text.length > maxChars) {
    return NextResponse.json({ error: `Text is too long. Maximum ${maxChars} characters.` }, { status: 400 });
  }

  const wordCount = countWords(text);
  const maxWordsPerRequest = 2500;
  if (wordCount > maxWordsPerRequest) {
    return NextResponse.json({ error: `Maximum ${maxWordsPerRequest.toLocaleString()} words per request.` }, { status: 400 });
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Pre-process: skip or lighten when refining (text already humanized once)
    const textForClaude = refine ? text : humanizerPreprocess(text);

    const systemPrompt = refine ? HUMANIZE_REFINE_SYSTEM : HUMANIZE_SYSTEM;

    // Call Claude: high temperature + perplexity for human-like variation
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 1.0,
      system: systemPrompt,
      messages: [{ role: "user", content: textForClaude }],
    });

    const block = response.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text.trim() : "";

    // Post-process: strip filler, fix apostrophes, clean spacing (no casual injection)
    let humanized = dedupeResponse(raw);
    humanized = cleanAIArtifacts(humanized);
    humanized = humanizerPostProcess(humanized);

    if (!humanized) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    // Update usage
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

    const resp = NextResponse.json({ humanized });
    if (!user) {
      const quota = await checkAnonymousQuota(request, wordCount);
      if (quota.allowed && quota.setCookie) {
        setAnonCookie(resp, quota.anonymousId);
      }
    }
    return resp;
  } catch (err) {
    console.error("Humanize API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Something went wrong." }, { status: 502 });
  }
}
