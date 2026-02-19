# Humanizer optimization loop (manual GPTZero scoring)

We use a **fixed sample text** and run it through our humanizer over and over. You paste each run’s output into GPTZero (web) and report the **% human** (and % AI if you have it). We log every run in a spreadsheet, make **deliberate** pipeline/prompt changes, and save the pipeline for the **best** run so we can restore it or compare.

No GPTZero API key required: you score in the browser; we use the numbers to drive changes.

The current live humanizer is marked as **V2** in the UI. The pipeline that gave our best result so far (run #15: 7% human / 89% AI on GPTZero) is saved as the best snapshot; we stay on that track unless a later run beats it.

---

## 1. One run: humanize and get output

**You need:** dev server running (`npm run dev`), `ANTHROPIC_API_KEY` in `.env.local`.

```bash
node --env-file=.env.local scripts/optimizer-run.mjs
```

This will:

- Run the **same sample** (baseball essay) through the humanizer.
- Save the **full** humanized text to `scripts/optimizer-latest-output.txt`.
- Append a **new row** to `scripts/optimizer-runs.csv` (run_id, date, empty score for you to fill).
- Print the full text so you can copy it.

**Then:** Paste that text into [GPTZero](https://gptzero.me), get the result, and tell the assistant:

- **% human** (required)
- **% AI** (optional)
- Any short **notes** (e.g. “mixed”, “mostly human in the middle”).

---

## 2. Log the score

The assistant (or you) logs the score for the run that just finished:

```bash
node scripts/optimizer-log-score.mjs <score_human_pct> [score_ai_pct] [run_id]
```

Examples:

```bash
node scripts/optimizer-log-score.mjs 32
node scripts/optimizer-log-score.mjs 32 68
node scripts/optimizer-log-score.mjs 45 55 3
```

- If **run_id** is omitted, the script updates the **latest** run (the one with an empty score).
- Scores are written into `scripts/optimizer-runs.csv` so you can compare runs over time.

---

## 3. Deliberate changes

Using the score and how the text reads, we change the **pipeline** or **prompts** in a focused way, for example:

- **Prompt:** e.g. “more short sentences”, “avoid phrase X”, “plainer wording”.
- **Pipeline:** e.g. add/remove a post-step, tweak synonym list or stock-phrase fixes, adjust probabilities.

We aim for **one or two clear changes per run** so we can see what moved the score.

---

## 4. Save the best pipeline

When a run gives a **new best** % human:

```bash
node scripts/optimizer-save-best.mjs [run_id]
```

- Copies current `src/lib/prompts.ts` and `src/lib/humanizer-pipeline.ts` into `scripts/snapshots/best-run-<run_id>/`.
- Records that run as best in `scripts/best-run-id.txt`.
- Marks that run as best in the CSV (`is_best=1`).

If you omit `run_id`, the script uses the last run from `scripts/optimizer-run-meta.json`.

---

## 5. Restore the best pipeline (optional)

If later runs get worse and you want to go back to the best run:

```bash
node scripts/optimizer-restore-best.mjs [run_id]
```

- Restores `prompts.ts` and `humanizer-pipeline.ts` from `scripts/snapshots/best-run-<run_id>/`.
- If `run_id` is omitted, uses `scripts/best-run-id.txt`.

---

## 6. Use the best pipeline on the live site

The saved “best” is the pipeline that gave the **lowest AI score / highest human score**. To use it in production:

1. Restore it into the codebase (so the live site uses it):
   ```bash
   node scripts/optimizer-restore-best.mjs
   ```
2. Commit the updated `src/lib/prompts.ts` and `src/lib/humanizer-pipeline.ts`.
3. Deploy as usual.

That way the live humanizer always runs the best-known pipeline until you optimize again and save a new best.

---

## Spreadsheet: `scripts/optimizer-runs.csv`

| Column              | Meaning                                      |
|---------------------|----------------------------------------------|
| run_id              | Run number (1, 2, 3, …)                      |
| date_iso            | When the run was created                     |
| score_human_pct     | % human you reported from GPTZero           |
| score_ai_pct        | % AI (optional)                              |
| notes               | Free-form notes (e.g. “mixed”)               |
| is_best             | 1 = pipeline saved as best for this run     |
| pipeline_changes    | Short description of what we changed        |

Open in Excel, Google Sheets, or any CSV viewer to compare runs and see which changes improved the score.

---

## Loop summary

1. **Run:** `node --env-file=.env.local scripts/optimizer-run.mjs`
2. **Paste** the printed output into GPTZero.
3. **Report** % human (and % AI) to the assistant.
4. **Log:** `node scripts/optimizer-log-score.mjs <human_pct> [ai_pct]`
5. **Save best:** If this run has the **highest human %** (or lowest AI %) so far, run `node scripts/optimizer-save-best.mjs` so we keep that pipeline for the live site.
6. **Change:** Make 1–2 deliberate pipeline/prompt changes.
7. **Repeat** from step 1.

When you’re ready to ship: run `node scripts/optimizer-restore-best.mjs`, commit, and deploy so the live site uses the saved best pipeline.

The **sample text is fixed** so every run is comparable. The goal is to improve the **general** humanizer (better scores on this sample and hopefully on other text), not to overfit to this one essay.
