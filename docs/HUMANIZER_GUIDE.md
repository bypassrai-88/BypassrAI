# Humanizer pipeline guide

This guide documents how the humanizer works and what we changed so we can revisit and strengthen it later (e.g. lower AI detection scores like GPTZero’s “61% AI”).

---

## What we did (summary)

1. **Defined the target style** – Compared our output to GPTInf using the Watergate example and wrote down six goals: no filler, formal–neutral tone, real paraphrasing, one idea per sentence, varied structure, polished grammar. See `docs/HUMANIZER_COMPARISON.md`.

2. **Three-stage pipeline**
   - **Pre-process** – Before sending text to Claude, we slightly “splice” the input (formal synonym swaps, punctuation variation) so it isn’t perfectly uniform. That gives Claude a less “AI-perfect” source to paraphrase.
   - **Claude** – New system prompt: same tone as original, no filler, real paraphrasing, varied structure, correct grammar. Temperature 0.7.
   - **Post-process** – Strip any remaining filler phrases, fix apostrophes, clean spacing. No injection of casual tics or chaos.

3. **Where the code lives**
   - **Pre- and post-process:** `src/lib/humanizer-pipeline.ts`  
     - `humanizerPreprocess(text)` – synonym pass + punctuation splice.  
     - `humanizerPostProcess(text)` – strip fillers, fix apostrophes, cleanup.
   - **Prompt:** `src/lib/prompts.ts` – `HUMANIZE_SYSTEM` and `HUMANIZE_REFINE_SYSTEM`.
   - **Route:** `src/app/api/humanize/route.ts` – calls preprocess → Claude → postprocess; also dedupes and strips AI artifacts from the raw response.

---

## Current flow

```
User text
    → humanizerPreprocess()   [synonym swaps, 1–2 punctuation splices]
    → Claude (HUMANIZE_SYSTEM) [paraphrase, formal–neutral, no filler]
    → dedupeResponse + cleanAIArtifacts
    → humanizerPostProcess()  [strip fillers, fix apostrophes, cleanup]
    → Humanized text
```

---

## Detection note (e.g. GPTZero 61% AI)

After these changes, output can still be flagged as “moderately confident AI” (e.g. GPTZero: 61% AI, 39% Human). That’s expected; we’re aiming to improve over time.

When we **revisit to make humanizing stronger**, focus on:

1. **Prompt** – Add 1–2 short example snippets of “good” humanized style (e.g. GPTInf-like) so Claude has a concrete target. Tighten instructions (e.g. “vary sentence openings”, “avoid starting two sentences with the same word”).
2. **Pre-process** – Add more synonym pairs; optionally lightly reorder one clause in a sentence; try a second punctuation splice. Goal: more variation in the input without changing meaning.
3. **Post-process** – Add a light “sentence shuffle” or punctuation variation (e.g. one period → semicolon where grammatically valid) to break detector patterns. Be careful not to hurt readability.
4. **Second pass** – If the user has an “AI check” score, consider automatically sending “high AI” output through a second Claude call with `HUMANIZE_REFINE_SYSTEM` and then post-process again.
5. **Model / settings** – Try a different temperature (e.g. 0.5–0.8), or a different Claude model if available, and re-run the same test paragraph to compare detection scores.

---

## Reference files

| File | Purpose |
|------|--------|
| `docs/HUMANIZER_COMPARISON.md` | Original vs BypassrAI vs GPTInf; what to aim for. |
| `docs/HUMANIZER_GUIDE.md` | This guide: what we did, pipeline, next steps. |
| `src/lib/humanizer-pipeline.ts` | Pre- and post-process logic. |
| `src/lib/prompts.ts` | HUMANIZE_SYSTEM, HUMANIZE_REFINE_SYSTEM. |
| `src/app/api/humanize/route.ts` | API: quota, preprocess, Claude, postprocess, usage. |

---

## Quick checklist for “stronger humanizing” later

- [ ] Re-read `HUMANIZER_COMPARISON.md` and the six goals.
- [ ] Add 1–2 example sentences (input → desired output) into `HUMANIZE_SYSTEM`.
- [ ] Expand `PRE_SYNONYMS` in `humanizer-pipeline.ts` or add a light clause-reorder step.
- [ ] Optionally: second-pass refine when AI score is high (reuse `HUMANIZE_REFINE_SYSTEM`).
- [ ] Re-test same paragraph (e.g. Watergate) and check GPTZero / other detectors again.
- [ ] Tweak temperature or model if needed.
