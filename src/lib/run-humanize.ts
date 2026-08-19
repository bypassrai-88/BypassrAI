import Anthropic from "@anthropic-ai/sdk";
import {
  HUMANIZE_REFINE_SYSTEM,
  HUMANIZE_RETRY_SYSTEM,
  HUMANIZE_SYSTEM,
  HUMANIZE_USER_PREFIX,
} from "@/lib/prompts";
import { humanizerPreprocess, looksLikeEcho } from "@/lib/humanizer-pipeline";

const MODEL = "claude-sonnet-4-5-20250929";

/** Strip chatbot wrappers only. Do not rewrite Claude's paraphrase. */
function cleanAIArtifacts(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```[a-z]*\n?|\n?```$/g, "");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/^\*\*Rewritten.*?\*\*\s*/i, "");
  text = text.replace(/^Rewritten (?:Text|Version)[:\s]*/i, "");
  text = text.replace(/^Here(?:'s| is) the (?:rewritten|paraphrased) (?:text|version)[:\s]*/i, "");
  text = text.replace(/^(Here'?s?|Okay,?\s*so|Alright,?\s*so|Of course!?)\s*/i, "");
  return text.trim();
}

async function claudeParaphrase(
  anthropic: Anthropic,
  system: string,
  userText: string,
  temperature: number
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature,
    system,
    messages: [{ role: "user", content: `${HUMANIZE_USER_PREFIX}${userText}` }],
  });
  const block = response.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "";
  return cleanAIArtifacts(raw);
}

/**
 * Preprocess (ours) → Claude paraphrases → return that.
 */
export async function runHumanizeWithClaude(
  anthropic: Anthropic,
  text: string,
  options?: { refine?: boolean; extreme?: boolean }
): Promise<string> {
  const refine = options?.refine === true;
  const pipelineOpts = options?.extreme ? { extreme: true as const } : undefined;
  const chopped = refine ? text : humanizerPreprocess(text, pipelineOpts);
  const systemPrompt = refine ? HUMANIZE_REFINE_SYSTEM : HUMANIZE_SYSTEM;

  let rewritten = await claudeParaphrase(anthropic, systemPrompt, chopped, 0.95);

  if (rewritten && looksLikeEcho(text, rewritten)) {
    rewritten = await claudeParaphrase(anthropic, HUMANIZE_RETRY_SYSTEM, chopped, 1);
  }

  return rewritten;
}
