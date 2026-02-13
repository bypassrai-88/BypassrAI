# Humanizer: What’s in place right now

Analysis of the current humanizer pipeline, prompts, and behavior so we can improve it.

---

## 1. End-to-end flow

```
User submits text (POST /api/humanize)
    │
    ├─ Quota check (anonymous or logged-in)
    ├─ humanizerPreprocess(text)     ← pre-process
    ├─ Claude (HUMANIZE_SYSTEM)      ← model
    ├─ dedupeResponse(raw)
    ├─ cleanAIArtifacts(raw)
    ├─ humanizerPostProcess(text)   ← post-process
    └─ Return { humanized }
```

- **Entry:** `src/app/api/humanize/route.ts` (POST).
- **Limits:** 10,000 chars, 2,500 words per request.
- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`), temperature **0.7**, max_tokens 4096.

---

## 2. Pre-process (`src/lib/humanizer-pipeline.ts`)

**Role:** Slightly change the input so it’s less “perfect AI” before Claude paraphrases it.

| Step | What it does |
|------|-------------------------------|
| **Synonyms** | ~18 phrase pairs (e.g. “major” → one of “significant/substantial/considerable”). Each pair is applied with ~40% probability so the input isn’t uniformly rewritten. |
| **Punctuation** | One sentence boundary is randomly turned into `; ` or ` — ` (em dash), and the next sentence is lowercased so it reads as one sentence. |
| **Cleanup** | Trim and collapse spaces. |

- **Exports:** `humanizerPreprocess(text)`.
- **Randomness:** Results vary per request (synonym and punctuation choices).

---

## 3. System prompt (`src/lib/prompts.ts` – `HUMANIZE_SYSTEM`)

**Role:** Tell Claude how to humanize: tone, no filler, real paraphrasing, structure, grammar.

Current instructions (short version):

- **Tone:** Match the source (formal/neutral); no casual or spoken tics.
- **No filler:** No “So,” “I mean,” “like,” “you know,” “honestly,” “basically,” “obviously,” “really,” “just,” or reaction phrases.
- **Paraphrase:** Rephrase clauses, use synonyms, change structure; not just word swaps (e.g. “led to” → “contributed to,” reorder clauses).
- **Structure:** One main idea per sentence where possible; avoid restating the same point.
- **Variation:** Mix short and long sentences; vary sentence openings.
- **Grammar:** Correct apostrophes and punctuation; full sentences.
- **Content:** Preserve all facts; no adding or omitting important info.
- **Output:** Only the rewritten text; no preamble or “Here’s the rewritten version.”

There is also **`HUMANIZE_REFINE_SYSTEM`** for a second pass (“humanize further”), but it is **not used** in the main humanize route yet.

---

## 4. Post-process (`src/lib/humanizer-pipeline.ts`)

**Role:** Clean Claude’s output: remove leftover filler and fix common mistakes.

| Step | What it does |
|------|-------------------------------|
| **Strip fillers** | Removes phrases like “So,” “I mean,” “you know,” “honestly,” “basically,” “like” (at sentence start only), “Wild stuff,” “Just stepped down,” “obviously,” “really,” etc. |
| **Fix apostrophes** | Restores contractions: “Nixons” → “Nixon’s,” “wouldnt” → “wouldn’t,” “thats” → “that’s,” and many similar. |
| **Cleanup** | Normalize spaces, remove double periods/commas, trim. |

- **Exports:** `humanizerPostProcess(text)`.
- **No injection:** We do not add filler or casual language in post-process.

---

## 5. Route-level cleanup (`src/app/api/humanize/route.ts`)

After Claude, before post-process:

- **dedupeResponse(raw):** If the model repeated the start of the text later in the reply, we trim at the first repeat (chunk size 80 chars).
- **cleanAIArtifacts(raw):** Strip markdown headers (`# ...`), “Rewritten text” lines, and openers like “Here’s,” “Okay so,” “So basically.”

---

## 6. What we’re aiming for (reference)

From `docs/HUMANIZER_COMPARISON.md` (BypassrAI vs GPTInf, Watergate example):

| Goal | Meaning |
|------|---------|
| No filler | No “I mean,” “like,” “you know,” “So,” etc. |
| Formal–neutral tone | Same register as original; essay/report, not podcast. |
| Real paraphrasing | New sentence structures and synonyms, not just slang overlay. |
| One idea per sentence | No repeating the same point in different words. |
| Varied structure | Different lengths and openings; avoid repetitive rhythm. |
| Polished grammar | Correct apostrophes and full sentences. |

Current detection note: output can still score ~61% AI on GPTZero; the guide treats that as a baseline to improve from.

---

## 7. Where the code lives

| Piece | File | Symbol / section |
|-------|------|-------------------|
| API entry, quota, model call | `src/app/api/humanize/route.ts` | POST handler |
| Pre/post pipeline | `src/lib/humanizer-pipeline.ts` | `humanizerPreprocess`, `humanizerPostProcess` |
| System prompt | `src/lib/prompts.ts` | `HUMANIZE_SYSTEM`, `HUMANIZE_REFINE_SYSTEM` |
| Dedupe + artifact cleanup | `src/app/api/humanize/route.ts` | `dedupeResponse`, `cleanAIArtifacts` |

---

## 8. Gaps and improvement levers

- **No examples in prompt:** The prompt doesn’t include 1–2 “input → good output” snippets (e.g. GPTInf-style), so the model has no concrete style target.
- **Pre-process is light:** Only ~18 synonym pairs and one punctuation splice; no clause reordering or structural variation in the input.
- **Single pass only:** `HUMANIZE_REFINE_SYSTEM` exists but is never called; no automatic second pass when the text is still “too AI.”
- **No detector loop:** We don’t run an AI detector on the result and retry or refine when the score is high.
- **Fixed temperature:** 0.7 everywhere; no experimentation with 0.5–0.8 or per-request variation.
- **Apostrophe fixes are heuristic:** Post-process fixes known contractions; possessive “its” vs “it’s” can still be wrong.
- **PRE_SYNONYMS is small:** Easy to add more pairs for more input variation.

---

## 9. Quick reference: flow again

```
User text
  → humanizerPreprocess()     [synonyms ~40% each, 1 punctuation splice]
  → Claude (HUMANIZE_SYSTEM)   [formal–neutral, no filler, paraphrase, 0.7 temp]
  → dedupeResponse()           [cut at first 80-char repeat]
  → cleanAIArtifacts()         [strip headers / “Here’s the rewritten…”]
  → humanizerPostProcess()     [strip fillers, fix apostrophes, cleanup]
  → humanized
```

Use this doc plus `HUMANIZER_COMPARISON.md` and `HUMANIZER_GUIDE.md` when you want to make the humanizer better (prompt examples, more pre-process, second pass, or detector loop).
