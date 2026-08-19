import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5-20250929";

const PARAPHRASE_PROMPT = `Paraphrase the numbered sentences into normal paragraphs.

Change the wording and the sentence structure.
Keep all meaning, names, details, and context.
Do not copy any sentence as-is.
Do not keep the numbers in the output.

Output only the paraphrased text.`;

/** Chop into a numbered list so Claude cannot paste the original layout back. */
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

/**
 * Chop → Claude paraphrases (new wording + structure, same context) → return that.
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
  return stripWrappers(raw);
}
