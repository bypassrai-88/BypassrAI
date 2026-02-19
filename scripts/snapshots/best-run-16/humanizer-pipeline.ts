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
    result = result.replace(regex, fn);
  }
  return result;
}

/** Swap many consecutive sentence pairs for heavy reordering. */
function preprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const maxSwaps = Math.min(20, Math.max(10, Math.floor(sentences.length * 0.8)));
  const swapped = new Set<number>();
  for (let n = 0; n < maxSwaps; n++) {
    const idx = Math.floor(Math.random() * (sentences.length - 1));
    if (swapped.has(idx)) continue;
    const a = sentences[idx];
    const b = sentences[idx + 1];
    if (a.length < 200 && b.length < 200) {
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

/** Generic AI-tell phrases only – work on any domain (no essay/topic-specific strings). */
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

/** Punctuation: sometimes join short sentences with comma+and; avoid creating long semicolon chains. */
function postprocessPunctuationSwitch(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return text;
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i];
    const next = sentences[i + 1];
    if (next && s.length > 15 && s.length < 100 && applyProb(0.6)) {
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
    if (b && a.length < 80 && b.length < 80 && applyProb(0.7)) {
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
  result = result.replace(/,\s*and\s+/g, () => (applyProb(0.85) ? " and " : ", and "));
  const sentences = result.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    const parts = s.split(/,\s+/);
    if (parts.length < 3 || !applyProb(0.35)) {
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

/** Split long sentences at ", and " or ", " (before a clause) to create fragments. */
function postprocessCommaSplits(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length < 50) {
      out.push(s);
      continue;
    }
    const andMatch = s.match(/^(.{15,}?), and (\w)([^.]*\.?)$/);
    const commaMatch = s.match(/^(.{20,}?), (\w)([^.]{10,}\.?)$/);
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

/** Split "X, which Y" into "X. Y" sometimes (lower prob for smoother prose). */
function postprocessWhichSplit(text: string): string {
  return text.replace(/(.{15,}?), which (\w)([^.]*\.)/gi, (_, before, letter, rest) =>
    applyProb(0.25) ? `${before.trim()}. ${letter.toUpperCase()}${rest.trim()}` : `${before}, which ${letter}${rest}`
  );
}

/** Swap adjacent sentences very aggressively (post) – always apply. */
function postprocessSentenceReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 3) return text;
  const result = [...sentences];
  const swapped = new Set<number>();
  const maxSwaps = Math.min(30, Math.max(12, Math.floor(sentences.length * 0.7)));
  for (let n = 0; n < maxSwaps; n++) {
    const idx = Math.floor(Math.random() * (result.length - 1));
    if (swapped.has(idx)) continue;
    const a = result[idx];
    const b = result[idx + 1];
    if (a.length < 260 && b.length < 260) {
      result[idx] = b;
      result[idx + 1] = a;
      swapped.add(idx);
    }
  }
  return result.join(" ");
}

/** Swap non-adjacent sentences – run many times for heavy chaos. */
function postprocessChaosReorder(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  if (sentences.length < 5) return text;
  let result = [...sentences];
  for (let run = 0; run < 6; run++) {
    if (!applyProb(0.85)) continue;
    const i = Math.floor(Math.random() * result.length);
    let j = Math.floor(Math.random() * result.length);
    if (Math.abs(i - j) < 2) j = (i + 2) % result.length;
    const a = result[i];
    const b = result[j];
    if (a.length < 280 && b.length < 280) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result.join(" ");
}

/** Grammar/punctuation variation: which/that, serial comma – always apply. */
function postprocessGrammarPunctuation(text: string): string {
  let result = text;
  result = result.replace(/\bwhich\b/gi, () => pick(["which", "that"]));
  result = result.replace(/\bthat\b/gi, () => pick(["that", "which"]));
  result = result.replace(/, and /g, () => pick([", and ", " and "]));
  return result;
}

/** Fix article+adjective and restore "Major League" if synonym swap broke it. */
function fixHumanizerArtifacts(text: string): string {
  let t = text;
  // "an" + adjective that starts with a consonant sound
  t = t.replace(/\ban notable\b/gi, "a notable");
  t = t.replace(/\ban significant\b/gi, "a significant");
  t = t.replace(/\ban substantial\b/gi, "a substantial");
  t = t.replace(/\ban considerable\b/gi, "a considerable");
  t = t.replace(/\bneeded for which\b/gi, "needed for that");
  t = t.replace(/\bhelps affects in the\b/gi, "helps in the");
  t = t.replace(/\bto matters for in the\b/gi, "to maintain");
  t = t.replace(/\baffects in the (maintenance|enhancement) of\b/gi, "helps in the $1 of");
  t = t.replace(/\b(substantial|notable|significant) League Baseball\b/gi, "Major League Baseball");
  t = t.replace(/\b(substantial|notable|significant) league baseball\b/g, "major league baseball");
  return t;
}

/** Split long sentences at ", and " or " which " – high probability for burstiness. */
function postprocessBurstiness(text: string): string {
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length < 50 || !applyProb(0.32)) {
      out.push(s);
      continue;
    }
    const andMatch = s.match(/^(.{15,}?), and (\w)(.*)$/);
    const whichMatch = s.match(/^(.{15,}?) which (\w)(.*)$/);
    if (andMatch && applyProb(0.35)) {
      const [, before, letter, rest] = andMatch;
      out.push(before.trim() + ".");
      out.push("And " + letter.toUpperCase() + rest.trim());
      continue;
    }
    if (whichMatch && applyProb(0.28)) {
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
    if (applyProb(0.82)) result = result.replace(regex, replacement);
  }
  return result;
}

// ========== OUT-OF-THE-BOX: less robotic, more human quirks ==========

/** GPT-Infinity style: rarely add And/But/So (smooth prose). */
function postprocessConversationalStarters(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const starters = ["And ", "But ", "So "];
  const result = sentences.map((s, i) => {
    if (i === 0) return s;
    const trimmed = s.trim();
    const match = trimmed.match(/^(The |It |This |That )(.*)$/);
    if (match && applyProb(0.1)) {
      return pick(starters) + trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    }
    return s;
  });
  return result.join(" ");
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
  result = result.replace(/\bOften\s+([^.!?]+)([.!?])/g, (_, rest, p) =>
    applyProb(0.5) ? rest.trim() + " often" + p : "Often " + rest + p
  );
  result = result.replace(/\bgenerally\s+([^.!?]+)([.!?])/gi, (_, rest, p) =>
    applyProb(0.4) ? rest.trim() + " generally" + p : "Generally " + rest + p
  );
  result = result.replace(/\bsometimes\s+([^.!?]+)([.!?])/gi, (_, rest, p) =>
    applyProb(0.4) ? rest.trim() + " sometimes" + p : "Sometimes " + rest + p
  );
  return result;
}

/** Rare trailing ellipsis (smooth prose). */
function postprocessTrailingEllipsis(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const result = sentences.map((s) => {
    if (s.length > 40 && s.length < 80 && applyProb(0.03)) return s.replace(/\.$/, "...");
    return s;
  });
  return result.join(" ");
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

/** Final pass: no semicolons/colons, and every sentence start capitalized. */
function postprocessFinalPunctuationAndCaps(text: string): string {
  let result = text
    .replace(/\s*;\s+/g, ". ")
    .replace(/\s*:\s*/g, ". ");
  result = result.replace(/([.!?])\s+([a-z])/g, (_, p, c) => p + " " + c.toUpperCase());
  if (result.length > 0 && /^[a-z]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

/** Post-process: huge pipeline – structure, grammar, punctuation, synonyms, reorder, run key steps twice. */
export function humanizerPostProcess(text: string): string {
  let result = text;
  result = stripFillers(result);
  result = fixApostrophes(result);
  result = postprocessStockPhrases(result);
  result = postprocessSynonyms(result);
  result = postprocessNominalizations(result); // GPT-Infinity: the X of, helps in the X of
  result = postprocessOurOne(result); // our bodies, one can
  result = postprocessSemicolonSplit(result); // all semicolons → period (more sentences to reorder)
  result = postprocessStripColons(result); // remove all colons
  result = postprocessReduceCommas(result); // ", and " → " and ", break comma chains
  result = postprocessClauseReorder(result);
  result = postprocessWhichSplit(result);
  result = postprocessCommaSplits(result);
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
  result = postprocessContractions(result);
  result = postprocessYouWe(result);
  result = postprocessOurOne(result); // second pass for consistency
  result = postprocessConversationalStarters(result);
  result = postprocessFragmentInjection(result);
  result = postprocessAdverbMove(result);
  result = postprocessTrailingEllipsis(result);
  result = stripEmDashes(result);
  result = fixHumanizerArtifacts(result);
  result = postprocessFinalPunctuationAndCaps(result);
  result = postCleanup(result);
  return result;
}

/** Pipeline-only humanizer: no Claude. Pre + post, optionally run post twice for aggressive scrambling. */
export function humanizerPipelineOnly(text: string, aggressive = false): string {
  let result = humanizerPreprocess(text.trim());
  result = humanizerPostProcess(result);
  if (aggressive) {
    result = humanizerPostProcess(result);
  }
  return result;
}
