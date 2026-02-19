#!/usr/bin/env node
/**
 * Restore the pipeline from the saved "best" snapshot. Use this to put the best
 * pipeline (lowest AI / highest human score) into src/lib so the live site uses it.
 * Run before commit/deploy when you want production to use the best-known pipeline.
 *
 * Usage: node scripts/optimizer-restore-best.mjs [run_id]
 *   If run_id omitted, uses scripts/best-run-id.txt.
 */

const fs = await import("fs");
const path = await import("path");

const ROOT = path.resolve(process.cwd());
const DIR = path.resolve(ROOT, "scripts");
const SNAPSHOTS_DIR = path.join(DIR, "snapshots");
const BEST_RUN_PATH = path.join(DIR, "best-run-id.txt");

const FILES = ["prompts.ts", "humanizer-pipeline.ts"];
const TARGET_DIR = path.join(ROOT, "src", "lib");

function main() {
  let runId = process.argv[2];
  if (runId === undefined || runId === "") {
    if (!fs.existsSync(BEST_RUN_PATH)) {
      console.error("No run_id given and no best-run-id.txt. Save a best run first (optimizer-save-best.mjs).");
      process.exit(1);
    }
    runId = fs.readFileSync(BEST_RUN_PATH, "utf8").trim();
  }

  const snapshotDir = path.join(SNAPSHOTS_DIR, "best-run-" + runId);
  if (!fs.existsSync(snapshotDir)) {
    console.error("Snapshot not found: " + snapshotDir);
    process.exit(1);
  }

  for (const name of FILES) {
    const src = path.join(snapshotDir, name);
    const dest = path.join(TARGET_DIR, name);
    if (!fs.existsSync(src)) {
      console.warn("Skip (missing in snapshot): " + name);
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log("Restored " + name);
  }

  console.log("Restored best pipeline from run #" + runId);
}

main();
