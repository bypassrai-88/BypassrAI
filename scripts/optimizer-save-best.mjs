#!/usr/bin/env node
/**
 * Save the current pipeline (prompts + humanizer-pipeline) as the "best" snapshot
 * for a given run. Use when you get a new best score (highest % human / lowest % AI).
 * This saved pipeline can be restored and used for the live site (see docs/OPTIMIZER_LOOP.md).
 *
 * Usage: node scripts/optimizer-save-best.mjs [run_id]
 *   If run_id omitted, reads from scripts/optimizer-run-meta.json (last run).
 */

const fs = await import("fs");
const path = await import("path");

const ROOT = path.resolve(process.cwd());
const DIR = path.resolve(ROOT, "scripts");
const SNAPSHOTS_DIR = path.join(DIR, "snapshots");
const META_PATH = path.join(DIR, "optimizer-run-meta.json");
const BEST_RUN_PATH = path.join(DIR, "best-run-id.txt");

const FILES_TO_SNAPSHOT = ["src/lib/prompts.ts", "src/lib/humanizer-pipeline.ts"];

function main() {
  let runId = process.argv[2];
  if (runId === undefined || runId === "") {
    if (!fs.existsSync(META_PATH)) {
      console.error("No run_id given and no optimizer-run-meta.json. Run optimizer-run.mjs first or pass run_id.");
      process.exit(1);
    }
    const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
    runId = String(meta.run_id ?? meta.run_id);
  }

  const snapshotDir = path.join(SNAPSHOTS_DIR, "best-run-" + runId);
  if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });

  for (const file of FILES_TO_SNAPSHOT) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
      console.warn("Skip (missing): " + file);
      continue;
    }
    const dest = path.join(snapshotDir, path.basename(file));
    fs.copyFileSync(src, dest);
  }

  fs.writeFileSync(BEST_RUN_PATH, runId + "\n", "utf8");

  // Mark this run as best in CSV if it exists
  const CSV_PATH = path.join(DIR, "optimizer-runs.csv");
  if (fs.existsSync(CSV_PATH)) {
    const csv = fs.readFileSync(CSV_PATH, "utf8");
    const lines = csv.trim().split("\n");
    const header = lines[0];
    const rows = lines.slice(1).filter(Boolean);
    const out = [header];
    for (const line of rows) {
      const parts = line.split(",");
      if (parts[0] === String(runId)) parts[5] = "1";
      else if (parts[5] === "1") parts[5] = "0";
      out.push(parts.join(","));
    }
    fs.writeFileSync(CSV_PATH, out.join("\n") + "\n", "utf8");
  }

  const manifest = {
    run_id: runId,
    saved_at: new Date().toISOString(),
    files: FILES_TO_SNAPSHOT.map((f) => path.basename(f)),
  };
  fs.writeFileSync(path.join(snapshotDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log("Saved best pipeline for run #" + runId + " to " + snapshotDir);
  console.log("Best run id recorded in " + BEST_RUN_PATH);
}

main();
