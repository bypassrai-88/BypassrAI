import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { humanizerPipelineOnly, stripRepetitivePeriods } from "@/lib/humanizer-pipeline";
import { runHumanizeWithClaude } from "@/lib/run-humanize";

/**
 * Dev-only: run humanizer on sample text without auth or quota.
 * Only available when NODE_ENV === "development".
 * Use for optimize-humanizer script.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  let body: { text?: string; refine?: boolean; skipClaude?: boolean; extreme?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const refine = body.refine === true;
  const skipClaude = body.skipClaude === true;
  const extreme = body.extreme === true;
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text." }, { status: 400 });
  }

  if (skipClaude) {
    try {
      const humanized = humanizerPipelineOnly(text, { aggressive: true, extreme });
      return NextResponse.json({ humanized: humanized || text });
    } catch (err) {
      console.error("Dev humanize-sample (pipeline-only) error:", err);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set." }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    let humanized = await runHumanizeWithClaude(anthropic, text, { refine, extreme });
    humanized = stripRepetitivePeriods(humanized ?? "");

    if (!humanized) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({ humanized });
  } catch (err) {
    console.error("Dev humanize-sample error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
