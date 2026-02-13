import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  checkAnonymousQuota,
  incrementAnonymousUsage,
  setAnonCookie,
} from "@/lib/quota-anonymous";
import {
  checkUserQuota,
  incrementUserUsage,
} from "@/lib/quota-user";
import { ESSAY_WRITER_SYSTEM } from "@/lib/prompts";

type EssayParams = {
  typeOfPaper?: string;
  topic?: string;
  purpose?: string;
  gradeLevel?: string;
  format?: string;
  wordCount?: number;
  tone?: string;
  vocabulary?: string;
  pointOfView?: string;
  additionalRequirements?: string;
};

function buildUserMessage(p: EssayParams): string {
  const parts: string[] = [];
  if (p.typeOfPaper) parts.push(`Type of paper: ${p.typeOfPaper}`);
  if (p.topic) parts.push(`Topic or question: ${p.topic}`);
  if (p.purpose) parts.push(`Purpose: ${p.purpose}`);
  if (p.gradeLevel) parts.push(`Grade/Level: ${p.gradeLevel}`);
  if (p.format) parts.push(`Format: ${p.format}`);
  if (p.wordCount) parts.push(`Word count: ${p.wordCount}`);
  if (p.tone) parts.push(`Tone: ${p.tone}`);
  if (p.vocabulary) parts.push(`Vocabulary level: ${p.vocabulary}`);
  if (p.pointOfView) parts.push(`Point of view: ${p.pointOfView}`);
  if (p.additionalRequirements) parts.push(`Additional requirements: ${p.additionalRequirements}`);
  return parts.length ? parts.join("\n") : "Write a general academic essay.";
}

export async function POST(request: NextRequest) {
  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (_) {}

  let body: EssayParams;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return NextResponse.json({ error: "Topic or question is required." }, { status: 400 });
  }

  const requestedWords = typeof body.wordCount === "number" && body.wordCount > 0
    ? Math.min(body.wordCount, 2000)
    : 500;
  const wordCountForQuota = requestedWords;

  if (user) {
    const quota = await checkUserQuota(user.id, wordCountForQuota);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }
  } else {
    const quota = await checkAnonymousQuota(request, wordCountForQuota);
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
    const userMessage = buildUserMessage(body);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      temperature: 0.7,
      system: ESSAY_WRITER_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content.find((b) => b.type === "text");
    const essay = block && block.type === "text" ? block.text.trim() : "";

    if (!essay) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    if (user) {
      const quota = await checkUserQuota(user.id, wordCountForQuota);
      if (quota.allowed) {
        await incrementUserUsage(user.id, wordCountForQuota, quota.periodStart);
      }
    } else {
      const quota = await checkAnonymousQuota(request, wordCountForQuota);
      if (quota.allowed) {
        await incrementAnonymousUsage(quota.anonymousId, wordCountForQuota);
      }
    }

    const resp = NextResponse.json({ essay });
    if (!user) {
      const quota = await checkAnonymousQuota(request, wordCountForQuota);
      if (quota.allowed && quota.setCookie) {
        setAnonCookie(resp, quota.anonymousId);
      }
    }
    return resp;
  } catch (err) {
    console.error("Essay writer API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Something went wrong." }, { status: 502 });
  }
}
