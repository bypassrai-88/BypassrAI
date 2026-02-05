# Humanizer & AI Detector: Research Summary and Implementation Plan

This document summarizes how other AI humanizers and detectors work, what makes text get flagged, and a concrete plan to improve BypassrAI’s humanizer and AI detector.

---

## Part 1: How AI Detectors Work

### What they measure

| Signal | What it is | Why it flags AI |
|--------|------------|------------------|
| **Perplexity** | How “predictable” each word is given context (how surprised a language model would be) | AI tends to pick high-probability, common words; humans use more surprising or varied choices. Low perplexity → more likely AI. |
| **Burstiness** | Variation in perplexity and structure *across* the text (sentence length, rhythm, complexity) | Humans mix short/long, simple/complex sentences; AI often produces uniform 12–18 word sentences and steady rhythm. Low burstiness → more likely AI. |
| **Pattern / style** | Word choice, transitions, punctuation, formulaic openings/closings | AI overuses certain words (delve, furthermore, leverage, etc.), em dashes, “In conclusion,” parallel structure, tidy endings. |
| **Embeddings / classifiers** | ML models trained on human vs AI text (e.g. RoBERTa-based, GPTZero’s deep learning) | They learn statistical and semantic fingerprints of AI text; paraphrasing alone often isn’t enough. |

### How major detectors work (in practice)

- **Turnitin:** Splits text into overlapping segments (~5–10 sentences), scores each 0–1, uses word-probability patterns. Trained on GPT-3, 3.5, ChatGPT; claims to detect GPT-4 and “AI bypasser” attempts. **Detects paraphrased and humanized text** (not just raw GPT).
- **GPTZero:** Deep learning + perplexity/burstiness, sentence-level classification, “Paraphraser Shield” against simple paraphrasing and homoglyph tricks. Uses HMM-style sentence highlighting.
- **Copyleaks, ZeroGPT, Quillbot:** Same core ideas—perplexity, burstiness, classifiers, embeddings. Copyleaks is often cited as very accurate; ZeroGPT has higher false positive rates.

**Takeaway:** To pass detectors we must (1) **increase effective perplexity and burstiness** and (2) **remove stylistic AI tells** (words, structure, punctuation). Simple one-shot paraphrasing is weak; detector-guided or multi-step humanization is stronger.

---

## Part 2: How Other Humanizers Do It

### Pattern-level (what most products do)

- **Sentence variation (burstiness):** Deliberately mix very short (3–8 word) and longer sentences; use fragments; vary openers (not always “Furthermore,” “Additionally”).
- **Punctuation:** Fewer em dashes (—), more commas/parentheses/semicolons; contractions (we’ve, it’s, don’t).
- **Word and phrase bans:** Avoid “AI tell” words (delve, comprehensive, leverage, foster, nuanced, paradigm, etc.) and stock phrases (in conclusion, it’s important to note, shed light on).
- **Structure:** Varied paragraph length; no symmetrical “Not X. Not Y. Just Z.”; no tidy “In conclusion” endings.
- **Tone:** Slightly less formal, more colloquial, active voice; allow minor imperfection (fragments, run-ons) where natural.

Commercial tools (e.g. Undetectable AI) add **readability level** and **purpose** (essay, marketing, etc.) so the rewrite matches the use case.

### Research-grade techniques

1. **Adversarial paraphrasing (detector-guided)**  
   - **Idea:** Use an LLM to paraphrase, but **guide it with a detector** so the rewrite is explicitly optimized to lower the detector score.  
   - **Result (arxiv 2506.07001):** “Adversarial Paraphrasing” with detector guidance (e.g. OpenAI-RoBERTa-Large) drastically outperforms simple paraphrasing: e.g. ~64% reduction in detection on RADAR, ~99% on Fast-DetectGPT; ~88% average reduction in true positives at 1% false positive.  
   - **Implication:** If we can call a detector (or proxy) inside the humanization loop, we can steer the rewrite toward “human” and iterate.

2. **Recursive / multi-step paraphrasing**  
   - Multiple rewrite passes break detector signatures better than a single pass, with moderate quality loss.

3. **MASH-style multi-stage alignment**  
   - Style-injection SFT → direct preference optimization → inference-time refinement to make outputs look more human. This is a **training** approach (fine-tuning), not just prompting.

4. **Perplexity & burstiness by prompt**  
   - Explicit instructions: “Mix short (≤15 words) and long sentences,” “Use one creative or surprising sentence per paragraph,” “Vary sentence openers,” “Use less common words where natural.”  
   - This is exactly the kind of thing we can encode in **HUMANIZE_SYSTEM** and in a multi-step pipeline.

### What we already do well (BypassrAI)

- Strong **HUMANIZE_SYSTEM** prompt: burstiness, banned words/phrases, punctuation, contractions, structure, voice.
- Single LLM call (Claude), 2048 max tokens.
- No detector feedback yet; no multi-step or adversarial loop.

---

## Part 3: What We Should Do — Humanizer

### Tier 1: Prompt and single-pass improvements (no new infra)

1. **Tighten and extend HUMANIZE_SYSTEM**
   - Add explicit **perplexity** guidance: “Use less predictable word choices where it fits; substitute common phrases with slightly more specific or surprising ones.”
   - Add **burstiness** rules: “Aim for at least one very short sentence (3–8 words) per paragraph and at least one longer (20+ words) where it fits.”
   - Add more banned words/phrases from detector literature and from our own detector’s `flaggedPhrases`.
   - Add **readability / purpose** hints (e.g. “academic essay,” “blog,” “marketing”) if we later add UI options; for now we can default to “general.”

2. **Optional “strength” or “style” in the API**
   - E.g. “More human” vs “Balanced” vs “Light touch”—map to a second system line that emphasizes “maximum burstiness and synonym variation” vs “preserve more of original structure.”

3. **Post-processing checks (optional)**
   - Run our own AI detector on the humanized output; if score is still high, we could either re-run humanize with a “stronger” instruction or surface a warning. (No need to change the text automatically in v1.)

### Tier 2: Multi-step and detector-guided (new pipeline)

4. **Two-pass humanization**
   - Pass 1: Current HUMANIZE_SYSTEM.
   - Pass 2: “Further humanize this text: increase sentence-length variation and replace any remaining common AI phrases. Output only the rewritten text.”
   - Optional: only do pass 2 if the detector score after pass 1 is above a threshold (e.g. 40%).

5. **Detector-guided humanization (adversarial paraphrasing lite)**
   - Flow: Humanize → run our AI checker → if score &gt; threshold, send back to the model with: “This text still scores as X% AI. Rewrite again to sound more human: [list any flagged phrases]. Focus on varying sentence length and removing these phrases. Output only the rewritten text.”
   - This requires: (a) our detector to be fast/cheap enough to call in the loop, (b) a limit on iterations (e.g. 2) to control cost and latency.
   - We can start with **one** feedback iteration: Humanize → Detect → if score high, one more “humanize again with focus on [flagged phrases]” pass.

6. **Chunked humanization for long text**
   - For inputs over ~500 words, humanize by paragraph or by fixed-size chunks, then optionally smooth boundaries (one short “stitch” prompt). This preserves burstiness within chunks and avoids the model “averaging” to a single style over the whole doc.

### Tier 3: Future (training, external detectors)

7. **Fine-tune a small “humanizer” model**  
   - MASH-style: data of (AI text, humanized text) and optionally detector scores; SFT or DPO to maximize “human” score. Large project; only after prompt and pipeline gains are saturated.

8. **Optional external detector APIs**  
   - If we integrate Turnitin/ZeroGPT/Copyleaks APIs (or scrape with care), we could use them as the “detector” in the adversarial loop. Legal and ToS constraints apply.

---

## Part 4: What We Should Do — AI Detector

### How our detector works today

- Single Claude call with **DETECTOR_STRUCTURED_SYSTEM**; output is JSON: `overallScore`, `summary`, `flaggedPhrases`.
- No perplexity/burstiness computed in code; we rely on the model to “play detector” from instructions.

### Tier 1: Prompt and output quality

1. **Make the detector prompt more “statistical”**
   - Add explicit guidance: “Prefer higher scores when sentence lengths are very uniform,” “Prefer higher scores when word choices are very common and predictable,” “Prefer lower scores when there are clear rhythm changes and some informal or idiosyncratic wording.”
   - This aligns the model’s scoring with perplexity/burstiness logic even without computing them.

2. **Calibrate scores**
   - Run a small set of known human and known AI samples; compare our `overallScore` to reality. If we systematically overscore or underscore, add a line in the prompt or a linear correction (e.g. `score = Math.min(100, overallScore * 1.2)`).

3. **Flagged phrases as actionable**
   - We already return `flaggedPhrases`. In the UI and in the humanizer feedback loop, we can surface these so users (and the second humanize pass) know exactly what to change.

### Tier 2: Add simple statistical signals (optional)

4. **Compute simple burstiness in code**
   - Sentence lengths (words per sentence); compute variance or a simple “burstiness” index (e.g. std dev of sentence lengths). Pass to the model as context: “Sentence length variance: X (low variance suggests AI).”
   - This doesn’t require a separate classifier; it just gives the LLM one more signal.

5. **Optional: proxy perplexity**
   - If we had a small local LM or an API that returns per-token probabilities, we could compute average perplexity and feed “perplexity: low” into the prompt. Lower priority than burstiness.

### Tier 3: Robustness and UX

6. **Handle edge cases**
   - Very short inputs: clarify in the prompt that &lt; N words should be scored with lower confidence or ask for more text.
   - Code: if `flaggedPhrases` is empty but score is high, still show a clear summary so the user isn’t confused.

7. **Consistency**
   - Same text run twice should give similar scores. We can add “Be consistent: similar texts should get similar scores” and maybe temperature 0 (if not already) for the detector call.

---

## Part 5: Suggested Order of Work

| Phase | Focus | Deliverables |
|-------|--------|---------------|
| **1** | Humanizer prompt + detector prompt | Updated HUMANIZE_SYSTEM (perplexity/burstiness wording, more bans); updated DETECTOR_STRUCTURED_SYSTEM (uniform length, predictability, calibration note). |
| **2** | Detector as a service for humanizer | Internal “run detector on this text” helper; use in humanize flow. |
| **3** | One-shot detector-guided humanize | If detector score &gt; threshold after first humanize, run one more humanize pass with “Score was X% AI; rewrite again focusing on: [flaggedPhrases].” |
| **4** | Two-pass humanize (no detector) | Optional second “stronger” humanize pass; toggle by param or when score high. |
| **5** | Burstiness in detector | Compute sentence-length variance; pass into detector prompt. |
| **6** | Chunked humanize | For long text, humanize by chunk then stitch; document limits and behavior. |

---

## Part 6: References (for later deep dives)

- **Adversarial Paraphrasing:** arxiv.org/abs/2506.07001 — detector-guided paraphrasing, large gains over simple paraphrase.
- **Perplexity & burstiness:** GPTZero blog, detector-checker.ai — what they measure and why.
- **Turnitin:** turnitin.com (AI writing detection); they detect paraphrased and bypass attempts.
- **MASH:** arxiv.org/abs/2601.08564 — multi-stage alignment for style humanization (training).
- **Undetectable AI / commercial humanizers:** Sentence variation, punctuation, word bans, readability/purpose settings; no public detector-in-the-loop detail.

---

## Summary

- **Detectors** rely on perplexity, burstiness, and learned patterns; **humanizers** that only paraphrase once are easy to catch; the best gains come from **varying sentence length and word choice** and from **detector-guided or multi-pass** rewriting.
- **BypassrAI** already has a strong prompt-based humanizer and a structured detector. Next steps: (1) sharpen both prompts with perplexity/burstiness and calibration, (2) add a **one-round detector-guided humanize** pass when the score is high, (3) optionally add a second “stronger” humanize pass and simple **burstiness** in the detector, then (4) consider chunked humanization and long-term training-based improvements.

This plan is ready to implement phase-by-phase when you want to “intensely make the humanizer and AI detector better.”
