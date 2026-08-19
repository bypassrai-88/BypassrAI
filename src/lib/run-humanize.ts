import Anthropic from "@anthropic-ai/sdk";
import {
  HUMANIZE_REFINE_SYSTEM,
  HUMANIZE_RETRY_SYSTEM,
  HUMANIZE_SYSTEM,
  HUMANIZE_USER_PREFIX,
} from "@/lib/prompts";
import {
  humanizerPostProcess,
  humanizerPreprocess,
  looksLikeEcho,
} from "@/lib/humanizer-pipeline";

const MODEL = "claude-sonnet-4-5-20250929";

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

function cleanAIArtifacts(raw: string): string {
  let text = raw;
  text = text.replace(/^#+ .*\n*/gm, "");
  text = text.replace(/^\*\*Rewritten.*?\*\*\n*/i, "");
  text = text.replace(/^Rewritten (?:Text|Version)[:\s]*/i, "");
  text = text.replace(/^Here(?:'s| is) the rewritten (?:text|version)[:\s]*/i, "");
  text = text.replace(/^(Here'?s?|Okay,?\s*so|Alright,?\s*so|So,?\s*basically)\s*/i, "");
  return text.trim();
}

async function claudeRewrite(
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
  return cleanAIArtifacts(dedupeResponse(raw));
}

export async function runHumanizeWithClaude(
  anthropic: Anthropic,
  text: string,
  options?: { refine?: boolean; extreme?: boolean }
): Promise<string> {
  const refine = options?.refine === true;
  const pipelineOpts = options?.extreme ? { extreme: true as const } : undefined;
  const chopped = refine ? text : humanizerPreprocess(text, pipelineOpts);
  const systemPrompt = refine ? HUMANIZE_REFINE_SYSTEM : HUMANIZE_SYSTEM;

  let rewritten = await claudeRewrite(anthropic, systemPrompt, chopped, 0.95);

  if (rewritten && looksLikeEcho(text, rewritten)) {
    rewritten = await claudeRewrite(anthropic, HUMANIZE_RETRY_SYSTEM, chopped, 1);
  }

  if (!rewritten) return "";
  return humanizerPostProcess(rewritten, pipelineOpts);
}
