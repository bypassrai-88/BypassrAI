/**
 * Humanizer pipeline: intense pre-process → (Claude) → strong post-process
 * Pre: reorder, structure, punctuation, grammar, many synonyms.
 * Post: strip filler, fix apostrophes, huge synonym pass, structure + punctuation variation.
 */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function applyProb(prob: number): boolean {
  return Math.random() < prob;
}

// ========== PRE-PROCESS: intense ==========

/** Large formal synonym set – apply most of them to heavily vary input. */
const PRE_SYNONYMS: [RegExp, string[]][] = [
  [/\bmajor\b/gi, ["significant", "substantial", "considerable", "notable"]],
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
];

function preprocessSynonyms(text: string): string {
  let result = text;
  for (const [pattern, replacements] of PRE_SYNONYMS) {
    if (applyProb(0.12)) continue; // apply ~88% of synonym passes
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Intense punctuation: many sentence boundaries → semicolon or comma+lowercase. */
function preprocessPunctuation(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const separators = ["; ", ", and ", ", "];
  const indicesToChange: number[] = [];
  const maxChanges = Math.min(Math.max(2, Math.floor(sentences.length * 0.65)), sentences.length - 1);
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
    if (applyProb(0.15)) result = result.replace(regex, fn);
  }
  return result;
}

/** Swap two consecutive short sentences for variety. */
function preprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const idx = Math.floor(Math.random() * (sentences.length - 1));
  const a = sentences[idx];
  const b = sentences[idx + 1];
  if (a.length < 100 && b.length < 100 && applyProb(0.7)) {
    sentences[idx] = b;
    sentences[idx + 1] = a;
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
    if (applyProb(0.1)) result = result.replace(regex, () => pick(replacements));
  }
  return result;
}

/** Pre-process: intense reorder, structure, punctuation, synonyms. */
export function humanizerPreprocess(text: string): string {
  let result = text.trim();
  result = preprocessSynonyms(result);
  result = preprocessClauseOrder(result);
  result = preprocessPunctuation(result);
  result = preprocessSentenceReorder(result);
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
  [/\bmajor\b/gi, ["significant", "substantial", "considerable", "notable"]],
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
];

function postprocessSynonyms(text: string): string {
  let result = text;
  for (const [pattern, replacements] of POST_SYNONYMS) {
    if (applyProb(0.18)) continue; // apply ~82% of synonym passes
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Punctuation switching: many periods → semicolons or comma+and. */
function postprocessPunctuationSwitch(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i];
    const next = sentences[i + 1];
    if (next && s.length > 15 && s.length < 140 && applyProb(0.5)) {
      const useSemicolon = applyProb(0.6);
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

/** Merge two short sentences with semicolon or comma for structure variation. */
function postprocessStructureMerge(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];
    const b = sentences[i + 1];
    if (b && a.length < 80 && b.length < 80 && applyProb(0.45)) {
      const sep = applyProb(0.5) ? "; " : ", and ";
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

/** Swap adjacent sentences for structure variation (post). */
function postprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 3) return text;
  const result = [...sentences];
  const swapped = new Set<number>();
  const maxSwaps = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.35)));
  for (let n = 0; n < maxSwaps; n++) {
    const idx = Math.floor(Math.random() * (result.length - 1));
    const a = result[idx];
    const b = result[idx + 1];
    if (a.length < 110 && b.length < 110 && !swapped.has(idx) && applyProb(0.65)) {
      result[idx] = b;
      result[idx + 1] = a;
      swapped.add(idx);
    }
  }
  return result.join(" ");
}

/** Light grammar/punctuation variation: optional serial comma, which/that. */
function postprocessGrammarPunctuation(text: string): string {
  let result = text;
  if (applyProb(0.4)) result = result.replace(/\bwhich\b/gi, () => pick(["which", "that"]));
  if (applyProb(0.35)) result = result.replace(/\bthat\b/gi, () => pick(["that", "which"]));
  if (applyProb(0.3)) result = result.replace(/, and /g, () => pick([", and ", " and "]));
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

/** Post-process: strip filler, fix apostrophes, aggressive synonym + structure + punctuation + sentence reorder + grammar tweaks, strip em dashes, cleanup. */
export function humanizerPostProcess(text: string): string {
  let result = text;
  result = stripFillers(result);
  result = fixApostrophes(result);
  result = postprocessSynonyms(result);
  result = postprocessPunctuationSwitch(result);
  result = postprocessStructureMerge(result);
  result = postprocessSentenceReorder(result);
  result = postprocessGrammarPunctuation(result);
  result = stripEmDashes(result);
  result = postCleanup(result);
  return result;
}
