/**
 * Humanizer pipeline V2: intense pre-process → (Claude) → strong post-process
 * V2: structure-merge safeguard, artifact fixes.
 * Set HUMANIZER_EXTREME=1 for extreme run: max swapping, splits, synonyms, grammar chaos (aim for human score then dial back).
 */
export const HUMANIZER_PIPELINE_VERSION = "v2.2";

let extremeMode = false;
function setExtremeMode(extreme: boolean): void {
  extremeMode = extreme;
}
function p(normal: number, extreme: number): number {
  return extremeMode ? extreme : normal;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function applyProb(prob: number): boolean {
  return Math.random() < prob;
}

// ========== PRE-PROCESS: intense ==========

/** Large formal synonym set – apply most of them to heavily vary input. */
const PRE_SYNONYMS: [RegExp, string[]][] = [
  // Do NOT replace "major" in "Major League" / "major league" (proper term)
  [/\bmajor\b(?!\s+league)/gi, ["significant", "substantial", "considerable", "notable"]],
  [/\bled to\b/g, ["contributed to", "resulted in", "brought about", "caused"]],
  [/\boccurred\b/gi, ["took place", "happened", "transpired"]],
  [/\brevealed\b/gi, ["showed", "demonstrated", "exposed", "uncovered"]],
  [/\bduring\b/gi, ["in", "throughout", "in the course of", "over"]],
  [/\battempt\b/gi, ["effort", "endeavor", "try"]],
  [/\bprovided\b/gi, ["offered", "supplied", "gave", "furnished"]],
  [/\baimed at\b/gi, ["intended to", "designed to", "meant to"]],
  [/\bincreasing\b/gi, ["improving", "strengthening", "enhancing", "boosting"]],
  [/\bconnected to\b/gi, ["affiliated with", "linked to", "tied to", "associated with"]],
  [/\bheadquarters\b/gi, ["head office", "main office", "HQ"]],
  [/\binvestigation\b/gi, ["inquiry", "probe", "examination", "review"]],
  [/\btransparency\b/gi, ["openness", "clarity", "accountability"]],
  [/\baccountability\b/gi, ["responsibility", "answerability"]],
  [/\bengagement\b/gi, ["involvement", "participation"]],
  [/\breform\b/gi, ["change", "overhaul", "measure", "revision"]],
  [/\breforms\b/gi, ["changes", "measures", "overhauls", "revisions"]],
  [/\bhowever\b/gi, ["but", "though", "although", "yet"]],
  [/\btherefore\b/gi, ["thus", "hence", "accordingly", "so"]],
  [/\bfurthermore\b/gi, ["additionally", "moreover", "also", "further"]],
  [/\bconsequently\b/gi, ["as a result", "thus", "accordingly"]],
  [/\bnevertheless\b/gi, ["nonetheless", "still", "even so"]],
  [/\bimportant\b/gi, ["significant", "notable", "key", "critical"]],
  [/\bmany\b/gi, ["numerous", "several", "various", "multiple"]],
  [/\bbegan\b/gi, ["started", "commenced", "initiated"]],
  [/\bended\b/gi, ["concluded", "finished", "terminated"]],
  [/\bcreated\b/gi, ["established", "formed", "produced"]],
  [/\bdeveloped\b/gi, ["evolved", "emerged", "grew"]],
  [/\brequired\b/gi, ["needed", "demanded", "called for"]],
  [/\bincluding\b/gi, ["such as", "among them", "like"]],
  [/\bespecially\b/gi, ["particularly", "notably", "specifically"]],
  [/\bactually\b/gi, ["in fact", "indeed", "really"]],
  [/\bcurrently\b/gi, ["now", "at present", "today"]],
  [/\bpreviously\b/gi, ["earlier", "before", "prior to this"]],
  [/\bfinally\b/gi, ["at last", "in the end", "ultimately"]],
  [/\bclearly\b/gi, ["obviously", "evidently", "plainly"]],
  [/\bcertainly\b/gi, ["definitely", "surely", "undoubtedly"]],
  [/\bapproximately\b/gi, ["roughly", "about", "around"]],
  [/\bensure\b/gi, ["guarantee", "make sure", "secure"]],
  [/\butilize\b/gi, ["use", "employ", "apply"]],
  [/\bdemonstrate\b/gi, ["show", "prove", "illustrate"]],
  [/\bindicate\b/gi, ["show", "suggest", "point to"]],
  [/\bconducted\b/gi, ["carried out", "performed", "did"]],
  [/\bimplemented\b/gi, ["put in place", "applied", "enacted"]],
  [/\bobtained\b/gi, ["got", "gained", "acquired"]],
  [/\bconsidered\b/gi, ["seen as", "viewed as", "regarded as"]],
  [/\bdescribed\b/gi, ["portrayed", "depicted", "characterized"]],
  [/\bdetermined\b/gi, ["found", "established", "decided"]],
  [/\bidentified\b/gi, ["found", "recognized", "pinpointed"]],
  [/\bmaintained\b/gi, ["kept", "preserved", "held"]],
  [/\bplays?\s+a\s+role\b/gi, ["matters for", "affects", "shapes", "factors into"]],
  [/\bmaintaining\b/gi, ["keeping", "supporting", "preserving"]],
  [/\bsupporting\b/gi, ["helping", "aiding", "fueling"]],
  [/\bessential\b/gi, ["core", "key", "needed", "central"]],
  [/\bpromote\b/gi, ["boost", "encourage", "help", "foster"]],
  [/\brequires\b/gi, ["needs", "demands", "calls for"]],
  [/\bserve as\b/gi, ["work as", "act as", "function as"]],
  [/\bprimary\b/gi, ["main", "chief", "leading"]],
  [/\bcontribute to\b/gi, ["help with", "aid", "feed into", "lead to"]],
  [/\bnecessary for\b/gi, ["needed for", "required for", "used for"]],
  [/\bvital\b/gi, ["key", "critical", "crucial"]],
  [/\bperform\b/gi, ["do", "carry out", "handle"]],
  [/\btypically\b/gi, ["usually", "often", "generally"]],
  [/\badequate\b/gi, ["enough", "sufficient", "plenty of"]],
  [/\bconsists of\b/gi, ["is mostly", "is about", "is made of"]],
  [/\bregulates\b/gi, ["controls", "affects", "manages"]],
  [/\btransports\b/gi, ["carries", "moves", "delivers"]],
  [/\bremoves\b/gi, ["gets rid of", "clears", "eliminates"]],
  [/\bimpair\b/gi, ["hurt", "weaken", "affect"]],
  [/\bgenerally recommend\b/gi, ["often suggest", "usually say", "commonly recommend"]],
  [/\bconsuming\b/gi, ["having", "eating", "drinking", "taking in"]],
  [/\bappropriate\b/gi, ["right", "proper", "suitable"]],
  [/\bstabilize\b/gi, ["steady", "balance", "level out"]],
  [/\bsustain\b/gi, ["keep up", "maintain", "support"]],
  [/\bconsequences\b/gi, ["results", "effects", "costs"]],
  [/\bcontributing to\b/gi, ["linked to", "tied to", "leading to"]],
  [/\bdeprives\b/gi, ["robs", "strips", "keeps from"]],
  [/\badopting\b/gi, ["taking up", "picking up", "using"]],
  [/\breduces\b/gi, ["cuts", "lowers", "drops"]],
  [/\bforms the foundation\b/gi, ["is the base of", "underlies", "grounds"]],
  [/\binfluencing\b/gi, ["affecting", "shaping", "touching"]],
  [/\bincreasingly\b/gi, ["more and more", "ever more", "progressively"]],
  [/\brests? on\b/gi, ["depends on", "comes down to", "hinges on"]],
  [/\bfoundation\b/gi, ["base", "cornerstone", "bedrock"]],
  [/\bprinciples\b/gi, ["basics", "fundamentals", "ideas"]],
  [/\benables?\b/gi, ["lets", "allows", "helps"]],
  [/\bindividuals\b/gi, ["people", "folks", "persons"]],
  [/\binformed\b/gi, ["thoughtful", "considered", "smart"]],
  [/\benhance\b/gi, ["improve", "boost", "raise"]],
  [/\bupon\b/gi, ["on", "on top of"]],
  [/\bfueling\b/gi, ["powering", "driving", "supporting"]],
  [/\bsustained\b/gi, ["steady", "lasting", "continuous"]],
  [/\bvaluable\b/gi, ["useful", "helpful", "important"]],
  [/\baids?\b/gi, ["helps", "supports", "assists"]],
  [/\bmeanwhile\b/gi, ["at the same time", "also", "and"]],
  [/\bsupply\b/gi, ["provide", "deliver", "give"]],
  [/\bfacilitate\b/gi, ["help", "support", "enable"]],
  [/\bparticularly\b/gi, ["especially", "notably", "in particular"]],
  [/\bapproximately\b/gi, ["about", "around", "roughly"]],
  [/\babsolutely\b/gi, ["totally", "completely", "really"]],
  [/\bextends beyond\b/gi, ["goes beyond", "is more than", "isn't just"]],
  [/\bsignificantly\b/gi, ["a lot", "considerably", "much"]],
  [/\boptimize\b/gi, ["improve", "maximize", "get the most from"]],
  [/\bconversely\b/gi, ["on the flip side", "by contrast", "instead"]],
  [/\bcornerstone\b/gi, ["foundation", "base", "core"]],
  [/\bthroughout\b/gi, ["across", "in", "during", "over"]],
  [/\bin order to\b/gi, ["to", "so as to"]],
  [/\bit is important to\b/gi, ["it matters to", "we need to"]],
];

function preprocessSynonyms(text: string): string {
  let result = text;
  for (const [pattern, replacements] of PRE_SYNONYMS) {
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Punctuation: sentence boundaries → semicolon or comma. Extreme: more joins so input is chopped/glued. */
function preprocessPunctuation(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const separators = ["; ", ", and ", ", "];
  const indicesToChange: number[] = [];
  const joinFraction = extremeMode ? 0.85 : p(0.65, 0.98); // run-94 level (69% AI)
  const maxChanges = Math.min(Math.max(2, Math.floor(sentences.length * joinFraction)), sentences.length - 1);
  for (let i = 0; i < maxChanges; i++) {
    const idx = 1 + Math.floor(Math.random() * (sentences.length - 1));
    if (!indicesToChange.includes(idx)) indicesToChange.push(idx);
  }
  indicesToChange.sort((a, b) => a - b);
  for (const idx of indicesToChange) {
    if (idx >= sentences.length) continue;
    const sep = pick(separators);
    if (sep === ". ") continue;
    sentences[idx - 1] = sentences[idx - 1].replace(/[.!?]$/, "").trim();
    sentences[idx] = sentences[idx].charAt(0).toLowerCase() + sentences[idx].slice(1);
    sentences[idx - 1] = sentences[idx - 1] + sep;
  }
  return sentences.join(" ");
}

/** Reorder clauses: "Because X, Y" → "Y because X"; "When X, Y" → "Y when X". */
function preprocessClauseOrder(text: string): string {
  let result = text;
  const reorders: [RegExp, (m: string, a: string, b: string) => string][] = [
    [/Because\s+([^,]+),\s*([^.!?]+)[.!?]/gi, (_, a, b) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} because ${a.trim().toLowerCase()}.`],
    [/When\s+([^,]+),\s*([^.!?]+)[.!?]/gi, (_, a, b) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} when ${a.trim().toLowerCase()}.`],
    [/Although\s+([^,]+),\s*([^.!?]+)[.!?]/gi, (_, a, b) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} although ${a.trim().toLowerCase()}.`],
    [/While\s+([^,]+),\s*([^.!?]+)[.!?]/gi, (_, a, b) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} while ${a.trim().toLowerCase()}.`],
  ];
  for (const [regex, fn] of reorders) {
    result = result.replace(regex, fn);
  }
  return result;
}

/** Extreme: swap first and second half of each sentence (structure change). "A, B" → "B, A"; or split at midpoint. */
function preprocessSentenceHalfSwap(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (let s of sentences) {
    s = s.trim();
    const punct = s.match(/[.!?]$/)?.[0] ?? ".";
    const inner = s.replace(/[.!?]$/, "").trim();
    const words = inner.split(/\s+/);
    if (words.length < 4) {
      out.push(s);
      continue;
    }
    if (!applyProb(0.96)) {
      out.push(s);
      continue;
    }
    let first = "";
    let second = "";
    const commaIdx = inner.indexOf(",");
    const andMatch = inner.match(/\s+and\s+/);
    if (commaIdx > 10 && commaIdx < inner.length - 10) {
      first = inner.slice(0, commaIdx).trim();
      second = inner.slice(commaIdx + 1).trim();
    } else if (andMatch && andMatch.index !== undefined && andMatch.index > 8 && andMatch.index < inner.length - 8) {
      const idx = andMatch.index;
      first = inner.slice(0, idx).trim();
      second = inner.slice(idx + andMatch[0].length).trim();
    } else {
      const mid = Math.floor(words.length / 2);
      if (mid < 2 || mid >= words.length - 1) {
        out.push(s);
        continue;
      }
      first = words.slice(0, mid).join(" ");
      second = words.slice(mid).join(" ");
    }
    if (!first || !second) {
      out.push(s);
      continue;
    }
    const sep = pick([", ", ", and ", " — "]);
    const secondCapped = second.charAt(0).toUpperCase() + second.slice(1);
    const firstLower = first.charAt(0).toLowerCase() + first.slice(1);
    out.push(secondCapped + sep + firstLower + punct);
  }
  return out.join(" ");
}

/** Extreme: sometimes split a sentence into two reversed fragments "B. A." for max choppiness. */
function preprocessFragmentChop(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (let s of sentences) {
    s = s.trim();
    const punct = s.match(/[.!?]$/)?.[0] ?? ".";
    const inner = s.replace(/[.!?]$/, "").trim();
    const words = inner.split(/\s+/);
    if (words.length < 6 || !applyProb(0.4)) {
      out.push(s);
      continue;
    }
    const mid = Math.floor(words.length / 2);
    const first = words.slice(0, mid).join(" ");
    const second = words.slice(mid).join(" ");
    const secondCapped = second.charAt(0).toUpperCase() + second.slice(1);
    const firstLower = first.charAt(0).toLowerCase() + first.slice(1);
    out.push(secondCapped + ".");
    out.push(firstLower + punct);
  }
  return out.join(" ");
}

/** Swap consecutive sentence pairs. Extreme: heavy reorder so Claude gets chopped/reversed input. */
function preprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const maxSwaps = extremeMode
    ? Math.min(120, Math.max(50, Math.floor(sentences.length * 0.95))) // near-total reorder
    : Math.min(20, Math.max(10, Math.floor(sentences.length * p(0.8, 1.0))));
  const swapped = new Set<number>();
  const maxLen = extremeMode ? 550 : 200;
  for (let n = 0; n < maxSwaps; n++) {
    const idx = Math.floor(Math.random() * (sentences.length - 1));
    if (swapped.has(idx)) continue;
    const a = sentences[idx];
    const b = sentences[idx + 1];
    if (a.length < maxLen && b.length < maxLen) {
      sentences[idx] = b;
      sentences[idx + 1] = a;
      swapped.add(idx);
    }
  }
  return sentences.join(" ");
}

/** Passive to active or vice versa – apply aggressively. */
function preprocessVoice(text: string): string {
  let result = text;
  const voiceSwaps: [RegExp, string[]][] = [
    [/\bwas revealed\b/gi, ["came to light", "emerged", "was shown", "turned out"]],
    [/\bwere revealed\b/gi, ["came to light", "emerged", "were shown"]],
    [/\bwas conducted\b/gi, ["took place", "was carried out", "happened"]],
    [/\bwas provided\b/gi, ["came from", "was supplied", "was given"]],
    [/\bis considered\b/gi, ["is seen as", "is viewed as", "counts as"]],
    [/\bwas established\b/gi, ["was set up", "was created", "was formed"]],
    [/\bwere identified\b/gi, ["were found", "were spotted", "turned up"]],
    [/\bcan be seen\b/gi, ["shows up", "is evident", "appears"]],
  ];
  for (const [regex, replacements] of voiceSwaps) {
    result = result.replace(regex, () => pick(replacements));
  }
  return result;
}

/** Pre-process: reorder, punctuation, synonyms. Extreme: half-swap sentences, then chop/reorder before Claude. */
export function humanizerPreprocess(text: string, options?: { extreme?: boolean }): string {
  setExtremeMode(options?.extreme ?? (typeof process !== "undefined" && process.env?.HUMANIZER_EXTREME === "1"));
  let result = text.trim();
  result = preprocessSynonyms(result);
  result = preprocessClauseOrder(result);
  result = preprocessPunctuation(result);
  result = preprocessSentenceReorder(result);
  if (extremeMode) result = preprocessSentenceReorder(result);
  result = preprocessVoice(result);
  return result.replace(/\s+/g, " ").trim();
}

// ========== POST-PROCESS: strip filler + fix apostrophes (unchanged) ==========

const FILLER_PATTERNS = [
  /^\s*So\s*,?\s*/im,
  /\bI mean\s+/gi,
  /\byou know\s+/gi,
  /\bhonestly\s+/gi,
  /\bbasically\s+/gi,
  /\bkind of\s+/gi,
  /\bpretty much\s+/gi,
  /\bactually\s+/gi,
  /(^|[.!?]\s+)like\s+/gim,
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

const APOSTROPHE_FIXES: [RegExp, string][] = [
  [/\bNixons\b/g, "Nixon's"],
  [/\bFBIs\b/g, "FBI's"],
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

// ========== POST-PROCESS: huge synonym set + structure + punctuation ==========

/** Large synonym substitutions for post-process – high perplexity, same register. */
const POST_SYNONYMS: [RegExp, string[]][] = [
  [/\bhowever\b/gi, ["but", "though", "although", "yet"]],
  [/\btherefore\b/gi, ["thus", "hence", "accordingly", "so"]],
  [/\bfurthermore\b/gi, ["additionally", "moreover", "also"]],
  [/\bmoreover\b/gi, ["furthermore", "additionally", "also"]],
  [/\bconsequently\b/gi, ["as a result", "thus", "accordingly"]],
  [/\bnevertheless\b/gi, ["nonetheless", "still", "even so"]],
  [/\bsignificant\b/gi, ["notable", "important", "considerable", "substantial"]],
  [/\bimportant\b/gi, ["significant", "notable", "key", "critical"]],
  [/\bnumerous\b/gi, ["many", "several", "various", "multiple"]],
  [/\bseveral\b/gi, ["many", "numerous", "various", "a number of"]],
  [/\bvarious\b/gi, ["several", "many", "different", "multiple"]],
  [/\bmultiple\b/gi, ["several", "many", "various", "numerous"]],
  [/\bbegan\b/gi, ["started", "commenced", "initiated"]],
  [/\bstarted\b/gi, ["began", "commenced", "initiated"]],
  [/\bconcluded\b/gi, ["ended", "finished", "wrapped up"]],
  [/\bestablished\b/gi, ["created", "formed", "set up"]],
  [/\bdeveloped\b/gi, ["evolved", "emerged", "grew"]],
  [/\brequired\b/gi, ["needed", "demanded", "called for"]],
  [/\bincluding\b/gi, ["such as", "among them", "like"]],
  [/\bparticularly\b/gi, ["especially", "notably", "specifically"]],
  [/\bespecially\b/gi, ["particularly", "notably", "specifically"]],
  [/\bnotably\b/gi, ["particularly", "especially", "remarkably"]],
  [/\bin fact\b/gi, ["actually", "indeed", "in reality"]],
  [/\bcurrently\b/gi, ["now", "at present", "today"]],
  [/\bpreviously\b/gi, ["earlier", "before", "prior to this"]],
  [/\bultimately\b/gi, ["finally", "in the end", "at last"]],
  [/\bclearly\b/gi, ["obviously", "evidently", "plainly"]],
  [/\bdefinitely\b/gi, ["certainly", "surely", "undoubtedly"]],
  [/\bapproximately\b/gi, ["roughly", "about", "around"]],
  [/\broughly\b/gi, ["approximately", "about", "around"]],
  [/\bensure\b/gi, ["guarantee", "make sure", "secure"]],
  [/\butilize\b/gi, ["use", "employ", "apply"]],
  [/\bdemonstrate\b/gi, ["show", "prove", "illustrate"]],
  [/\bindicate\b/gi, ["show", "suggest", "point to"]],
  [/\bconducted\b/gi, ["carried out", "performed", "did"]],
  [/\bimplemented\b/gi, ["put in place", "applied", "enacted"]],
  [/\bobtained\b/gi, ["got", "gained", "acquired"]],
  [/\bconsidered\b/gi, ["seen as", "viewed as", "regarded as"]],
  [/\bdescribed\b/gi, ["portrayed", "depicted", "characterized"]],
  [/\bdetermined\b/gi, ["found", "established", "decided"]],
  [/\bidentified\b/gi, ["found", "recognized", "pinpointed"]],
  [/\bmaintained\b/gi, ["kept", "preserved", "held"]],
  [/\bcontributed to\b/gi, ["led to", "resulted in", "brought about"]],
  [/\bresulted in\b/gi, ["led to", "contributed to", "caused"]],
  [/\boccurred\b/gi, ["took place", "happened", "transpired"]],
  [/\brevealed\b/gi, ["showed", "demonstrated", "exposed"]],
  [/\bduring\b/gi, ["in", "throughout", "over"]],
  [/\battempt\b/gi, ["effort", "endeavor", "try"]],
  [/\bprovided\b/gi, ["offered", "supplied", "gave"]],
  [/\baffiliated with\b/gi, ["connected to", "linked to", "tied to"]],
  [/\bheadquarters\b/gi, ["head office", "main office", "HQ"]],
  [/\binvestigation\b/gi, ["inquiry", "probe", "examination"]],
  [/\btransparency\b/gi, ["openness", "clarity"]],
  [/\baccountability\b/gi, ["responsibility", "answerability"]],
  [/\binvolvement\b/gi, ["participation", "engagement"]],
  [/\breform\b/gi, ["change", "overhaul", "measure"]],
  [/\breforms\b/gi, ["changes", "measures", "overhauls"]],
  // Do NOT replace "major" in "Major League" / "major league" (proper term)
  [/\bmajor\b(?!\s+league)/gi, ["significant", "substantial", "considerable", "notable"]],
  [/\bled to\b/g, ["contributed to", "resulted in", "brought about", "caused"]],
  [/\btook place\b/gi, ["occurred", "happened", "transpired"]],
  [/\bshowed\b/gi, ["revealed", "demonstrated", "exposed"]],
  [/\bthroughout\b/gi, ["during", "in", "across"]],
  [/\bendeavor\b/gi, ["attempt", "effort"]],
  [/\boffered\b/gi, ["provided", "supplied", "gave"]],
  [/\bintended to\b/gi, ["aimed at", "meant to", "designed to"]],
  [/\bimproving\b/gi, ["increasing", "strengthening", "enhancing"]],
  [/\blinked to\b/gi, ["connected to", "tied to", "associated with"]],
  [/\bmain office\b/gi, ["headquarters", "head office", "HQ"]],
  [/\binquiry\b/gi, ["investigation", "probe", "examination"]],
  [/\bopenness\b/gi, ["transparency", "clarity"]],
  [/\bresponsibility\b/gi, ["accountability", "answerability"]],
  [/\bparticipation\b/gi, ["engagement", "involvement"]],
  [/\bkey\b/gi, ["important", "critical", "central", "main"]],
  [/\bcritical\b/gi, ["key", "important", "crucial", "vital"]],
  [/\bcommenced\b/gi, ["began", "started", "initiated"]],
  [/\bterminated\b/gi, ["ended", "concluded", "finished"]],
  [/\bformed\b/gi, ["created", "established", "produced"]],
  [/\bevolved\b/gi, ["developed", "emerged", "grew"]],
  [/\bcalled for\b/gi, ["required", "needed", "demanded"]],
  [/\bsuch as\b/gi, ["including", "like", "among them"]],
  [/\bspecifically\b/gi, ["especially", "particularly", "notably"]],
  [/\bindeed\b/gi, ["in fact", "actually", "in reality"]],
  [/\bat present\b/gi, ["currently", "now", "today"]],
  [/\bearlier\b/gi, ["previously", "before", "prior to this"]],
  [/\bin the end\b/gi, ["ultimately", "finally", "at last"]],
  [/\bevidently\b/gi, ["clearly", "obviously", "plainly"]],
  [/\bsurely\b/gi, ["certainly", "definitely", "undoubtedly"]],
  [/\baround\b/gi, ["approximately", "roughly", "about"]],
  [/\bguarantee\b/gi, ["ensure", "make sure", "secure"]],
  [/\bemploy\b/gi, ["use", "utilize", "apply"]],
  [/\bprove\b/gi, ["demonstrate", "show", "illustrate"]],
  [/\bsuggest\b/gi, ["indicate", "show", "point to"]],
  [/\bcarried out\b/gi, ["conducted", "performed", "did"]],
  [/\bput in place\b/gi, ["implemented", "applied", "enacted"]],
  [/\bgained\b/gi, ["obtained", "got", "acquired"]],
  [/\bviewed as\b/gi, ["considered", "seen as", "regarded as"]],
  [/\bportrayed\b/gi, ["described", "depicted", "characterized"]],
  [/\bestablished\b/gi, ["determined", "found", "decided"]],
  [/\brecognized\b/gi, ["identified", "found", "pinpointed"]],
  [/\bpreserved\b/gi, ["maintained", "kept", "held"]],
  [/\bbrought about\b/gi, ["led to", "resulted in", "caused"]],
  [/\bhappened\b/gi, ["occurred", "took place", "transpired"]],
  [/\bsupplied\b/gi, ["provided", "offered", "gave"]],
  [/\bexamination\b/gi, ["investigation", "inquiry", "probe"]],
  [/\bengagement\b/gi, ["involvement", "participation"]],
  [/\boverhaul\b/gi, ["reform", "change", "revision"]],
  [/\bplays?\s+a\s+role\b/gi, ["matters for", "affects", "shapes"]],
  [/\bmaintaining\b/gi, ["keeping", "supporting"]],
  [/\bsupporting\b/gi, ["helping", "aiding"]],
  [/\bessential\b/gi, ["core", "key", "needed"]],
  [/\bpromote\b/gi, ["boost", "encourage", "help"]],
  [/\brequires\b/gi, ["needs", "demands"]],
  [/\bserve as\b/gi, ["work as", "act as"]],
  [/\bprimary\b/gi, ["main", "chief"]],
  [/\bnecessary for\b/gi, ["needed for", "used for"]],
  [/\bvital\b/gi, ["key", "critical"]],
  [/\bperform\b/gi, ["do", "carry out"]],
  [/\btypically\b/gi, ["usually", "often"]],
  [/\badequate\b/gi, ["enough", "sufficient"]],
  [/\bconsists of\b/gi, ["is mostly", "is about"]],
  [/\bregulates\b/gi, ["controls", "affects"]],
  [/\btransports\b/gi, ["carries", "moves"]],
  [/\bremoves\b/gi, ["gets rid of", "clears"]],
  [/\bimpair\b/gi, ["hurt", "weaken"]],
  [/\bconsuming\b/gi, ["having", "eating", "drinking"]],
  [/\bappropriate\b/gi, ["right", "proper"]],
  [/\bstabilize\b/gi, ["steady", "balance"]],
  [/\bsustain\b/gi, ["keep up", "maintain"]],
  [/\bconsequences\b/gi, ["results", "effects"]],
  [/\bcontributing to\b/gi, ["linked to", "tied to"]],
  [/\bdeprives\b/gi, ["robs", "strips"]],
  [/\badopting\b/gi, ["taking up", "using"]],
  [/\breduces\b/gi, ["cuts", "lowers"]],
  [/\binfluencing\b/gi, ["affecting", "shaping"]],
  [/\bincreasingly\b/gi, ["more and more", "progressively"]],
];

/** Generic AI-tell phrases only – any domain. No topic-specific strings. */
const STOCK_PHRASE_FIXES: [RegExp, string[]][] = [
  [/\bprovides insight into\b/gi, ["helps explain", "shows how"]],
  [/\breflects broader changes\b/gi, ["tracks broader changes", "goes along with changes in"]],
  [/\bprofessional enterprise\b/gi, ["professional operation", "commercial operation"]],
  [/\bsources\s+among\s+them\b/gi, ["sources like", "like"]],
  [/\bnecessary for these processes\b/gi, ["needed for that", "used for that"]],
  [/\bneeded for these processes\b/gi, ["needed for that", "used for that"]],
  [/\brequired for these processes\b/gi, ["needed for that", "used for that"]],
  [/\bplays?\s+a\s+(?:basic\s+)?role(?:\s+in)?\b/gi, ["matters for", "affects", "shapes"]],
  [/\bOn the other hand\b/g, ["By contrast", "Meanwhile"]],
  [/\bforms the foundation of\b/gi, ["is the base of", "underlies"]],
  [/\bas (?:research|studies) (?:continue|continues) to (?:reveal|show)\b/gi, ["as we keep learning", "as evidence shows"]],
  [/\bbecomes? increasingly clear\b/gi, ["gets clearer", "is clearer"]],
  [/\bin order to\b/gi, ["to", "so as to"]],
  [/\bit is (?:important|critical|essential) to\b/gi, ["it matters to", "we need to"]],
  [/\b(?:in conclusion|to conclude)\b/gi, ["overall", "in short", "to sum up"]],
  [/\bpeople of all ages\b/gi, ["everyone", "all ages"]],
  [/\bplays a (?:central|foundational|fundamental) role in\b/gi, ["matters for", "is central to", "shapes"]],
];

function postprocessStockPhrases(text: string): string {
  let result = text;
  for (const [pattern, replacements] of STOCK_PHRASE_FIXES) {
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

function postprocessSynonyms(text: string): string {
  let result = text;
  for (const [pattern, replacements] of POST_SYNONYMS) {
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Chaos only: wilder word swaps – colloquial, varied, max perplexity. */
const CHAOS_SYNONYMS: [RegExp, string[]][] = [
  [/\bimportant\b/gi, ["key", "big", "real", "major"]],
  [/\bsignificant\b/gi, ["notable", "real", "major", "big"]],
  [/\bapproximately\b/gi, ["about", "around", "like"]],
  [/\bgenerally\b/gi, ["mostly", "often", "usually"]],
  [/\bprovide[sd]?\b/gi, ["give", "deliver", "supply"]],
  [/\bindividuals\b/gi, ["people", "folks", "persons"]],
  [/\bmaintain\b/gi, ["keep", "support", "hold"]],
  [/\bensure\b/gi, ["make sure", "guarantee", "see to it"]],
  [/\bdemonstrate\b/gi, ["show", "prove", "display"]],
  [/\bconsiderable\b/gi, ["good bit of", "lots of", "substantial"]],
  [/\bnumerous\b/gi, ["many", "a lot of", "tons of"]],
  [/\bconsequently\b/gi, ["so", "thus", "as a result"]],
  [/\bfurthermore\b/gi, ["also", "plus", "and"]],
  [/\bhowever\b/gi, ["but", "though", "still"]],
  [/\bnecessary\b/gi, ["needed", "required", "essential"]],
  [/\boptimal\b/gi, ["best", "ideal", "top"]],
  [/\butilize\b/gi, ["use", "employ"]],
  [/\bprior to\b/gi, ["before", "ahead of"]],
  [/\bsubsequent\b/gi, ["later", "next", "following"]],
  [/\bimplement\b/gi, ["do", "put in place", "apply"]],
  [/\bessential\b/gi, ["key", "needed", "critical", "vital"]],
  [/\bprimarily\b/gi, ["mainly", "mostly", "first"]],
  [/\btypically\b/gi, ["usually", "often", "normally"]],
  [/\bmultiple\b/gi, ["several", "many", "various"]],
  [/\bvarious\b/gi, ["different", "several", "many"]],
  [/\badequate\b/gi, ["enough", "sufficient", "decent"]],
  [/\bappropriate\b/gi, ["right", "suitable", "proper"]],
  [/\bestablish\b/gi, ["set up", "create", "form"]],
  [/\bindicate\b/gi, ["show", "suggest", "point to"]],
  [/\bobtain\b/gi, ["get", "gain", "acquire"]],
  [/\brequire\b/gi, ["need", "demand", "call for"]],
  [/\bsufficient\b/gi, ["enough", "adequate", "plenty of"]],
  [/\bconsume\b/gi, ["eat", "have", "take in"]],
  [/\bregulate\b/gi, ["control", "manage", "affect"]],
  [/\btransport\b/gi, ["carry", "move", "deliver"]],
  [/\beliminate\b/gi, ["remove", "get rid of", "clear"]],
  [/\bcrucial\b/gi, ["key", "vital", "big", "central"]],
  [/\bsupports?\b/gi, ["backs", "helps", "bolsters", "aids"]],
  [/\bpromotes?\b/gi, ["helps", "encourages", "boosts", "aids"]],
  [/\benables?\b/gi, ["lets", "allows", "helps"]],
  [/\bcritical\b/gi, ["key", "vital", "big"]],
  [/\bplays a role\b/gi, ["helps", "matters", "figures in"]],
  [/\bclears\b/gi, ["gets rid of", "removes", "cleans"]], // only verb "clears"; don't replace adjective "clear" (becomes clear, clearer)
  [/\bdelivers?\b/gi, ["carries", "brings", "moves"]],
];

function postprocessChaosSynonyms(text: string): string {
  if (!extremeMode) return text;
  let result = text;
  for (const [pattern, replacements] of CHAOS_SYNONYMS) {
    result = result.replace(pattern, (match) => (applyProb(0.78) ? pick(replacements) : match)); // reverted from 0.84 (99% AI)
  }
  return result;
}

/** Punctuation: sometimes join short sentences with comma+and; avoid creating long semicolon chains. */
function postprocessPunctuationSwitch(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i];
    const next = sentences[i + 1];
    if (next && s.length > 15 && s.length < 100 && applyProb(p(0.6, 0.12))) {
      const useSemicolon = applyProb(p(0.6, 0.4));
      s = s.replace(/[.!?]$/, useSemicolon ? ";" : ", and");
      result.push(s);
      result.push(next.charAt(0).toLowerCase() + next.slice(1));
      i++;
    } else {
      result.push(s);
    }
  }
  return result.join(" ");
}

/** Merge two short sentences with semicolon or comma for structure variation. V2: do not merge when next sentence starts with This/That/It or when previous ends with incomplete phrase (avoids "nourishing. This gas"–style glues). */
function postprocessStructureMerge(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];
    const b = sentences[i + 1];
    const bStartsWithThisThatIt = b && /^(This|That|It)\s+/.test(b.trim());
    const aEndsWithIncomplete = a && /(\s+as\s+a\s+\w+|\s+and\s+)$/.test(a.replace(/[.!?]$/, "").trim());
    if (
      b &&
      a.length < 80 &&
      b.length < 80 &&
      applyProb(p(0.7, 0.18)) &&
      !bStartsWithThisThatIt &&
      !aEndsWithIncomplete
    ) {
      const sep = applyProb(0.65) ? "; " : ", and ";
      const merged = a.replace(/[.!?]$/, "") + sep + b.charAt(0).toLowerCase() + b.slice(1);
      out.push(merged);
      i++;
    } else {
      out.push(a);
    }
  }
  return out.join(" ");
}

function stripEmDashes(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/—/g, ", ");
}

// ========== HUGE POST: structure, grammar, punctuation ==========

/** All semicolons → period so structure can change (more sentence boundaries to reorder). */
function postprocessSemicolonSplit(text: string): string {
  return text
    .replace(/\s*;\s+/g, ". ")
    .replace(/\.\s+([a-z])/g, (_, c) => ". " + c.toUpperCase());
}

/** Remove colons – replace with period and capitalize next (no list-intro colons). */
function postprocessStripColons(text: string): string {
  return text
    .replace(/\s*:\s*/g, ". ")
    .replace(/\.\s+([a-z])/g, (_, c) => ". " + c.toUpperCase());
}

/** Reduce commas: ", and " → " and "; only break comma chains when "after" is a real clause (no one-word sentences). */
function postprocessReduceCommas(text: string): string {
  let result = text;
  result = result.replace(/,\s*and\s+/g, () => (applyProb(p(0.85, 0.99)) ? " and " : ", and "));
  const sentences = result.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    const parts = s.split(/,\s+/);
    if (parts.length < 3 || !applyProb(p(0.35, 0.78))) {
      out.push(s);
      continue;
    }
    const splitAt = Math.max(2, Math.min(parts.length - 1, Math.floor(parts.length * 0.5)));
    const before = parts.slice(0, splitAt).join(", ").trim();
    const after = parts.slice(splitAt).join(", ").trim();
    if (after.length < 25 || !after.includes(" ")) {
      out.push(s);
      continue;
    }
    out.push(before + ".");
    out.push(after.charAt(0).toUpperCase() + after.slice(1));
  }
  return out.join(" ");
}

/** Split at ", and " or ", " – coherence: no chop in extreme. */
function postprocessCommaSplits(text: string): string {
  if (extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length < 50) {
      out.push(s);
      continue;
    }
    const andMatch = s.match(/^(.{8,}?), and (\w)([^.]*\.?)$/);
    const commaMatch = s.match(/^(.{10,}?), (\w)([^.]{6,}\.?)$/);
    if (andMatch && applyProb(0.28)) {
      const [, before, letter, rest] = andMatch;
      out.push(before.trim() + ".");
      out.push("And " + letter.toUpperCase() + rest.trim());
      continue;
    }
    if (commaMatch && applyProb(0.18)) {
      const [, before, letter, rest] = commaMatch;
      out.push(before.trim() + ".");
      out.push(letter.toUpperCase() + rest.trim());
      continue;
    }
    out.push(s);
  }
  return out.join(" ");
}

/** Post clause reorder: "Because X, Y" → "Y because X" etc. */
function postprocessClauseReorder(text: string): string {
  let result = text;
  const reorders: [RegExp, (m: string, a: string, b: string, p: string) => string][] = [
    [/Because\s+([^,]+),\s*([^.!?]+)([.!?])/gi, (_, a, b, p) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} because ${a.trim().toLowerCase()}${p}`],
    [/When\s+([^,]+),\s*([^.!?]+)([.!?])/gi, (_, a, b, p) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} when ${a.trim().toLowerCase()}${p}`],
    [/Although\s+([^,]+),\s*([^.!?]+)([.!?])/gi, (_, a, b, p) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} although ${a.trim().toLowerCase()}${p}`],
    [/While\s+([^,]+),\s*([^.!?]+)([.!?])/gi, (_, a, b, p) => `${b.trim().charAt(0).toLowerCase() + b.trim().slice(1)} while ${a.trim().toLowerCase()}${p}`],
  ];
  for (const [regex, fn] of reorders) {
    result = result.replace(regex, fn);
  }
  return result;
}

/** Passive to active: swap common passive phrases to active or simpler. */
function postprocessPassiveActive(text: string): string {
  let result = text;
  result = result.replace(/\bis (?:provided|supplied|given) by\b/gi, "comes from");
  result = result.replace(/\bare (?:provided|supplied|given) by\b/gi, "come from");
  result = result.replace(/\b(?:is|are) (?:considered|seen as|viewed as)\b/gi, () => pick(["counts as", "is", "are"]));
  result = result.replace(/\bis (?:required|needed) (?:by|for)\b/gi, () => pick(["needs", "demands"]));
  result = result.replace(/\b(?:was|were) (?:conducted|carried out)\b/gi, () => pick(["happened", "took place"]));
  result = result.replace(/\b(?:is|are) (?:determined|established) by\b/gi, () => pick(["comes from", "depends on"]));
  return result;
}

/** Punctuation chaos: prefer " and " over ", and ", fix caps after period. */
function postprocessPunctuationChaos(text: string): string {
  let result = text;
  result = result.replace(/\.\s+([a-z])/g, (_, c) => ". " + c.toUpperCase());
  return result;
}

/** Split "X, which Y" into "X. Y" sometimes. Coherence: no chop in extreme – skip. */
function postprocessWhichSplit(text: string): string {
  if (extremeMode) return text;
  return text.replace(/(.{15,}?), which (\w)([^.]*\.)/gi, (_, before, letter, rest) =>
    applyProb(0.25) ? `${before.trim()}. ${letter.toUpperCase()}${rest.trim()}` : `${before}, which ${letter}${rest}`
  );
}

/** Split long compound sentences – coherence: no chop in extreme. */
function postprocessSplitLongCompounds(text: string): string {
  if (extremeMode) return text;
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    const andCount = (s.match(/\s+and\s+/g) || []).length;
    const isLong = s.length >= 55;
    const shouldSplit = (andCount >= 3 && s.length >= 50) || (andCount >= 2 && isLong && s.length >= 85);
    if (!shouldSplit || !applyProb(0.92)) {
      out.push(s);
      continue;
    }
    const parts = s.split(/\s+and\s+/);
    if (parts.length < 2) {
      out.push(s);
      continue;
    }
    const splitAt = Math.max(1, Math.min(parts.length - 1, Math.floor(parts.length * 0.4)));
    const before = parts.slice(0, splitAt).join(" and ").trim().replace(/[.!?]$/, "");
    const after = parts.slice(splitAt).join(" and ").trim();
    if (before.length < 15 || after.length < 15) {
      out.push(s);
      continue;
    }
    const punc = after.match(/[.!?]$/)?.[0] ?? ".";
    const afterTrim = after.replace(/[.!?]$/, "");
    out.push(before + ".");
    out.push("And " + afterTrim.charAt(0).toLowerCase() + afterTrim.slice(1) + punc);
  }
  return out.join(" ");
}

/** Split at " and " – 10x: split virtually every sentence that has " and ". */
function postprocessAndSplit(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length < 18) {
      out.push(s);
      continue;
    }
    const match = s.match(/^(.{8,}?) and (\w)([^.]*\.?)$/);
    if (match && applyProb(extremeMode ? 0 : 0.98)) {
      const [, before, letter, rest] = match;
      out.push(before.trim() + ".");
      out.push("And " + letter.toUpperCase() + rest.trim());
    } else {
      out.push(s);
    }
  }
  return out.join(" ");
}

/** Chaos only: swap words – coherence: disabled in extreme so word order stays readable. */
function postprocessWordSwap(text: string): string {
  if (!extremeMode) return text;
  if (extremeMode) return text; // coherence: no within-sentence word swap; keep "the brown dog" order
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out = sentences.map((s) => {
    if (s.length < 6 || s.length > 250) return s;
    const words = s.replace(/[.!?]$/, "").trim().split(/\s+/);
    if (words.length < 3) return s;
    const punct = s.match(/[.!?]$/)?.[0] ?? ".";
    if (!applyProb(1.0)) return s;
    const numSwaps = 5 + Math.floor(Math.random() * 4);
    for (let n = 0; n < numSwaps && words.length >= 4; n++) {
      const i = 1 + Math.floor(Math.random() * (words.length - 2));
      [words[i], words[i + 1]] = [words[i + 1], words[i]];
    }
    return words.join(" ") + punct;
  });
  return out.join(" ");
}

/** Chaos only: merge sentence pairs into run-ons – coherence: moderate rate. */
function postprocessRunOnChaos(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const out: string[] = [];
  let i = 0;
  while (i < sentences.length) {
    const a = sentences[i];
    const b = sentences[i + 1];
    if (b && a.length < 100 && b.length < 100 && applyProb(extremeMode ? 0.52 : 0.96)) {
      const runOn = a.replace(/[.!?]$/, "").trim() + " " + b.charAt(0).toLowerCase() + b.slice(1);
      out.push(runOn);
      i += 2;
    } else {
      out.push(a);
      i++;
    }
  }
  return out.join(" ");
}

/** Chaos only: swap second halves of two random sentences – disabled for coherence. */
function postprocessSentenceSplice(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 4) return text;
  const result = [...sentences];
  const n = 0; // was 0.4*length – off so order stays coherent
  for (let k = 0; k < n; k++) {
    const i = Math.floor(Math.random() * result.length);
    let j = Math.floor(Math.random() * result.length);
    if (Math.abs(i - j) < 1) j = (i + 2) % result.length;
    const a = result[i].replace(/[.!?]$/, "").trim().split(/\s+/);
    const b = result[j].replace(/[.!?]$/, "").trim().split(/\s+/);
    if (a.length < 4 || b.length < 4) continue;
    const midA = Math.floor(a.length * 0.4) || 1;
    const midB = Math.floor(b.length * 0.4) || 1;
    const a1 = a.slice(0, midA).join(" ");
    const a2 = a.slice(midA).join(" ");
    const b1 = b.slice(0, midB).join(" ");
    const b2 = b.slice(midB).join(" ");
    const puncA = result[i].match(/[.!?]$/)?.[0] ?? ".";
    const puncB = result[j].match(/[.!?]$/)?.[0] ?? ".";
    result[i] = a1 + " " + b2 + puncA;
    result[j] = b1 + " " + a2 + puncB;
  }
  return result.join(" ");
}

/** Chaos only: insert random fragment from one sentence into middle of another. */
function postprocessFragmentInsertChaos(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const result = sentences.map((s) => s.trim());
  const inserts = Math.floor(result.length * 0.35);
  for (let k = 0; k < inserts; k++) {
    const fromIdx = Math.floor(Math.random() * result.length);
    const toIdx = Math.floor(Math.random() * result.length);
    if (fromIdx === toIdx) continue;
    const fromWords = result[fromIdx].replace(/[.!?]$/, "").split(/\s+/);
    if (fromWords.length < 4) continue;
    const len = 3 + Math.floor(Math.random() * 3);
    const start = Math.floor(Math.random() * (fromWords.length - len));
    const fragment = fromWords.slice(start, start + len).join(" ");
    const toStr = result[toIdx].replace(/[.!?]$/, "");
    const toWords = toStr.split(/\s+/);
    if (toWords.length < 3) continue;
    const pos = 1 + Math.floor(Math.random() * (toWords.length - 1));
    const punc = result[toIdx].match(/[.!?]$/)?.[0] ?? ".";
    result[toIdx] = [...toWords.slice(0, pos), fragment, ...toWords.slice(pos)].join(" ") + punc;
  }
  return result.join(" ");
}

/** Chaos only: drop "the" or "a" randomly – extreme: more drops for rougher, human feel. */
function postprocessArticleDrop(text: string): string {
  if (!extremeMode) return text;
  const probThe = extremeMode ? 0.52 : 0.38;
  const probA = extremeMode ? 0.48 : 0.35;
  let t = text;
  t = t.replace(/\bthe\s+/gi, () => (applyProb(probThe) ? "" : "the "));
  t = t.replace(/\ba\s+/gi, () => (applyProb(probA) ? "" : "a "));
  t = t.replace(/\ban\s+/gi, () => (applyProb(probA) ? "" : "an "));
  return t;
}

/** Chaos only: reverse chunks – coherence: disabled in extreme so no "brown dog the". */
function postprocessPhraseReverse(text: string): string {
  if (!extremeMode) return text;
  if (extremeMode) return text; // coherence: no phrase reverse; keep readable word order
  const prob = 0.88;
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out = sentences.map((s) => {
    if (s.length < 20) return s;
    const punct = s.match(/[.!?]$/)?.[0] ?? ".";
    let words = s.replace(/[.!?]$/, "").trim().split(/\s+/);
    if (words.length < 5) return s;
    if (!applyProb(prob)) return s;
    for (let rev = 0; rev < 1; rev++) {
      const len = 3 + Math.floor(Math.random() * 4);
      const start = Math.floor(Math.random() * Math.max(0, words.length - len));
      const chunk = words.slice(start, start + len);
      chunk.reverse();
      words = [...words.slice(0, start), ...chunk, ...words.slice(start + len)];
    }
    return words.join(" ") + punct;
  });
  return out.join(" ");
}

/** Join two short adjacent sentences sometimes – skip in extreme to avoid extra choppiness. */
function postprocessJoinShorts(text: string): string {
  if (extremeMode) return text;
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 3) return text;
  const out: string[] = [];
  let i = 0;
  while (i < sentences.length) {
    const a = sentences[i];
    const b = sentences[i + 1];
    if (b && a.length < 55 && b.length < 55 && (a + b).length < 120 && applyProb(extremeMode ? 0.78 : 0.62)) {
      const sep = applyProb(0.5) ? ", and " : " and ";
      const joined = a.replace(/[.!?]$/, "").trim() + sep + b.charAt(0).toLowerCase() + b.slice(1);
      out.push(joined);
      i += 2;
    } else {
      out.push(a);
      i++;
    }
  }
  return out.join(" ");
}

/** Swap adjacent sentences very aggressively (post) – always apply. */
function postprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 3) return text;
  const result = [...sentences];
  const swapped = new Set<number>();
  const maxSwaps = Math.min(extremeMode ? 999 : 30, Math.max(extremeMode ? 200 : 12, Math.floor(sentences.length * p(0.7, 0.99))));
  const maxLenPost = extremeMode ? 900 : 260;
  for (let n = 0; n < maxSwaps; n++) {
    const idx = Math.floor(Math.random() * (result.length - 1));
    if (swapped.has(idx)) continue;
    const a = result[idx];
    const b = result[idx + 1];
    if (a.length < maxLenPost && b.length < maxLenPost) {
      result[idx] = b;
      result[idx + 1] = a;
      swapped.add(idx);
    }
  }
  return result.join(" ");
}

/** Swap non-adjacent sentences. Coherence: light in extreme so order stays partly logical. */
function postprocessChaosReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 5) return text;
  let result = [...sentences];
  const chaosRuns = extremeMode ? 10 : 6;
  const chaosProb = p(0.85, 0.5);
  const chaosMaxLen = extremeMode ? 900 : 280;
  for (let run = 0; run < chaosRuns; run++) {
    if (!applyProb(chaosProb)) continue;
    const i = Math.floor(Math.random() * result.length);
    let j = Math.floor(Math.random() * result.length);
    if (Math.abs(i - j) < 2) j = (i + 2) % result.length;
    const a = result[i];
    const b = result[j];
    if (a.length < chaosMaxLen && b.length < chaosMaxLen) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result.join(" ");
}

/** One-time: split only very long run-ons (4+ "and" or 38+ words). Skip in extreme to avoid choppiness. */
function postprocessLongRunOnSplit(text: string): string {
  if (extremeMode) return text;
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    const andCount = (s.match(/\s+and\s+/g) || []).length;
    const wordCount = s.split(/\s+/).length;
    if (andCount < 4 && wordCount < 38) {
      out.push(s);
      continue;
    }
    const parts = s.split(/\s+and\s+/);
    if (parts.length < 2) { out.push(s); continue; }
    const splitAt = Math.min(2, Math.max(1, Math.floor(parts.length / 2)));
    const before = parts.slice(0, splitAt).join(" and ").trim().replace(/[.!?]$/, "");
    const after = parts.slice(splitAt).join(" and ").trim();
    if (before.length < 12 || after.length < 12) { out.push(s); continue; }
    const punc = after.match(/[.!?]$/)?.[0] ?? ".";
    const afterTrim = after.replace(/[.!?]$/, "");
    out.push(before + ".");
    out.push("And " + afterTrim.charAt(0).toLowerCase() + afterTrim.slice(1) + punc);
  }
  return out.join(" ");
}

/** Break nominalizations: "in the X of" → "to X" / "for X-ing" (generic, any topic). Reduces AI tell. */
function postprocessNominalizationBreak(text: string): string {
  if (!extremeMode) return text;
  const pairs: [RegExp, string[]][] = [
    [/\bin the maintenance of\b/gi, ["to maintain", "for maintaining"]],
    [/\bin the production of\b/gi, ["to produce", "that produce", "for producing"]],
    [/\bin the absorption of\b/gi, ["to absorb", "for absorbing"]],
    [/\bin the digestion of\b/gi, ["to digest", "for digesting"]],
    [/\bin the regulation of\b/gi, ["to regulate", "that regulate"]],
    [/\bin the enhancement of\b/gi, ["to enhance", "for enhancing"]],
    [/\bin the building and repair of\b/gi, ["to build and repair", "that build and repair"]],
    [/\bthe maintenance of\b/gi, ["maintaining", "to maintain"]],
    [/\bthe production of\b/gi, ["producing", "to produce"]],
    [/\bthe absorption of\b/gi, ["absorbing", "to absorb"]],
    [/\bthe digestion of\b/gi, ["digesting", "to digest"]],
    [/\bthe regulation of\b/gi, ["regulating", "to regulate"]],
    [/\bthe enhancement of\b/gi, ["enhancing", "to enhance"]],
    [/\bused for these processes\b/gi, ["that support these", "for these", "needed for them"]],
    [/\bthe healing of wounds\b/gi, ["wound healing", "healing wounds"]],
    [/\baids in the digestion of\b/gi, ["helps digest", "aids digestion of"]],
  ];
  let t = text;
  for (const [regex, replacements] of pairs) {
    if (applyProb(0.88)) t = t.replace(regex, () => pick(replacements));
  }
  return t;
}

/** Grammar/punctuation variation: which/that, serial comma – always apply. */
function postprocessGrammarPunctuation(text: string): string {
  let result = text;
  result = result.replace(/\bwhich\b/gi, () => pick(["which", "that"]));
  result = result.replace(/\bthat\b/gi, () => pick(["that", "which"]));
  result = result.replace(/, and /g, () => pick([", and ", " and "]));
  return result;
}

/** Extreme only: strip essay-style transitions so output feels less robotic. */
function postprocessStripEssayTransitions(text: string): string {
  if (!extremeMode) return text;
  let t = text;
  const transitions: [RegExp, string][] = [
    [/\bTo sum up[,:\s]+/gi, ""],
    [/\b(?:and\s+)?to sum up[,:\s]+/gi, ""],
    [/\bIn conclusion[,:\s]*/gi, ""],
    [/\bOn the flip side[,:\s]*/gi, ""],
    [/\bAt the same time[,:\s]*/gi, ""],
    [/\bAt same time[,:\s]*/gi, ""],
    [/\bFurthermore[,:\s]*/gi, ""],
    [/\bMoreover[,:\s]*/gi, ""],
    [/\bAdditionally[,:\s]*/gi, ""],
    [/\bOverall[,:\s]*/gi, ""],
    [/\bBy contrast[,:\s]*/gi, ""],
  ];
  for (const [regex, repl] of transitions) {
    t = t.replace(regex, repl);
  }
  return t;
}

/** Fix only universal grammar/merge artifacts. Generic rules only – works for any input. */
function fixHumanizerArtifacts(text: string): string {
  let t = text;
  // Article + adjective (universal grammar)
  t = t.replace(/\ban notable\b/gi, "a notable");
  t = t.replace(/\ban significant\b/gi, "a significant");
  t = t.replace(/\ban substantial\b/gi, "a substantial");
  t = t.replace(/\ban considerable\b/gi, "a considerable");
  // Common pipeline glitches (generic)
  t = t.replace(/\bneeded for which\b/gi, "needed for that");
  t = t.replace(/\bhelps affects in the\b/gi, "helps in the");
  t = t.replace(/\bto matters for in the\b/gi, "to maintain");
  t = t.replace(/\baffects in the (maintenance|enhancement) of\b/gi, "helps in the $1 of");
  t = t.replace(/\b(meaningful|important|fundamental|central|essential|nourishing)\s+and\s+(this)\s+(\w+)/gi, "$1. $2 $3");
  t = t.replace(/\b(meaningful|important|fundamental|central|essential|nourishing)\s+and\s+(that)\s+(\w+)/gi, "$1. $2 $3");
  t = t.replace(/\s+and\s+and\s+/gi, " and ");
  t = t.replace(/\b(\w+) underlies?\s+(?:good\s+)?(\w+)\b/gi, (_, subj, obj) => pick([`${subj} is at the heart of ${obj}`, `${subj} is central to ${obj}`]));
  // Any duplicate word (generic): "word word" → "word"
  t = t.replace(/\b(\w+)\s+\1\b/gi, "$1");
  // Stray 2+ digit tokens (likely API/encoding artifacts): remove number only, leave following word
  t = t.replace(/\b\d{2,}\s+/g, "");
  // Infinitive: "to helps" / "to aids" etc. → bare verb (generic grammar)
  t = t.replace(/\bto (helps?|aids?|holds?|maintains?|supports?|provides?|delivers?|brings?)\b/gi, (_, v) => "to " + v.replace(/s$/, ""));
  return t;
}

/** Split at ", and " or " which " for sentence-length variety. Extreme: light split only (perplexity/burstiness). */
function postprocessBurstiness(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  const minLen = extremeMode ? 25 : 20;
  const probAnd = extremeMode ? 0.18 : 0.35;
  const probWhich = extremeMode ? 0.12 : 0.28;
  for (const s of sentences) {
    if (s.length < minLen) {
      out.push(s);
      continue;
    }
    const andMatch = s.match(/^(.{4,}?), and (\w)(.*)$/);
    const whichMatch = s.match(/^(.{4,}?) which (\w)(.*)$/);
    if (andMatch && applyProb(probAnd)) {
      const [, before, letter, rest] = andMatch;
      out.push(before.trim() + ".");
      out.push("And " + letter.toUpperCase() + rest.trim());
      continue;
    }
    if (whichMatch && applyProb(probWhich)) {
      const [, before, letter, rest] = whichMatch;
      out.push(before.trim() + ".");
      out.push("Which " + letter.toLowerCase() + rest.trim());
      continue;
    }
    out.push(s);
  }
  return out.join(" ");
}

/** Contractions + there's, that's, etc. – apply often for less formal feel. */
function postprocessContractions(text: string): string {
  let result = text;
  const contractions: [RegExp, string][] = [
    [/\bit is\b/gi, "it's"],
    [/\bthat is\b/gi, "that's"],
    [/\bthere is\b/gi, "there's"],
    [/\bhere is\b/gi, "here's"],
    [/\bwhat is\b/gi, "what's"],
    [/\bwho is\b/gi, "who's"],
    [/\bdo not\b/gi, "don't"],
    [/\bdoes not\b/gi, "doesn't"],
    [/\bcan not\b/gi, "can't"],
    [/\bcannot\b/g, "can't"],
    [/\bis not\b/gi, "isn't"],
    [/\bare not\b/gi, "aren't"],
    [/\bwill not\b/gi, "won't"],
    [/\bwould not\b/gi, "wouldn't"],
    [/\bhave not\b/gi, "haven't"],
    [/\bhas not\b/gi, "hasn't"],
  ];
  for (const [regex, replacement] of contractions) {
    if (applyProb(p(0.82, 1.0))) result = result.replace(regex, replacement);
  }
  return result;
}

// ========== OUT-OF-THE-BOX: less robotic, more human quirks ==========

/** Add sentence starters for human rhythm. Extreme: 8% (run-88 was 6% / 60% AI; slightly more extreme). */
function postprocessConversationalStarters(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const starters = extremeMode ? ["And ", "But ", "So ", "Also "] : ["And ", "But ", "So "];
  const prob = extremeMode ? 0.06 : p(0.1, 0.08); // 6% matched run 100 (87% AI)
  const result = sentences.map((s, i) => {
    if (i === 0) return s;
    const trimmed = s.trim();
    const match = trimmed.match(/^(The |It |This |That )(.*)$/);
    if (match && applyProb(prob)) {
      return pick(starters) + trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    }
    return s;
  });
  return result.join(" ");
}

/** Coherence: merge very short and "And X." fragments into the previous sentence. */
function postprocessFragmentMerge(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i].trim();
    const prev = out[out.length - 1];
    const wordCount = s.replace(/[.!?]$/, "").trim().split(/\s+/).length;
    const startsWithAnd = /^And\s+/i.test(s);
    const isShort = wordCount <= 5;
    const isTinyFragment = wordCount <= 2;
    const mergeAnyway = prev && (isTinyFragment || (extremeMode && startsWithAnd && isShort));
    const looksFragment = isShort && !/^[A-Z][^.!?]*\b(?:is|are|was|were|can|may|will|do|does|have|has)\b/i.test(s);
    const shouldMerge = mergeAnyway || (prev && looksFragment && applyProb(extremeMode ? 0.52 : 0.3));
    if (shouldMerge) {
      const prevTrim = prev.replace(/[.!?]$/, "").trim();
      const frag = s.replace(/^And\s+/i, "").replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/[.!?]$/, "");
      out[out.length - 1] = prevTrim + (prevTrim.endsWith(",") ? " " : ", ") + frag + ".";
    } else {
      out.push(s);
    }
  }
  return out.join(" ");
}

/** Coherence: merge pairs of short adjacent sentences into one (favor merging over fragments). */
function postprocessMergeShortPairs(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const out: string[] = [];
  let i = 0;
  while (i < sentences.length) {
    const a = sentences[i].trim();
    const b = sentences[i + 1];
    const aWords = a.replace(/[.!?]$/, "").trim().split(/\s+/).length;
    const bWords = b ? b.replace(/[.!?]$/, "").trim().split(/\s+/).length : 0;
    const bothShort = aWords <= 12 && bWords <= 12 && aWords >= 1 && bWords >= 1;
    if (b && bothShort && applyProb(0.45)) {
      const aTrim = a.replace(/[.!?]$/, "").trim();
      const bTrim = b.trim().replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/[.!?]$/, "");
      out.push(aTrim + ", and " + bTrim + ".");
      i += 2;
    } else {
      out.push(a);
      i++;
    }
  }
  return out.join(" ");
}

/** Fragment injection: disabled (no one-word/short fragment sentences). */
function postprocessFragmentInjection(text: string): string {
  return text;
}

/** Use "you" / "we" / "one" – GPT-Infinity style. */
function postprocessYouWe(text: string): string {
  let result = text;
  result = result.replace(/\bone can\b/gi, () => pick(["you can", "people can", "one can"]));
  result = result.replace(/\bone must\b/gi, () => pick(["you have to", "one must"]));
  result = result.replace(/\bit is important to\b/gi, () => pick(["you should", "it helps to", "one should"]));
  result = result.replace(/\bindividuals (?:can|may|should)\b/gi, () => pick(["people can", "we can", "one can"]));
  result = result.replace(/\breaders? (?:will|may|should)\b/gi, () => pick(["you'll", "one will"]));
  return result;
}

/** GPT-Infinity style: "the body" → "our body/bodies", "the human body" → "our bodies". */
function postprocessOurOne(text: string): string {
  let result = text;
  result = result.replace(/\bthe human body\b/gi, () => pick(["our bodies", "the human body"]));
  result = result.replace(/\bthe body's\b/gi, () => pick(["our body's", "the body's"]));
  result = result.replace(/\bthe body\b/gi, () => pick(["our body", "our bodies", "the body"]));
  result = result.replace(/\bhuman health\b/gi, () => pick(["our health", "human health"]));
  result = result.replace(/\bpeople can\b/gi, () => pick(["we can", "people can", "one can"]));
  result = result.replace(/\bpeople (?:should|need to|must)\b/gi, () => pick(["we should", "people should", "one should"]));
  return result;
}

/** Safe nominalizations only (digestion, immune) – avoid "helps affects in the maintenance" style breaks. */
function postprocessNominalizations(text: string): string {
  let result = text;
  result = result.replace(/\bhelps? (?:with )?digestion\b/gi, () => pick(["helps in the digestion of food", "aids digestion"]));
  result = result.replace(/\bhelps? (?:with )?(?:the )?immune system\b/gi, () => pick(["supports the immune system", "helps the immune system"]));
  return result;
}

/** Move adverb to end sometimes for less predictable word order. */
function postprocessAdverbMove(text: string): string {
  let result = text;
  result = result.replace(/\bOften\s+([^.!?]+)([.!?])/g, (_, rest, punc) =>
    applyProb(p(0.5, 0.95)) ? rest.trim() + " often" + punc : "Often " + rest + punc
  );
  result = result.replace(/\bgenerally\s+([^.!?]+)([.!?])/gi, (_, rest, punc) =>
    applyProb(p(0.4, 0.9)) ? rest.trim() + " generally" + punc : "Generally " + rest + punc
  );
  result = result.replace(/\bsometimes\s+([^.!?]+)([.!?])/gi, (_, rest, punc) =>
    applyProb(p(0.4, 0.9)) ? rest.trim() + " sometimes" + punc : "Sometimes " + rest + punc
  );
  return result;
}

/** No trailing ellipsis – triple periods look odd and can trigger AI detectors. Disabled. */
function postprocessTrailingEllipsis(_text: string): string {
  return _text;
}

/** Aggressive period normalization: no double/triple/ellipsis/period-comma in output. */
function normalizeMultiplePeriods(text: string): string {
  let t = text;
  t = t.replace(/\u2026/g, "."); // Unicode ellipsis
  t = t.replace(/\.{2,}/g, "."); // 2+ consecutive periods → one
  t = t.replace(/\.\s*\.\s*\./g, "."); // . . . with spaces
  t = t.replace(/\.\s*\./g, "."); // . . with spaces
  t = t.replace(/\.\s*,\s*/g, ". "); // period then comma (wrong) → period space
  t = t.replace(/\.\s*\./g, "."); // any remaining . .
  return t;
}

/** Remove ALL repetitive periods: loop until no ".." or "..." remain. Guarantees clean output. */
export function stripRepetitivePeriods(text: string): string {
  let t = text;
  let prev = "";
  let iterations = 0;
  const maxIterations = 100;
  while (prev !== t && iterations < maxIterations) {
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

function postCleanup(text: string): string {
  let t = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\.\s+\./g, ".")
    .replace(/,\s+,/g, ",")
    .replace(/\s+([.!?,;])/g, "$1")
    .trim();
  t = normalizeMultiplePeriods(t);
  t = t.replace(/\.\s*,\s*/g, ". ");
  t = t.replace(/\.{2,}/g, ".");
  t = stripRepetitivePeriods(t);
  return t;
}

/** Final pass: no semicolons/colons. Coherence: capitalize sentence starts normally so readable. */
function postprocessFinalPunctuationAndCaps(text: string): string {
  let result = text
    .replace(/\s*;\s+/g, ". ")
    .replace(/\s*:\s*/g, ". ");
  if (extremeMode) {
    result = result.replace(/([.!?])\s+([a-z])/g, (_, p, c) => (applyProb(0.82) ? p + " " + c.toUpperCase() : p + " " + c));
  } else {
    result = result.replace(/([.!?])\s+([a-z])/g, (_, p, c) => p + " " + c.toUpperCase());
  }
  if (result.length > 0 && /^[a-z]/.test(result) && (!extremeMode || applyProb(0.9))) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

/** Coherence: one cap per sentence only. Split on .!?; then force each segment to lowercase + cap first char only. */
function postprocessNormalizeSentenceCaps(text: string): string {
  if (!text.trim()) return text;
  let result = text.replace(/\s*;\s*/g, ". ").replace(/\s*:\s*/g, ". ");
  result = result.replace(/([.!?])\s*([A-Za-z])/g, "$1 $2");
  const segments = result.split(/(?<=[.!?])\s*/).map((s) => s.trim()).filter(Boolean);
  result = segments
    .map((seg) => {
      const lower = seg.toLowerCase();
      if (!lower) return seg;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
  return result;
}

/** Extreme only: add punctuation variety so output isn't uniform (research: AI has uniform punctuation; humans vary). */
function postprocessHumanPunctuationVariation(text: string): string {
  if (!extremeMode) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i].trim();
    const next = sentences[i + 1];
    const nextTrim = next?.trim() ?? "";
    const nextStartsLower = nextTrim && /^[a-z]/.test(nextTrim);
    const nextShort = nextTrim && nextTrim.replace(/[.!?]$/, "").split(/\s+/).length <= 12;
    const canJoin = next && (nextShort || /^(and|but|so|yet|or|while|whereas)\s/i.test(nextTrim));
    if (canJoin && applyProb(0.22)) {
      const useSemicolon = applyProb(0.55);
      const punct = s.match(/[.!?]$/)?.[0] ?? ".";
      s = s.replace(/[.!?]$/, "");
      const nextLower = nextTrim.charAt(0).toLowerCase() + nextTrim.slice(1).replace(/[.!?]$/, "");
      const sep = useSemicolon ? "; " : ", and ";
      out.push(s + sep + nextLower + punct);
      i++;
    } else {
      out.push(s);
    }
  }
  return out.join(" ");
}

/** Final coherence pass: merge 1–2 word fragments into previous, fix punctuation glitches. No style changes. */
function postprocessFinalCoherencePass(text: string): string {
  let result = text
    .replace(/\.\s*;\s*/g, ". ")
    .replace(/;\s*\./g, ".")
    .replace(/\.\s*\./g, ".");
  const sentences = result.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return result;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    const prev = out[out.length - 1];
    const wordCount = s.replace(/[.!?]$/, "").trim().split(/\s+/).length;
    if (prev && wordCount >= 1 && wordCount <= 2) {
      const prevTrim = prev.replace(/[.!?]$/, "").trim();
      const frag = s.replace(/[.!?]$/, "").trim();
      out[out.length - 1] = prevTrim + ", " + frag.toLowerCase() + ".";
    } else {
      out.push(s);
    }
  }
  return out.join(" ");
}

/** Post-process: huge pipeline – structure, grammar, punctuation, synonyms, reorder, run key steps twice. */
export function humanizerPostProcess(text: string, options?: { extreme?: boolean }): string {
  setExtremeMode(options?.extreme ?? (typeof process !== "undefined" && process.env?.HUMANIZER_EXTREME === "1"));
  let result = text;
  result = stripFillers(result);
  result = fixApostrophes(result);
  result = postprocessStockPhrases(result);
  result = postprocessStripEssayTransitions(result);
  result = postprocessSynonyms(result);
  result = postprocessNominalizations(result); // GPT-Infinity: the X of, helps in the X of
  result = postprocessOurOne(result); // our bodies, one can
  result = postprocessSemicolonSplit(result); // all semicolons → period (more sentences to reorder)
  result = postprocessStripColons(result); // remove all colons
  result = postprocessReduceCommas(result); // ", and " → " and ", break comma chains
  result = postprocessNominalizationBreak(result);
  result = postprocessLongRunOnSplit(result);
  result = postprocessClauseReorder(result);
  result = postprocessWhichSplit(result);
  result = postprocessCommaSplits(result);
  result = postprocessSplitLongCompounds(result);
  result = postprocessAndSplit(result);
  result = postprocessJoinShorts(result);
  result = postprocessBurstiness(result);
  result = postprocessPassiveActive(result);
  result = postprocessPunctuationChaos(result);
  result = postprocessSynonyms(result);
  result = postprocessPunctuationSwitch(result);
  result = postprocessStructureMerge(result);
  result = postprocessSentenceReorder(result);
  result = postprocessChaosReorder(result);
  result = postprocessGrammarPunctuation(result);
  result = postprocessSentenceReorder(result);
  result = postprocessChaosReorder(result);
  result = postprocessGrammarPunctuation(result);
  if (extremeMode) {
    result = postprocessSentenceReorder(result);
    result = postprocessChaosReorder(result);
    result = postprocessGrammarPunctuation(result);
    result = postprocessArticleDrop(result);
  }
  result = postprocessContractions(result);
  result = postprocessYouWe(result);
  result = postprocessOurOne(result); // second pass for consistency
  result = postprocessConversationalStarters(result);
  result = postprocessChaosSynonyms(result); // extreme: less predictable wording (perplexity)
  result = postprocessFragmentMerge(result);
  result = postprocessMergeShortPairs(result);
  result = postprocessFragmentInjection(result);
  result = postprocessAdverbMove(result);
  result = postprocessTrailingEllipsis(result);
  result = stripEmDashes(result);
  result = fixHumanizerArtifacts(result);
  result = postprocessFinalPunctuationAndCaps(result);
  result = postCleanup(result);
  result = postprocessNormalizeSentenceCaps(result);
  result = postprocessFinalCoherencePass(result);
  result = postprocessNormalizeSentenceCaps(result);
  return result;
}

/** Pipeline-only humanizer: no Claude. Pre + post, optionally run post twice for aggressive scrambling. */
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
