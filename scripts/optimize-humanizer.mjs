#!/usr/bin/env node
/**
 * Humanizer optimizer: run fixed sample through our humanizer, then (optionally)
 * through GPTZero API, and print the detector score so you can iterate on prompts/pipeline.
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - .env.local with ANTHROPIC_API_KEY (humanizer uses Claude)
 * - Optional: GPTZERO_API_KEY for automatic detector score (get key at https://app.gptzero.me/api)
 *
 * Usage:
 *   node --env-file=.env.local scripts/optimize-humanizer.mjs
 *   node --env-file=.env.local scripts/optimize-humanizer.mjs --file=path/to/sample.txt
 *   node --env-file=.env.local scripts/optimize-humanizer.mjs --no-gptzero
 *   node --env-file=.env.local scripts/optimize-humanizer.mjs --runs=3
 *
 * Workflow: run script → note GPTZero score → change prompts/pipeline in code →
 * run again and compare. Repeat until scores improve (more "human", less "AI").
 */

const BASE_URL = process.env.HUMANIZER_BASE_URL || "http://localhost:3000";
const FALLBACK_URL = "http://localhost:3001";
const DEV_HUMANIZE = `${BASE_URL}/api/dev/humanize-sample`;

// Fixed sample for optimizer (same input each run so you can compare detector output)
const DEFAULT_SAMPLE = `Nutrition plays a fundamental role in maintaining human health and supporting the body's essential functions. Understanding the principles of proper nutrition enables individuals to make informed dietary choices that promote physical well-being, prevent disease, and enhance quality of life. The human body requires a balanced intake of various nutrients to operate efficiently, and recognizing these nutritional needs is crucial for long-term health.

The foundation of good nutrition rests upon six essential nutrient categories: carbohydrates, proteins, fats, vitamins, minerals, and water. Carbohydrates serve as the body's primary energy source, fueling daily activities and supporting brain function. Complex carbohydrates found in whole grains, vegetables, and legumes provide sustained energy and contain valuable fiber that aids digestion. Proteins are equally vital, as they build and repair tissues, produce enzymes and hormones, and support immune function. Sources such as lean meats, fish, eggs, beans, and dairy products supply the amino acids necessary for these processes. Meanwhile, healthy fats from sources like nuts, avocados, and olive oil contribute to cell structure, hormone production, and the absorption of fat-soluble vitamins.

Vitamins and minerals, though required in smaller quantities, perform critical functions throughout the body. Vitamin C strengthens the immune system and promotes wound healing, while B vitamins facilitate energy metabolism. Calcium and vitamin D work together to maintain strong bones and teeth, particularly important during adolescence when bone density develops rapidly. Iron prevents anemia by supporting red blood cell production, and potassium regulates blood pressure and heart function. A varied diet rich in fruits, vegetables, whole grains, and lean proteins typically provides adequate amounts of these micronutrients.

Water often receives less attention than other nutrients, yet it remains absolutely essential for survival. The human body consists of approximately sixty percent water, which regulates temperature, transports nutrients, removes waste, and cushions joints. Dehydration can impair cognitive function, physical performance, and overall health. Health experts generally recommend consuming eight glasses of water daily, though individual needs vary based on activity level, climate, and body size.

Balanced nutrition extends beyond simply consuming the right nutrients; portion control and meal timing also matter significantly. Eating appropriate serving sizes helps maintain a healthy weight and prevents overconsumption of calories. Regular meal patterns stabilize blood sugar levels and sustain energy throughout the day, while skipping meals can lead to overeating later and nutritional deficiencies.

Poor nutrition carries serious consequences, contributing to obesity, diabetes, heart disease, and certain cancers. Diets high in processed foods, added sugars, and unhealthy fats increase disease risk, while inadequate fruit and vegetable intake deprives the body of protective antioxidants and phytochemicals. Conversely, adopting nutritious eating habits reduces chronic disease risk and supports healthy aging.

In conclusion, nutrition forms the cornerstone of good health, influencing every system within the human body. By understanding nutritional requirements and making conscious food choices, individuals can fuel their bodies appropriately, prevent illness, and optimize their physical and mental performance. As research continues to reveal connections between diet and health outcomes, the importance of nutrition education becomes increasingly clear for people of all ages.`;

async function humanize(text, refine = false) {
  const urls = [DEV_HUMANIZE];
  if (!process.env.HUMANIZER_BASE_URL) urls.push(`${FALLBACK_URL}/api/dev/humanize-sample`);
  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, refine }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        lastErr = new Error(err.error || `Humanize ${res.status}`);
        continue;
      }
      const data = await res.json();
      return data.humanized ?? "";
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Humanize request failed");
}

/**
 * Call GPTZero API. Docs: https://gptzero.stoplight.io/ and https://app.gptzero.me/api
 * If the endpoint or body format differs for your key, adjust below.
 */
async function gptZeroPredict(apiKey, document) {
  const url = "https://api.gptzero.me/v2/predict/text";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ document }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GPTZero ${res.status}: ${body}`);
  }
  return res.json();
}

function parseArgs() {
  const args = process.argv.slice(2);
  let file = null;
  let noGptZero = false;
  let runs = 1;
  for (const a of args) {
    if (a.startsWith("--file=")) file = a.slice(7);
    else if (a === "--no-gptzero") noGptZero = true;
    else if (a.startsWith("--runs=")) runs = Math.max(1, parseInt(a.slice(7), 10) || 1);
  }
  return { file, noGptZero, runs };
}

async function main() {
  const { file, noGptZero, runs } = parseArgs();

  let sample = DEFAULT_SAMPLE;
  if (file) {
    const fs = await import("fs");
    const path = await import("path");
    const p = path.resolve(process.cwd(), file);
    sample = fs.readFileSync(p, "utf8").trim();
  }

  const gptZeroKey = process.env.GPTZERO_API_KEY;
  const runGptZero = !noGptZero && !!gptZeroKey;

  console.log("Humanizer Optimizer");
  console.log("==================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Sample length: ${sample.split(/\s+/).length} words`);
  console.log(`Runs: ${runs}`);
  console.log(`GPTZero: ${runGptZero ? "yes (GPTZERO_API_KEY set)" : "no (use --no-gptzero to skip, or set GPTZERO_API_KEY)"}`);
  console.log("");

  const results = [];

  for (let i = 0; i < runs; i++) {
    if (runs > 1) console.log(`--- Run ${i + 1} / ${runs} ---`);
    try {
      const humanized = await humanize(sample);
      if (!humanized) {
        console.error("Empty humanized output.");
        results.push({ humanized: "", gptZero: null });
        continue;
      }

      console.log("Humanized (first 400 chars):");
      console.log(humanized.slice(0, 400) + (humanized.length > 400 ? "…" : ""));
      console.log("");

      let gptZeroResult = null;
      if (runGptZero) {
        try {
          gptZeroResult = await gptZeroPredict(gptZeroKey, humanized);
          const doc = gptZeroResult?.document_classification ?? gptZeroResult?.classification ?? gptZeroResult;
          const probs = gptZeroResult?.class_probabilities ?? gptZeroResult?.probabilities ?? {};
          console.log("GPTZero result:");
          if (doc) console.log("  Classification:", doc);
          if (typeof probs === "object" && Object.keys(probs).length) {
            console.log("  Probabilities:", JSON.stringify(probs, null, 2));
            const p = probs;
            const ai = p.ai ?? p.AI ?? p.ai_only;
            const human = p.human ?? p.HUMAN ?? p.human_only;
            if (ai != null || human != null) {
              console.log("");
              console.log("  SCORE (for comparison): AI=" + (ai != null ? String(Math.round(Number(ai) * 100)) + "%" : "?") + " Human=" + (human != null ? String(Math.round(Number(human) * 100)) + "%" : "?"));
            }
          } else {
            console.log("  Raw:", JSON.stringify(gptZeroResult, null, 2).slice(0, 500));
          }
        } catch (e) {
          console.error("GPTZero error:", e.message);
        }
      } else {
        console.log("Add GPTZERO_API_KEY to .env.local (https://app.gptzero.me/api) to get scores and run the optimization loop.");
      }

      results.push({ humanized, gptZero: gptZeroResult });
    } catch (e) {
      console.error("Error:", e.message);
      results.push({ humanized: "", gptZero: null });
    }
    if (runs > 1 && i < runs - 1) console.log("");
  }

  if (runs > 1 && results.some((r) => r.gptZero)) {
    console.log("\n--- Summary ---");
    results.forEach((r, i) => {
      const c = r.gptZero?.document_classification ?? r.gptZero?.classification ?? "—";
      console.log(`Run ${i + 1}: ${c}`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
