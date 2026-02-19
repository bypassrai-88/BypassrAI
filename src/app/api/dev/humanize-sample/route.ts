import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { HUMANIZE_SYSTEM, HUMANIZE_REFINE_SYSTEM } from "@/lib/prompts";
import { humanizerPreprocess, humanizerPostProcess, humanizerPipelineOnly } from "@/lib/humanizer-pipeline";

/** Remove duplicate output if model repeated itself */
function dedupeResponse(raw: string): string {
  const minChunk = 80;
  if (raw.length < minChunk * 2) return raw;
  const firstChunk = raw.slice(0, minChunk);
  const rest = raw.slice(minChunk);
  const repeatIndex = rest.indexOf(firstChunk);
  if (repeatIndex !== -1) return raw.slice(0, minChunk + repeatIndex).trim();
  return raw;
}

function cleanAIArtifacts(raw: string): string {
  let text = raw;
  text = text.replace(/^#+ .*\n*/gm, "");
  text = text.replace(/^\*\*Rewritten.*?\*\*\n*/i, "");
  text = text.replace(/^Rewritten (?:Text|Version)[:\s]*/i, "");
  text = text.replace(/^Here(?:'s| is) the rewritten (?:text|version)[:\s]*/i, "");
  text = text.replace(/^(Here'?s?|Okay,?\s*so|Alright,?\s*so|So,?\s*basically)\s*/i, "");
  return text.trim();
}

/**
 * Dev-only: run humanizer on sample text without auth or quota.
 * Only available when NODE_ENV === "development".
 * Use for optimize-humanizer script.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  let body: { text?: string; refine?: boolean; skipClaude?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const refine = body.refine === true;
  const skipClaude = body.skipClaude === true;
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text." }, { status: 400 });
  }

  // Pipeline-only: no Claude, run pre + post (aggressive = post twice)
  if (skipClaude) {
    try {
      const humanized = humanizerPipelineOnly(text, true);
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
    const textForClaude = refine ? text : humanizerPreprocess(humanizerPreprocess(text));
    const systemPrompt = refine ? HUMANIZE_REFINE_SYSTEM : HUMANIZE_SYSTEM;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 1.0,
      system: systemPrompt,
      messages: [{ role: "user", content: textForClaude }],
    });

    const block = response.content.find((b) => b.type === "text");
    let raw = block && block.type === "text" ? block.text.trim() : "";
    let humanized = dedupeResponse(raw);
    humanized = cleanAIArtifacts(humanized);
    humanized = humanizerPostProcess(humanized);

    // Second pass (refine) when doing full humanize
    if (!refine && humanized) {
      const refineResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        temperature: 1.0,
        system: HUMANIZE_REFINE_SYSTEM,
        messages: [{ role: "user", content: humanized }],
      });
      const refineBlock = refineResponse.content.find((b) => b.type === "text");
      raw = refineBlock && refineBlock.type === "text" ? refineBlock.text.trim() : "";
      humanized = dedupeResponse(raw);
      humanized = cleanAIArtifacts(humanized);
      humanized = humanizerPostProcess(humanized);
      humanized = humanizerPostProcess(humanized); // second post-pass to strip remaining AI phrasing
    }

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
