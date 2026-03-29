#!/usr/bin/env node
/**
 * One optimization run: humanize the fixed sample, save full output for you to paste
 * into GPTZero, and log the run to the spreadsheet (CSV). You report the % human back;
 * we log it with optimizer-log-score.mjs and make deliberate pipeline changes.
 *
 * Prerequisites: dev server running (npm run dev), ANTHROPIC_API_KEY in .env.local
 *
 * Usage: node scripts/optimizer-run.mjs   (from project root; .env.local is auto-loaded from project)
 * From anywhere: node /path/to/BypassrAI/scripts/optimizer-run.mjs
 * If Next.js is on port 3001: HUMANIZER_BASE_URL=http://localhost:3001 node scripts/optimizer-run.mjs
 * Extreme run: HUMANIZER_EXTREME=1 node scripts/optimizer-run.mjs
 * Legible run: HUMANIZER_LEGIBLE=1 node scripts/optimizer-run.mjs
 * Pipeline-only (no Claude): SKIP_CLAUDE=1 HUMANIZER_EXTREME=1 node scripts/optimizer-run.mjs
 *
 * Output: full humanized text (console + scripts/optimizer-latest-output.txt),
 * new row in scripts/optimizer-runs.csv, run id in scripts/optimizer-run-meta.json
 */

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const { spawn } = await import("child_process");

// Load .env.local from project root so this works even when run from ~ or other dirs
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const envPath = path.join(projectRoot, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const BASE_URL = process.env.HUMANIZER_BASE_URL || "http://localhost:3000";
const DEV_HUMANIZE = `${BASE_URL}/api/dev/humanize-sample`;

const DIR = path.resolve(scriptDir);
const CSV_PATH = path.join(DIR, "optimizer-runs.csv");
const OUTPUT_PATH = path.join(DIR, "optimizer-latest-output.txt");
const META_PATH = path.join(DIR, "optimizer-run-meta.json");

const DEFAULT_SAMPLE = `Nutrition plays a fundamental role in maintaining human health and supporting the body's essential functions. Understanding the principles of proper nutrition enables individuals to make informed dietary choices that promote physical well-being, prevent disease, and enhance quality of life. The human body requires a balanced intake of various nutrients to operate efficiently, and recognizing these nutritional needs is crucial for long-term health.

The foundation of good nutrition rests upon six essential nutrient categories: carbohydrates, proteins, fats, vitamins, minerals, and water. Carbohydrates serve as the body's primary energy source, fueling daily activities and supporting brain function. Complex carbohydrates found in whole grains, vegetables, and legumes provide sustained energy and contain valuable fiber that aids digestion. Proteins are equally vital, as they build and repair tissues, produce enzymes and hormones, and support immune function. Sources such as lean meats, fish, eggs, beans, and dairy products supply the amino acids necessary for these processes. Meanwhile, healthy fats from sources like nuts, avocados, and olive oil contribute to cell structure, hormone production, and the absorption of fat-soluble vitamins.

Vitamins and minerals, though required in smaller quantities, perform critical functions throughout the body. Vitamin C strengthens the immune system and promotes wound healing, while B vitamins facilitate energy metabolism. Calcium and vitamin D work together to maintain strong bones and teeth, particularly important during adolescence when bone density develops rapidly. Iron prevents anemia by supporting red blood cell production, and potassium regulates blood pressure and heart function. A varied diet rich in fruits, vegetables, whole grains, and lean proteins typically provides adequate amounts of these micronutrients.

Water often receives less attention than other nutrients, yet it remains absolutely essential for survival. The human body consists of approximately sixty percent water, which regulates temperature, transports nutrients, removes waste, and cushions joints. Dehydration can impair cognitive function, physical performance, and overall health. Health experts generally recommend consuming eight glasses of water daily, though individual needs vary based on activity level, climate, and body size.

Balanced nutrition extends beyond simply consuming the right nutrients; portion control and meal timing also matter significantly. Eating appropriate serving sizes helps maintain a healthy weight and prevents overconsumption of calories. Regular meal patterns stabilize blood sugar levels and sustain energy throughout the day, while skipping meals can lead to overeating later and nutritional deficiencies.

Poor nutrition carries serious consequences, contributing to obesity, diabetes, heart disease, and certain cancers. Diets high in processed foods, added sugars, and unhealthy fats increase disease risk, while inadequate fruit and vegetable intake deprives the body of protective antioxidants and phytochemicals. Conversely, adopting nutritious eating habits reduces chronic disease risk and supports healthy aging.

In conclusion, nutrition forms the cornerstone of good health, influencing every system within the human body. By understanding nutritional requirements and making conscious food choices, individuals can fuel their bodies appropriately, prevent illness, and optimize their physical and mental performance. As research continues to reveal connections between diet and health outcomes, the importance of nutrition education becomes increasingly clear for people of all ages.`;

const SKIP_CLAUDE = process.env.SKIP_CLAUDE === "1" || process.argv.includes("--no-claude");

async function humanize(text, refine = false) {
  console.log("Calling " + DEV_HUMANIZE + " ... (this can take 1–2 minutes)");
  if (BASE_URL.includes("3001")) console.log("(Using port 3001 – if your dev server is on 3000, set HUMANIZER_BASE_URL=http://localhost:3000)");
  else console.log("(If Next said 'trying 3001 instead', run with: HUMANIZER_BASE_URL=http://localhost:3001 node --env-file=.env.local scripts/optimizer-run.mjs)");
  const legible = process.env.HUMANIZER_LEGIBLE === "1";
  const extreme = process.env.HUMANIZER_EXTREME === "1" && !legible;
  const body = { text, refine, skipClaude: SKIP_CLAUDE, extreme, legible };
  const res = await fetch(DEV_HUMANIZE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Humanize ${res.status}`);
  }
  const data = await res.json();
  console.log("Response received, length: " + (data.humanized?.length ?? 0) + " chars");
  return data.humanized ?? "";
}

const CSV_HEADER = "run_id,date_iso,score_human_pct,score_ai_pct,notes,is_best,pipeline_changes";

function getNextRunId() {
  if (!fs.existsSync(CSV_PATH)) return 1;
  const content = fs.readFileSync(CSV_PATH, "utf8").trim();
  const lines = content.split("\n").filter(Boolean);
  if (lines.length <= 1) return 1;
  const lastLine = lines[lines.length - 1];
  const runId = parseInt(lastLine.split(",")[0], 10);
  return isNaN(runId) ? 1 : runId + 1;
}

function appendRunRow(runId, dateIso) {
  const row = [runId, dateIso, "", "", "", "", ""].join(",");
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, CSV_HEADER + "\n" + row + "\n", "utf8");
  } else {
    fs.appendFileSync(CSV_PATH, row + "\n", "utf8");
  }
}

function escapeCsv(s) {
  if (s == null || s === "") return "";
  const t = String(s);
  if (t.includes(",") || t.includes('"') || t.includes("\n")) return '"' + t.replace(/"/g, '""') + '"';
  return t;
}

async function main() {
  const runId = getNextRunId();
  const dateIso = new Date().toISOString();
  const legible = process.env.HUMANIZER_LEGIBLE === "1";

  console.log("Optimizer Run #" + runId);
  console.log("==================");
  const modeLabel = legible ? " [LEGIBLE]" : process.env.HUMANIZER_EXTREME === "1" ? " [EXTREME v2.3]" : "";
  console.log("Humanizing sample (" + DEFAULT_SAMPLE.split(/\s+/).length + " words)..." + modeLabel + (SKIP_CLAUDE ? " [PIPELINE-ONLY, no Claude]" : ""));
  console.log("Make sure the dev server is running: npm run dev");
  console.log("");

  const humanized = await humanize(DEFAULT_SAMPLE);
  if (!humanized) {
    console.error("Empty humanized output.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, humanized, "utf8");
  const written = fs.readFileSync(OUTPUT_PATH, "utf8");
  if (written !== humanized) {
    console.error("WARNING: Output file verification failed. Expected to write to: " + OUTPUT_PATH);
  }
  const runMarkerPath = path.join(DIR, "optimizer-latest-run.txt");
  fs.writeFileSync(runMarkerPath, `Run #${runId} | ${dateIso}\nOutput file: ${OUTPUT_PATH}\n`, "utf8");
  appendRunRow(runId, dateIso);
  fs.writeFileSync(
    META_PATH,
    JSON.stringify({ run_id: runId, timestamp_iso: dateIso, output_file: "optimizer-latest-output.txt", output_path_absolute: OUTPUT_PATH }, null, 2),
    "utf8"
  );

  copyToClipboard(humanized);

  console.log("--- PASTE EVERYTHING BELOW INTO GPTZERO ---");
  console.log("");
  console.log(humanized);
  console.log("");
  console.log("--- END ---");
  console.log("");
  console.log("Run #" + runId + " logged to " + CSV_PATH);
  console.log("Output written to (open this file to verify):");
  console.log("  " + OUTPUT_PATH);
  console.log("Run marker: " + runMarkerPath + " -> Run #" + runId);
  console.log("(Copied to clipboard — paste with Cmd+V into GPTZero)");
  console.log("");
  console.log("After you paste the text above into GPTZero, tell me the % human (and % AI if you have it).");
  console.log("I'll log the score and make deliberate pipeline changes for the next run.");
}

/** Copy text to system clipboard (macOS pbcopy, Windows clip). No-op if unavailable. */
function copyToClipboard(text) {
  const plat = process.platform;
  const cmd = plat === "darwin" ? "pbcopy" : plat === "win32" ? "clip" : null;
  if (!cmd) return;
  const proc = spawn(cmd, [], { stdio: ["pipe", "ignore", "ignore"] });
  proc.stdin.write(text, "utf8", () => proc.stdin.end());
  proc.on("error", () => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
