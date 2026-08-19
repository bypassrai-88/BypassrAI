/**
 * Humanizer V3
 *
 *   our chop → Claude (make it human) → our polish
 *
 * Pre: break uniform AI cadence so Claude isn't copying the original's shape.
 * Claude: rewrite in a human voice (see HUMANIZE_SYSTEM).
 * Post: clean up so it's readable, then add light human texture so it isn't vanilla Claude.
 */
export const HUMANIZER_PIPELINE_VERSION = "v3";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(prob: number): boolean {
  return Math.random() < prob;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinSentences(sentences: string[]): string {
  return sentences.join(" ").replace(/\s+/g, " ").trim();
}

function sentenceWords(s: string): string[] {
  return s.replace(/[.!?]$/, "").trim().split(/\s+/).filter(Boolean);
}

function capFirst(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function uncapFirst(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function withEndPunct(inner: string, punct = "."): string {
  const trimmed = inner.trim().replace(/[.!?]+$/, "");
  return trimmed + punct;
}

/** Always strip these AI tells (not randomized). */
const ALWAYS_STRIP: [RegExp, string][] = [
  [/\bit is important to note that\s*/gi, ""],
  [/\bit is worth noting that\s*/gi, ""],
  [/\bit's important to (?:note|remember|understand) that\s*/gi, ""],
  [/\bFurthermore,\s*/g, ""],
  [/\bfurthermore,\s*/g, ""],
  [/\bMoreover,\s*/g, ""],
  [/\bmoreover,\s*/g, ""],
  [/\bAdditionally,\s*/g, "Also, "],
  [/\badditionally,\s*/g, "also, "],
  [/\bTherefore,\s*/g, "So, "],
  [/\btherefore,\s*/g, "so, "],
  [/\bplays? an? (?:important|crucial|vital|key) role in\b/gi, "is key to"],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
];

/** Plain-English swaps only (AI padding → human wording). Never the reverse. */
const PLAIN_SYNONYMS: [RegExp, string[]][] = [
  [/\butilizing\b/gi, ["using"]],
  [/\butilized\b/gi, ["used"]],
  [/\butilizes\b/gi, ["uses"]],
  [/\butilize\b/gi, ["use"]],
  [/\bindividuals\b/gi, ["people"]],
  [/\bfacilitating\b/gi, ["helping with"]],
  [/\bfacilitated\b/gi, ["helped with"]],
  [/\bfacilitates\b/gi, ["helps with"]],
  [/\bfacilitate\b/gi, ["help with"]],
  [/\bdemonstrating\b/gi, ["showing"]],
  [/\bdemonstrated\b/gi, ["showed"]],
  [/\bdemonstrates\b/gi, ["shows"]],
  [/\bdemonstrate\b/gi, ["show"]],
  [/\bindicating\b/gi, ["showing"]],
  [/\bindicated\b/gi, ["showed"]],
  [/\bindicates\b/gi, ["shows"]],
  [/\bindicate\b/gi, ["show"]],
  [/\bapproximately\b/gi, ["about", "around", "roughly"]],
  [/\bconsequently,\s*/gi, ["so ", "as a result, "]],
  [/\bnevertheless,\s*/gi, ["still, ", "even so, "]],
  [/\bhowever,\s+/gi, ["but ", "though "]],
  [/\ba large number of\b/gi, ["many"]],
  [/\ba significant number of\b/gi, ["many"]],
  [/\bin today's world\b/gi, ["today"]],
  [/\bin this day and age\b/gi, ["these days"]],
  [/\bcrucial\b/gi, ["key"]],
  [/\bpivotal\b/gi, ["key"]],
  [/\brobust\b/gi, ["strong"]],
  [/\bleverage\b/gi, ["use"]],
  [/\bdelve into\b/gi, ["look at"]],
  [/\bunderscoring\b/gi, ["showing"]],
  [/\bunderscored\b/gi, ["showed"]],
  [/\bunderscores\b/gi, ["shows"]],
  [/\bunderscore\b/gi, ["show"]],
  [/\bhighlighting\b/gi, ["pointing out"]],
  [/\bhighlighted\b/gi, ["pointed out"]],
  [/\bhighlights\b/gi, ["points out"]],
  [/\bhighlight\b/gi, ["point out"]],
  [/\bcomprehensive\b/gi, ["full"]],
  [/\bnumerous\b/gi, ["many"]],
  [/\bvarious\b/gi, ["different"]],
  [/\bmultiple\b/gi, ["several"]],
  [/\bsubsequently\b/gi, ["then", "later"]],
  [/\bpreviously\b/gi, ["earlier", "before"]],
  [/\bcurrently\b/gi, ["now"]],
  [/\bprior to\b/gi, ["before"]],
  [/\bin the event that\b/gi, ["if"]],
  [/\bwith regard to\b/gi, ["about"]],
  [/\bin terms of\b/gi, ["for"]],
  [/\bassist in\b/gi, ["help"]],
  [/\bconducted\b/gi, ["did", "ran"]],
  [/\bimplemented\b/gi, ["put in place"]],
  [/\bobtained\b/gi, ["got"]],
  [/\bcommenced\b/gi, ["started"]],
  [/\bterminated\b/gi, ["ended"]],
  [/\bendeavor\b/gi, ["effort"]],
  [/\bnoticed\b/gi, ["saw", "spotted"]],
  [/\bwonderful\b/gi, ["amazing"]],
  [/\bbeautiful\b/gi, ["pretty", "lovely"]],
  [/\bwhispered\b/gi, ["said quietly"]],
  [/\bbeneath\b/gi, ["under"]],
  [/\bbegan\b/gi, ["started"]],
  [/\bsurrounded by\b/gi, ["ringed by", "set in"]],
];

function applyAlwaysStrip(text: string): string {
  let result = text;
  for (const [pattern, replacement] of ALWAYS_STRIP) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function applyPlainSynonyms(text: string, rate: number): string {
  let result = applyAlwaysStrip(text);
  for (const [pattern, replacements] of PLAIN_SYNONYMS) {
    result = result.replace(pattern, (match) => {
      if (!chance(rate)) return match;
      return pick(replacements);
    });
  }
  return result;
}

/** Flip a few "Because X, Y" style openers so the shape isn't identical going into Claude. */
function chopClauseOrder(text: string, rate: number): string {
  const flips: [RegExp, (a: string, b: string, punct: string) => string][] = [
    [
      /\bBecause\s+([^,]+),\s*([^.!?]+)([.!?])/gi,
      (a, b, punct) => `${capFirst(b)} because ${uncapFirst(a)}${punct}`,
    ],
    [
      /\bWhen\s+([^,]+),\s*([^.!?]+)([.!?])/gi,
      (a, b, punct) => `${capFirst(b)} when ${uncapFirst(a)}${punct}`,
    ],
    [
      /\bAlthough\s+([^,]+),\s*([^.!?]+)([.!?])/gi,
      (a, b, punct) => `${capFirst(b)}, although ${uncapFirst(a)}${punct}`,
    ],
    [
      /\bWhile\s+([^,]+),\s*([^.!?]+)([.!?])/gi,
      (a, b, punct) => `${capFirst(b)} while ${uncapFirst(a)}${punct}`,
    ],
    [
      /\bIf\s+([^,]+),\s*([^.!?]+)([.!?])/gi,
      (a, b, punct) => `${capFirst(b)} if ${uncapFirst(a)}${punct}`,
    ],
  ];
  let result = text;
  for (const [regex, fn] of flips) {
    result = result.replace(regex, (full, a, b, punct) =>
      chance(rate) ? fn(String(a), String(b), String(punct)) : full
    );
  }
  return result;
}

/** Split a long sentence at a natural joint so Claude sees mixed lengths. */
function chopLongSentences(text: string, rate: number): string {
  const out: string[] = [];
  for (const s of splitSentences(text)) {
    const words = sentenceWords(s);
    const punct = s.match(/[.!?]$/)?.[0] ?? ".";
    if (words.length < 22 || !chance(rate)) {
      out.push(s);
      continue;
    }
    const inner = s.replace(/[.!?]$/, "");
    const joints = ["; ", ", which ", ", and ", " but ", " because ", " so "];
    let splitAt = -1;
    let jointLen = 0;
    for (const joint of joints) {
      const idx = inner.toLowerCase().indexOf(joint.toLowerCase());
      if (idx > 12 && idx < inner.length - 12) {
        splitAt = idx;
        jointLen = joint.length;
        break;
      }
    }
    if (splitAt === -1) {
      out.push(s);
      continue;
    }
    const left = inner.slice(0, splitAt).trim();
    let right = inner.slice(splitAt + jointLen).trim();
    if (!left || !right) {
      out.push(s);
      continue;
    }
    out.push(withEndPunct(left, punct === "?" ? "." : punct));
    out.push(withEndPunct(capFirst(right), punct));
  }
  return joinSentences(out);
}

/** Occasionally glue two short sentences so the rhythm isn't all chops. */
function glueShortSentences(text: string, rate: number): string {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return text;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const cur = sentences[i];
    const next = sentences[i + 1];
    if (
      next &&
      sentenceWords(cur).length <= 10 &&
      sentenceWords(next).length <= 12 &&
      chance(rate)
    ) {
      const left = cur.replace(/[.!?]$/, "").trim();
      const right = uncapFirst(next.replace(/[.!?]$/, "").trim());
      const punct = next.match(/[.!?]$/)?.[0] ?? ".";
      const sep = chance(0.45) ? "; " : ", and ";
      out.push(withEndPunct(left + sep + right, punct));
      i++;
    } else {
      out.push(cur);
    }
  }
  return joinSentences(out);
}

function mapParagraphs(text: string, fn: (paragraph: string) => string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => fn(p.replace(/[ \t]+/g, " ").trim()))
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Pre-Claude: light chop so the model isn't staring at a perfect copy.
 * Keeps paragraph breaks.
 */
export function humanizerPreprocess(text: string, options?: { extreme?: boolean }): string {
  const aggressive = options?.extreme === true || process.env.HUMANIZER_EXTREME === "1";
  return mapParagraphs(text.trim(), (paragraph) => {
    let result = paragraph;
    result = applyPlainSynonyms(result, aggressive ? 0.95 : 0.75);
    result = chopClauseOrder(result, aggressive ? 0.85 : 0.55);
    result = chopLongSentences(result, aggressive ? 0.8 : 0.6);
    result = glueShortSentences(result, aggressive ? 0.35 : 0.2);
    return result.replace(/[ \t]+/g, " ").trim();
  });
}

// ---------- post: make it legible, keep a human edge ----------

const AI_OPENERS = [
  /^#{1,6}\s+.*\n*/gm,
  /^\*\*Rewritten.*?\*\*\n*/i,
  /^Rewritten (?:Text|Version)[:\s]*/i,
  /^Here(?:'s| is) the rewritten (?:text|version)[:\s]*/i,
  /^(Here'?s?|Okay,?\s*so|Alright,?\s*so|So,?\s*basically)\s+/i,
];

const AI_TRANSITIONS: [RegExp, string][] = [
  [/\bFurthermore,\s*/gi, ""],
  [/\bMoreover,\s*/gi, ""],
  [/\bAdditionally,\s*/gi, "Also, "],
  [/\bIn conclusion,\s*/gi, ""],
  [/\bTo (?:sum up|summarize|conclude),\s*/gi, ""],
  [/\bOverall,\s*/gi, ""],
  [/\bIn summary,\s*/gi, ""],
  [/\bIt is important to (?:note|remember|understand) that\s*/gi, ""],
  [/\bIt's important to (?:note|remember|understand) that\s*/gi, ""],
  [/\bIt is worth noting that\s*/gi, ""],
  [/\bIn today's (?:world|society|digital age),?\s*/gi, ""],
  [/\bIn this day and age,?\s*/gi, ""],
  [/\bWhen it comes to\b/gi, "For"],
  [/\baforementioned\b/gi, "this"],
  [/\butilize\b/gi, "use"],
  [/\bleverage\b/gi, "use"],
  [/\bdelve into\b/gi, "look at"],
  [/\blandscape of\b/gi, "world of"],
  [/\btapestry of\b/gi, "mix of"],
  [/\bunderscores?\b/gi, "shows"],
  [/\bpivotal\b/gi, "key"],
  [/\brobust\b/gi, "strong"],
  [/\bplays an? (?:important|crucial|vital) role in\b/gi, "is key to"],
  [/\bin order to\b/gi, "to"],
  [/\bhelps? in the (\w+) of\b/gi, "helps $1"],
  [/\bthe maintenance of\b/gi, "keeping"],
  [/\bthe enhancement of\b/gi, "improving"],
  [/\bthe regulation of\b/gi, "regulating"],
  [/\bthe prevention of\b/gi, "preventing"],
  [/\bthe absorption of\b/gi, "absorbing"],
  [/\bthe digestion of\b/gi, "digesting"],
];

const APOSTROPHE_FIXES: [RegExp, string][] = [
  [/\bthats\b/gi, "that's"],
  [/\bwouldnt\b/gi, "wouldn't"],
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
  [/\bwhos\b/gi, "who's"],
  [/\bwhats\b/gi, "what's"],
  [/\bhes\b/g, "he's"],
  [/\bshes\b/g, "she's"],
];

function stripPreamble(text: string): string {
  let result = text;
  for (const pattern of AI_OPENERS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function stripAiTells(text: string): string {
  let result = text;
  for (const [pattern, replacement] of AI_TRANSITIONS) {
    result = result.replace(pattern, replacement as string);
  }
  result = result.replace(/[—–]/g, ", ");
  result = result.replace(/\s+,/g, ",");
  return result;
}

function fixApostrophes(text: string): string {
  let result = text;
  for (const [pattern, replacement] of APOSTROPHE_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/** Light contractions so it doesn't read like a textbook. Not every "it is". */
function addContractions(text: string, rate: number): string {
  const pairs: [RegExp, string][] = [
    [/\bit is\b/gi, "it's"],
    [/\bdo not\b/gi, "don't"],
    [/\bdoes not\b/gi, "doesn't"],
    [/\bdid not\b/gi, "didn't"],
    [/\bcannot\b/gi, "can't"],
    [/\bwill not\b/gi, "won't"],
    [/\bwould not\b/gi, "wouldn't"],
    [/\bshould not\b/gi, "shouldn't"],
    [/\bthat is\b/gi, "that's"],
    [/\bthere is\b/gi, "there's"],
    [/\bthey are\b/gi, "they're"],
    [/\bwe are\b/gi, "we're"],
    [/\byou are\b/gi, "you're"],
    [/\bI am\b/g, "I'm"],
  ];
  let result = text;
  for (const [pattern, replacement] of pairs) {
    result = result.replace(pattern, (match) => (chance(rate) ? replacement : match));
  }
  return result;
}

function mergeTinyFragments(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return text;
  const out: string[] = [];
  for (const s of sentences) {
    const prev = out[out.length - 1];
    const n = sentenceWords(s).length;
    if (prev && n > 0 && n <= 2) {
      const left = prev.replace(/[.!?]$/, "").trim();
      const frag = uncapFirst(s.replace(/[.!?]$/, "").trim());
      out[out.length - 1] = withEndPunct(`${left}, ${frag}`);
    } else {
      out.push(s);
    }
  }
  return joinSentences(out);
}

/** Mix lengths after Claude: split leftover run-ons, glue a couple of stubs. */
function polishBurstiness(text: string): string {
  let result = chopLongSentences(text, 0.4);
  result = glueShortSentences(result, 0.18);
  return result;
}

function normalizeCaps(text: string): string {
  return joinSentences(
    splitSentences(text).map((seg) => {
      // Keep existing capitalization inside the sentence (names, acronyms).
      // Only force the first letter.
      const punct = seg.match(/[.!?]$/)?.[0] ?? "";
      const inner = punct ? seg.slice(0, -punct.length) : seg;
      return capFirst(inner.trim()) + punct;
    })
  );
}

function cleanupSpacing(text: string): string {
  let t = text;
  t = t.replace(/\u2026/g, ".");
  t = t.replace(/\.{2,}/g, ".");
  t = t.replace(/\s+,/g, ",");
  t = t.replace(/,{2,}/g, ",");
  t = t.replace(/\s*;\s*/g, "; ");
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\s+([.!?])/g, "$1");
  t = t.replace(/([.!?])([A-Za-z])/g, "$1 $2");
  return t.trim();
}

/** Remove ALL repetitive periods: loop until no ".." or "..." remain. */
export function stripRepetitivePeriods(text: string): string {
  let t = text;
  let prev = "";
  let iterations = 0;
  while (prev !== t && iterations < 100) {
    prev = t;
    t = t.replace(/\u2026/g, ".");
    t = t.replace(/\.{2,}/g, ".");
    t = t.replace(/\.\s*\.\s*\./g, ".");
    t = t.replace(/\.\s*\./g, ".");
    t = t.replace(/\.\s*,\s*/g, ". ");
    iterations++;
  }
  return t;
}

/**
 * Post-Claude: keep it readable, strip chatbot residue, leave a little unevenness
 * so it doesn't look like a fresh Claude dump.
 */
export function humanizerPostProcess(text: string, options?: { extreme?: boolean }): string {
  const aggressive = options?.extreme === true || process.env.HUMANIZER_EXTREME === "1";
  let result = text.trim();
  result = stripPreamble(result);
  result = stripAiTells(result);
  result = applyPlainSynonyms(result, aggressive ? 0.85 : 0.55);
  result = fixApostrophes(result);
  result = addContractions(result, aggressive ? 0.55 : 0.35);
  result = polishBurstiness(result);
  result = mergeTinyFragments(result);
  result = cleanupSpacing(result);
  result = stripRepetitivePeriods(result);
  result = normalizeCaps(result);
  result = cleanupSpacing(result);
  return result.trim();
}

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function trigramOverlap(a: string, b: string): number {
  const grams = (s: string) => {
    const words = s.split(" ");
    const set = new Set<string>();
    for (let i = 0; i < words.length - 2; i++) {
      set.add(words.slice(i, i + 3).join(" "));
    }
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0) return 1;
  let hit = 0;
  for (const g of A) {
    if (B.has(g)) hit++;
  }
  return hit / A.size;
}

/** True when the model mostly copied the source instead of paraphrasing. */
export function looksLikeEcho(original: string, output: string): boolean {
  const a = normalizeForCompare(original);
  const b = normalizeForCompare(output);
  if (!a || !b) return true;
  if (a === b) return true;

  const origSentences = original
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalizeForCompare(s))
    .filter((s) => s.split(" ").length >= 6);

  if (origSentences.length > 0) {
    let copied = 0;
    for (const s of origSentences) {
      if (b.includes(s)) copied++;
    }
    if (copied / origSentences.length >= 0.4) return true;
  }

  return trigramOverlap(a, b) > 0.72;
}

/** Pipeline-only (no Claude): chop + polish. Used by optimizer / skipClaude. */
export function humanizerPipelineOnly(
  text: string,
  options?: boolean | { aggressive?: boolean; extreme?: boolean }
): string {
  const aggressive = typeof options === "boolean" ? options : options?.aggressive ?? false;
  const extreme = typeof options === "object" && options?.extreme;
  const opts = extreme ? { extreme: true } : undefined;
  let result = humanizerPreprocess(text.trim(), opts);
  result = humanizerPostProcess(result, opts);
  if (aggressive) {
    result = humanizerPostProcess(result, opts);
  }
  return result;
}
