import Anthropic from "@anthropic-ai/sdk";
import { HUMANIZER_VERSION } from "@/lib/humanizer-version";

const MODEL = "claude-sonnet-4-5-20250929";

const PARAPHRASE_PROMPT = `You will get numbered sentences. Rewrite them as a new draft.

Change the wording AND the sentence structure.
Keep every name, object, and plot point.
Do not copy a sentence word-for-word.
Do not output numbers.

Output only the paraphrased text, with paragraph breaks.`;

/** Chop into a numbered list. */
function chopForParaphrase(text: string): string {
  const sentences = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])(?:\s+|\n+)/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 1);

  if (sentences.length === 0) return text.trim();
  return sentences.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function stripWrappers(raw: string): string {
  return raw
    .trim()
    .replace(/^```[a-z]*\n?|\n?```$/g, "")
    .replace(/^Here(?:'s| is) the (?:rewritten|paraphrased) (?:text|version)[:\s]*/i, "")
    .trim();
}

/** Always-on wording swaps so the result cannot be a whitespace-only copy. */
const FORCE_SWAPS: [RegExp, string][] = [
  [/\bfound\b/gi, "came across"],
  [/\btiny\b/gi, "small"],
  [/\bglowing\b/gi, "shining"],
  [/\bbeneath\b/gi, "under"],
  [/\bwhispered\b/gi, "said softly"],
  [/\bflickered\b/gi, "winked"],
  [/\bfloated\b/gi, "drifted"],
  [/\bfollowed\b/gi, "went after"],
  [/\breached\b/gi, "came to"],
  [/\bfrightened\b/gi, "scared"],
  [/\btrapped\b/gi, "stuck"],
  [/\bfallen\b/gi, "downed"],
  [/\blifted\b/gi, "raised"],
  [/\bhurried free\b/gi, "bolted away"],
  [/\bsuddenly shone\b/gi, "blazed"],
  [/\bshone brighter\b/gi, "blazed brighter"],
  [/\bappeared\b/gi, "showed up"],
  [/\bcarried\b/gi, "took"],
  [/\bseemed to glow\b/gi, "kept glowing"],
  [/\bnoticed\b/gi, "saw"],
  [/\bbeautiful\b/gi, "lovely"],
  [/\bwonderful\b/gi, "amazing"],
  [/\bbegan\b/gi, "started"],
  [/\butilize\b/gi, "use"],
  [/\bindividuals\b/gi, "people"],
];

function forceWording(text: string): string {
  let result = text;
  for (const [pattern, replacement] of FORCE_SWAPS) {
    result = result.replace(pattern, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

/** Rebuild as short paragraphs so structure is not the original. */
function rebreakParagraphs(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length < 3) return text.trim();
  const blocks: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    blocks.push(sentences.slice(i, i + 2).join(" "));
  }
  return blocks.join("\n\n");
}

/**
 * Chop → Claude paraphrases → force wording/structure → return that.
 */
export async function runHumanizeWithClaude(
  anthropic: Anthropic,
  text: string,
  options?: { refine?: boolean; extreme?: boolean }
): Promise<string> {
  void options;
  const chopped = chopForParaphrase(text);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 1,
    system: PARAPHRASE_PROMPT,
    messages: [
      {
        role: "user",
        content: `Paraphrase this. Change wording and structure. Keep all context.\n\n${chopped}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "";
  const paraphrased = stripWrappers(raw);
  if (!paraphrased) return "";
  return rebreakParagraphs(forceWording(paraphrased));
}

export { HUMANIZER_VERSION };
