#!/usr/bin/env node
/**
 * Log the GPTZero score for the latest run (or a specific run_id).
 * Updates the runs CSV so we can compare runs and track best.
 *
 * Usage:
 *   node scripts/optimizer-log-score.mjs <score_human_pct> [score_ai_pct] [run_id]
 *   node scripts/optimizer-log-score.mjs 45
 *   node scripts/optimizer-log-score.mjs 45 55
 *   node scripts/optimizer-log-score.mjs 45 55 3
 *
 * If run_id is omitted, updates the most recent row that has empty score_human_pct.
 */

const fs = await import("fs");
const path = await import("path");

const DIR = path.resolve(process.cwd(), "scripts");
const CSV_PATH = path.join(DIR, "optimizer-runs.csv");
const BEST_RUN_PATH = path.join(DIR, "best-run-id.txt");

const CSV_HEADER = "run_id,date_iso,score_human_pct,score_ai_pct,notes,is_best,pipeline_changes";

function parseRow(line) {
  const parts = [];
  let i = 0;
  let field = "";
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === ",") {
      parts.push(field);
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  parts.push(field);
  return parts;
}

function serializeRow(parts) {
  return parts.map((p) => (p.includes(",") || p.includes('"') ? '"' + String(p).replace(/"/g, '""') + '"' : p)).join(",");
}

function main() {
  const args = process.argv.slice(2);
  const scoreHuman = args[0];
  const scoreAi = args[1];
  const runIdArg = args[2];

  if (!scoreHuman || scoreHuman === "") {
    console.error("Usage: node scripts/optimizer-log-score.mjs <score_human_pct> [score_ai_pct] [run_id]");
    process.exit(1);
  }

  if (!fs.existsSync(CSV_PATH)) {
    console.error("No runs file found. Run optimizer-run.mjs first.");
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, "utf8").trim();
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const header = lines[0];
  const dataLines = lines.slice(1);
  let targetIndex = -1;
  if (runIdArg !== undefined && runIdArg !== "") {
    const rid = parseInt(runIdArg, 10);
    targetIndex = dataLines.findIndex((l) => parseRow(l)[0] === String(rid));
  } else {
    targetIndex = dataLines.findIndex((l) => {
      const parts = parseRow(l);
      return (parts[2] ?? "") === "";
    });
  }

  if (targetIndex === -1) {
    console.error("No run found to update (specified run_id or last run with empty score).");
    process.exit(1);
  }

  const row = parseRow(dataLines[targetIndex]);
  const runId = row[0];
  row[2] = String(scoreHuman);
  row[3] = scoreAi !== undefined && scoreAi !== "" ? String(scoreAi) : row[3];
  if (row[5] === "") row[5] = "0";

  dataLines[targetIndex] = serializeRow(row);
  const newContent = header + "\n" + dataLines.join("\n") + "\n";
  fs.writeFileSync(CSV_PATH, newContent, "utf8");

  console.log("Logged score for run #" + runId + ": " + scoreHuman + "% human" + (scoreAi != null && scoreAi !== "" ? ", " + scoreAi + "% AI" : ""));
}

main();
