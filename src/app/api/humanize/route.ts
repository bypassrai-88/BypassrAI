import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  checkAnonymousQuota,
  countWords,
  incrementAnonymousUsage,
  setAnonCookie,
} from "@/lib/quota-anonymous";
import {
  checkUserQuota,
  incrementUserUsage,
} from "@/lib/quota-user";
import { HUMANIZE_SYSTEM } from "@/lib/prompts";

// ============================================
// AGGRESSIVE POST-PROCESSING ENGINE
// Transforms text to bypass AI detectors
// ============================================

/** Large word substitution map for higher perplexity */
const WORD_SUBS: [RegExp, string[]][] = [
  // Formal -> casual
  [/\bHowever\b/g, ["But", "Though", "Still"]],
  [/\bTherefore\b/g, ["So", "And so", "Which means"]],
  [/\bFurthermore\b/g, ["Plus", "And", "Also"]],
  [/\bMoreover\b/g, ["And", "Plus", "On top of that"]],
  [/\bConsequently\b/g, ["So", "Which meant", "And then"]],
  [/\bNevertheless\b/g, ["But still", "Even so", "Still"]],
  [/\bAdditionally\b/g, ["And", "Plus", "Also"]],
  [/\bSignificantly\b/g, ["A lot", "Really", "Seriously"]],
  [/\bSubstantially\b/g, ["A lot", "Way more", "Seriously"]],
  [/\bUtilize\b/gi, ["use", "work with"]],
  [/\bDemonstrate\b/gi, ["show", "prove"]],
  [/\bIndicate\b/gi, ["show", "point to", "suggest"]],
  [/\bFacilitate\b/gi, ["help", "make easier"]],
  [/\bImplement\b/gi, ["do", "put in", "start"]],
  [/\bComprehensive\b/gi, ["full", "complete", "big"]],
  [/\bFundamental\b/gi, ["basic", "key", "main"]],
  [/\bSignificant\b/gi, ["big", "major", "important"]],
  [/\bSubsequently\b/gi, ["then", "after", "later"]],
  [/\bPrimarily\b/gi, ["mostly", "mainly"]],
  [/\bEssentially\b/gi, ["basically", "really"]],
  [/\bParticularly\b/gi, ["especially", "really"]],
  [/\bSpecifically\b/gi, ["exactly", "particularly"]],
  // AI tells
  [/\bdelve\b/gi, ["dig into", "look at", "explore"]],
  [/\bcrucial\b/gi, ["important", "key", "big"]],
  [/\bvital\b/gi, ["important", "key"]],
  [/\bpivotal\b/gi, ["key", "important", "major"]],
  [/\bseamlessly\b/gi, ["smoothly", "easily"]],
  [/\brobust\b/gi, ["strong", "solid"]],
  [/\bleverage\b/gi, ["use", "work with"]],
  [/\boptimize\b/gi, ["improve", "make better"]],
  [/\bstreamline\b/gi, ["simplify", "speed up"]],
  // Common adjectives
  [/\bbeautiful\b/gi, ["pretty", "nice", "gorgeous"]],
  [/\bamazing\b/gi, ["great", "awesome", "cool"]],
  [/\bincredible\b/gi, ["wild", "crazy", "unreal"]],
  [/\bremarkable\b/gi, ["wild", "something else"]],
  [/\bextraordinary\b/gi, ["wild", "unreal", "crazy"]],
  [/\bexceptional\b/gi, ["really good", "great"]],
  [/\boutstanding\b/gi, ["great", "amazing"]],
  [/\bimpressive\b/gi, ["cool", "neat", "solid"]],
  [/\bsignificant\b/gi, ["big", "major", "real"]],
  [/\bsubstantial\b/gi, ["big", "solid", "real"]],
];

/** Filler phrases */
const FILLERS = [
  "I mean",
  "honestly",
  "like",
  "you know",
  "basically",
  "kind of",
  "pretty much",
  "really",
  "actually",
  "so yeah",
];

/** Personal reaction phrases */
const REACTIONS = [
  "Pretty wild honestly.",
  "Kind of crazy when you think about it.",
  "Thats dedication right there.",
  "Not gonna lie thats impressive.",
  "Wild stuff.",
  "Makes you think.",
  "Crazy right?",
];

/** Random pick from array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Apply word substitutions for higher perplexity */
function applyWordSubs(text: string): string {
  let result = text;
  for (const [pattern, replacements] of WORD_SUBS) {
    result = result.replace(pattern, () => pick(replacements));
  }
  return result;
}

/** Remove/modify punctuation chaotically */
function chaosifyPunctuation(text: string): string {
  let result = text;
  
  // Remove 40% of commas randomly
  result = result.replace(/,/g, (m) => Math.random() > 0.4 ? m : "");
  
  // Remove apostrophes from contractions (50% chance each)
  const contractions = [
    [/\bthat's\b/gi, "thats"],
    [/\bit's\b/gi, "its"],
    [/\bdidn't\b/gi, "didnt"],
    [/\bdoesn't\b/gi, "doesnt"],
    [/\bwasn't\b/gi, "wasnt"],
    [/\bisn't\b/gi, "isnt"],
    [/\bdon't\b/gi, "dont"],
    [/\bwon't\b/gi, "wont"],
    [/\bcan't\b/gi, "cant"],
    [/\bcouldn't\b/gi, "couldnt"],
    [/\bwouldn't\b/gi, "wouldnt"],
    [/\bshouldn't\b/gi, "shouldnt"],
    [/\bI'm\b/g, "Im"],
    [/\bI've\b/g, "Ive"],
    [/\bI'll\b/g, "Ill"],
    [/\bwe're\b/gi, "were"],
    [/\bthey're\b/gi, "theyre"],
    [/\byou're\b/gi, "youre"],
    [/\bwe've\b/gi, "weve"],
    [/\bthey've\b/gi, "theyve"],
  ];
  
  for (const [pattern, replacement] of contractions) {
    result = result.replace(pattern as RegExp, () => 
      Math.random() > 0.5 ? replacement as string : String(pattern).slice(2, -3).replace("\\b", "").replace("\\b", "")
    );
  }
  
  // Remove semicolons
  result = result.replace(/;/g, ",");
  
  // Remove em/en dashes
  result = result.replace(/[—–]/g, ",");
  
  return result;
}

/** Add repetition patterns */
function addRepetition(text: string): string {
  let result = text;
  
  // Extend repetition phrases
  result = result.replace(/over and over(?! and over)/gi, "over and over and over");
  result = result.replace(/again and again(?! and again)/gi, "again and again");
  
  // Add "and [verb]" repetition (30% of applicable verbs)
  const verbPattern = /\b(worked|painted|tried|kept|went|pushed|fought|struggled)\b/gi;
  result = result.replace(verbPattern, (match) => 
    Math.random() > 0.7 ? `${match} and ${match}` : match
  );
  
  return result;
}

/** Vary sentence structure - join some, fragment others */
function varySentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const result: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const next = sentences[i + 1];
    
    // 25% chance to join short sentences with "and"
    if (next && s.length < 50 && next.length < 50 && Math.random() > 0.75) {
      const joined = s.replace(/[.!?]$/, "") + " and " + next.charAt(0).toLowerCase() + next.slice(1);
      result.push(joined);
      i++; // skip next
    } else {
      result.push(s);
    }
  }
  
  return result.join(" ");
}

/** Inject fillers at sentence starts */
function injectFillers(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  const processed = sentences.map((s, i) => {
    // Skip first sentence, 15% chance for others
    if (i === 0 || Math.random() > 0.15) return s;
    
    const filler = pick(FILLERS);
    return filler + " " + s.charAt(0).toLowerCase() + s.slice(1);
  });
  
  return processed.join(" ");
}

/** Add a reaction somewhere in the text */
function injectReaction(text: string): string {
  if (Math.random() > 0.6) return text; // 40% chance to add
  
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  
  // Insert reaction after 2nd or 3rd sentence
  const insertPos = Math.min(2 + Math.floor(Math.random() * 2), sentences.length - 1);
  const reaction = pick(REACTIONS);
  
  sentences.splice(insertPos, 0, reaction);
  return sentences.join(" ");
}

/** Ensure text has 3-4 paragraphs */
function ensureParagraphs(text: string): string {
  // If already has paragraphs, return as-is
  if (text.includes("\n\n")) return text;
  
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 6) return text;
  
  const chunkSize = Math.ceil(sentences.length / 3);
  const paragraphs: string[] = [];
  
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) paragraphs.push(chunk.trim());
  }
  
  return paragraphs.join("\n\n");
}

/** Clean up spacing and punctuation */
function finalCleanup(text: string): string {
  return text
    .replace(/\s+/g, " ")           // Normalize spaces
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Max 2 newlines
    .replace(/\.\s+\./g, ".")       // Remove double periods
    .replace(/,\s*,/g, ",")         // Remove double commas
    .replace(/\s+([.!?,])/g, "$1")  // No space before punctuation
    .replace(/—/g, ",")             // Remove em dashes
    .replace(/–/g, ",")             // Remove en dashes
    .trim();
}

/** Main post-processing pipeline */
function humanizePostProcess(text: string): string {
  let result = text;
  
  result = applyWordSubs(result);
  result = chaosifyPunctuation(result);
  result = addRepetition(result);
  result = varySentences(result);
  result = injectFillers(result);
  result = injectReaction(result);
  result = ensureParagraphs(result);
  result = finalCleanup(result);
  
  return result;
}

/** Remove duplicate output if model repeated itself */
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

/** Clean AI artifacts from output */
function cleanAIArtifacts(raw: string): string {
  let text = raw;
  
  // Remove markdown headers
  text = text.replace(/^#+ .*\n*/gm, "");
  text = text.replace(/^\*\*Rewritten.*?\*\*\n*/i, "");
  text = text.replace(/^Rewritten (?:Text|Version)[:\s]*/i, "");
  text = text.replace(/^Here(?:'s| is) the rewritten (?:text|version)[:\s]*/i, "");
  
  // Remove common AI openers
  text = text.replace(/^(Here'?s?|Okay,?\s*so|Alright,?\s*so|So,?\s*basically)\s*/i, "");
  
  return text.trim();
}

export async function POST(request: NextRequest) {
  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (_) {}

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text." }, { status: 400 });
  }

  const maxChars = 10000;
  if (text.length > maxChars) {
    return NextResponse.json({ error: `Text is too long. Maximum ${maxChars} characters.` }, { status: 400 });
  }

  const wordCount = countWords(text);
  const maxWordsPerRequest = 2500;
  if (wordCount > maxWordsPerRequest) {
    return NextResponse.json({ error: `Maximum ${maxWordsPerRequest.toLocaleString()} words per request.` }, { status: 400 });
  }

  if (user) {
    const quota = await checkUserQuota(user.id, wordCount);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }
  } else {
    const quota = await checkAnonymousQuota(request, wordCount);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });
    
    // Call Claude with high temperature for variation
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 1.0,
      system: HUMANIZE_SYSTEM,
      messages: [{ role: "user", content: text }],
    });

    const block = response.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text.trim() : "";
    
    // Clean and post-process
    let humanized = dedupeResponse(raw);
    humanized = cleanAIArtifacts(humanized);
    humanized = humanizePostProcess(humanized);

    if (!humanized) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    // Update usage
    if (user) {
      const quota = await checkUserQuota(user.id, wordCount);
      if (quota.allowed) {
        await incrementUserUsage(user.id, wordCount, quota.periodStart);
      }
    } else {
      const quota = await checkAnonymousQuota(request, wordCount);
      if (quota.allowed) {
        await incrementAnonymousUsage(quota.anonymousId, wordCount);
      }
    }

    const resp = NextResponse.json({ humanized });
    if (!user) {
      const quota = await checkAnonymousQuota(request, wordCount);
      if (quota.allowed && quota.setCookie) {
        setAnonCookie(resp, quota.anonymousId);
      }
    }
    return resp;
  } catch (err) {
    console.error("Humanize API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Something went wrong." }, { status: 502 });
  }
}
