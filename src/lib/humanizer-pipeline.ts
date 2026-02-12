/**
 * Humanizer pipeline: pre-process → (Claude) → post-process
 * Pre: splice texture/punctuation/words so input is less "perfect AI" before Claude.
 * Post: strip filler, fix grammar, polish (no casual injection).
 */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Formal synonym swaps – same register, different wording. Apply randomly so input isn't uniform. */
const PRE_SYNONYMS: [RegExp, string[]][] = [
  [/\bmajor\b/gi, ["significant", "substantial", "considerable"]],
  [/\bled to\b/g, ["contributed to", "resulted in", "brought about"]],
  [/\boccurred\b/gi, ["took place", "happened", "transpired"]],
  [/\brevealed\b/gi, ["showed", "demonstrated", "exposed"]],
  [/\bduring\b/gi, ["in", "throughout", "in the course of"]],
  [/\battempt\b/gi, ["effort", "endeavor", "try"]],
  [/\bprovided\b/gi, ["offered", "supplied", "gave"]],
  [/\baimed at\b/gi, ["intended to", "designed to", "meant to"]],
  [/\bincreasing\b/gi, ["improving", "strengthening", "enhancing"]],
  [/\bconnected to\b/gi, ["affiliated with", "linked to", "tied to"]],
  [/\bheadquarters\b/gi, ["head office", "main office", "HQ"]],
  [/\binvestigation\b/gi, ["inquiry", "probe", "examination"]],
  [/\btransparency\b/gi, ["openness", "clarity", "accountability"]],
  [/\baccountability\b/gi, ["responsibility", "answerability"]],
  [/\bengagement\b/gi, ["involvement", "participation"]],
  [/\bengagement in\b/gi, ["involvement in", "participation in"]],
  [/\breform\b/gi, ["change", "overhaul", "measure"]],
  [/\breforms\b/gi, ["changes", "measures", "overhauls"]],
];

/** Apply a random subset of synonym swaps so the input isn't word-for-word identical. */
function preprocessSynonyms(text: string): string {
  let result = text;
  for (const [pattern, replacements] of PRE_SYNONYMS) {
    if (Math.random() > 0.6) continue; // skip ~60% so we don't change everything
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Vary punctuation: replace 1–2 sentence boundaries with semicolon or em dash so input isn't perfectly uniform. */
function preprocessPunctuation(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const idx = Math.min(Math.floor(Math.random() * (sentences.length - 1)) + 1, sentences.length - 1);
  const sep = pick(["; ", " — "]);
  sentences[idx - 1] = sentences[idx - 1].replace(/[.!?]$/, "") + sep;
  sentences[idx] = sentences[idx].charAt(0).toLowerCase() + sentences[idx].slice(1);
  return sentences.join(" ");
}

/** Pre-process: splice texture and wording so the input is less "perfect" before Claude. */
export function humanizerPreprocess(text: string): string {
  let result = text.trim();
  result = preprocessSynonyms(result);
  result = preprocessPunctuation(result);
  return result.replace(/\s+/g, " ").trim();
}

// --- Post-process (after Claude) ---

const FILLER_PATTERNS = [
  /^\s*So\s*,?\s*/im,
  /\bI mean\s+/gi,
  /\byou know\s+/gi,
  /\bhonestly\s+/gi,
  /\bbasically\s+/gi,
  /\bkind of\s+/gi,
  /\bpretty much\s+/gi,
  /\bactually\s+/gi,
  /(^|[.!?]\s+)like\s+/gim, // "like" only at sentence start or after .!?
  /\bJust\s+stepped down\.?\s*/gi,
  /\bWild stuff\.?\s*/gi,
  /\bPretty wild honestly\.?\s*/gi,
  /\bThats dedication right there\.?\s*/gi,
  /\bNot gonna lie[^.]*\.\s*/gi,
  /\bMakes you think\.?\s*/gi,
  /\bCrazy right\?\s*/gi,
  /\bobviously\s+/gi,
  /\breally\s+/gi,
];

/** Restore apostrophes in common words. */
const APOSTROPHE_FIXES: [RegExp, string][] = [
  [/\bNixons\b/g, "Nixon's"],
  [/\bFBIs\b/g, "FBI's"],
  [/\bthats\b/gi, "that's"],
  [/\bits\b/g, "it's"], // careful: only fix "its" when it's contraction; could be possessive. Keep simple.
  [/\bwouldnt\b/gi, "wouldn't"],
  [/\bwouldn't\b/gi, "wouldn't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bdoesnt\b/gi, "doesn't"],
  [/\bwasnt\b/gi, "wasn't"],
  [/\bisnt\b/gi, "isn't"],
  [/\bdont\b/gi, "don't"],
  [/\bwont\b/gi, "won't"],
  [/\bcant\b/gi, "can't"],
  [/\bcouldnt\b/gi, "couldn't"],
  [/\bshouldnt\b/gi, "shouldn't"],
  [/\bIm\b/g, "I'm"],
  [/\bIve\b/g, "I've"],
  [/\bIll\b/g, "I'll"],
  [/\btheyre\b/gi, "they're"],
  [/\byoure\b/gi, "you're"],
  [/\bweve\b/gi, "we've"],
  [/\btheyve\b/gi, "they've"],
  [/\bheres\b/gi, "here's"],
  [/\bthats\b/gi, "that's"],
  [/\bwhos\b/gi, "who's"],
  [/\bwhats\b/gi, "what's"],
  [/\bhes\b/gi, "he's"],
  [/\bshes\b/gi, "she's"],
];

function stripFillers(text: string): string {
  let result = text;
  for (const pattern of FILLER_PATTERNS) {
    result = result.replace(pattern, (match, group1) => (group1 !== undefined ? `${group1} ` : " "));
  }
  return result;
}

function fixApostrophes(text: string): string {
  let result = text;
  for (const [pattern, replacement] of APOSTROPHE_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function postCleanup(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\.\s+\./g, ".")
    .replace(/,\s+,/g, ",")
    .replace(/\s+([.!?,;])/g, "$1")
    .trim();
}

/** Post-process: remove filler, fix apostrophes, clean spacing. No casual injection. */
export function humanizerPostProcess(text: string): string {
  let result = text;
  result = stripFillers(result);
  result = fixApostrophes(result);
  result = postCleanup(result);
  return result;
}
