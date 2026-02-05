# Humanizer Game Plan: How to Actually Beat AI Detectors

## The Problem

Our current humanizer is basically doing sophisticated paraphrasing. The output:
- Follows the same structure as the input
- Uses similar sentence boundaries
- Swaps words but keeps the same "flow"
- Still has AI tells (em dashes, balanced rhythm, clean prose)

**Result:** Detectors still flag it because paraphrasing doesn't change the underlying statistical patterns.

---

## What We Learned From Research

### How Detectors Actually Work

| Metric | What It Measures | AI Text | Human Text |
|--------|------------------|---------|------------|
| **Perplexity** | How predictable each word is | Low (common, expected words) | High (surprising, varied words) |
| **Burstiness** | Variation in sentence length/structure | Low (uniform 12-18 word sentences) | High (mix of 5 and 25+ word sentences) |
| **Patterns** | Statistical fingerprints from training | Present | Absent |

### What Actually Works (Research-Backed)

1. **DIPPER Model** (11B parameter fine-tuned T5)
   - Two control knobs: **lexical diversity** (0-100) and **order diversity** (0-100)
   - Reduced DetectGPT accuracy from 70.3% → 4.6%
   - Key insight: It does **discourse-level** paraphrasing (paragraphs, not sentences)
   - Key insight: It **reorders content**, not just swaps words

2. **Adversarial Paraphrasing** (arxiv 2506.07001)
   - Uses the detector itself to guide rewriting
   - **87.88% average reduction** in detection across all detector types
   - Simple paraphrasing: only 8-15% improvement
   - Detector-guided: 64-99% improvement
   - Key insight: **Iterate with detector feedback**

3. **Commercial Tools That Actually Work** (2025 testing)
   - Only 2 of 16 tested tools passed all tests
   - StealthGPT and WriteHuman were top performers
   - Most tools (including GPTinf) fail independent testing despite marketing claims

4. **What Makes Text "Human"**
   - Fragments and incomplete sentences
   - Starting with "And" or "But"
   - Parenthetical asides
   - Uneven paragraph lengths
   - Occasional run-ons
   - Abrupt endings
   - Less predictable word choices
   - Mixed sentence lengths (some 5 words, some 30)

---

## The Game Plan

### Phase 1: Fix the Prompt (Quick Wins)

**Problem:** Our prompt tells the model what to do but doesn't enforce it.

**Solution:** Make the prompt shorter, more forceful, and include a self-check step.

```
BEFORE: Long list of rules the model ignores
AFTER: 3 hard rules with explicit failure conditions + examples
```

**Specific changes:**
1. Remove em dashes in post-processing (don't rely on the model)
2. Add temperature/sampling parameters to increase unpredictability
3. Add a "rewrite from memory" framing instead of "rewrite this text"

### Phase 2: Post-Processing Pipeline

**Add server-side transformations after the model responds:**

1. **Em dash removal** — Replace all `—` with `. ` or `, ` programmatically
2. **Sentence length variance check** — If sentences are too uniform, flag for retry
3. **Banned word scan** — If output contains banned words, strip or retry
4. **Structure comparison** — If paragraph count matches input exactly, merge some

### Phase 3: Detector-Guided Iteration (The Big Win)

**This is what actually works according to research.**

Flow:
```
Input text
    ↓
Humanize (pass 1)
    ↓
Run our AI detector
    ↓
If score > 40%:
    ↓
    Extract flagged phrases
    ↓
    Humanize again with guidance:
    "This text scored 65% AI. Focus on rewriting these phrases: [list].
     Make the rhythm more uneven. Add a fragment. Change the structure."
    ↓
    Run detector again
    ↓
    If still > 40%, one more pass (max 3 total)
    ↓
Output final text
```

**Why this works:** The detector tells us exactly what's still AI-like, and we fix those specific things.

### Phase 4: Advanced Techniques (Later)

1. **Lexical diversity scoring** — Measure how different the output words are from input
2. **Sentence boundary rewriting** — Force different sentence breaks from input
3. **Chunk-based humanization** — For long text, humanize in overlapping chunks to preserve local variation
4. **Consider DIPPER integration** — The 11B model is open source on HuggingFace; could run as a secondary pass or API

---

## Immediate Action Items

### Right Now (Phase 1)

- [ ] **Add post-processing em dash removal** — Guaranteed no em dashes
- [ ] **Increase temperature** — Make output less predictable
- [ ] **Shorten the prompt** — Focus on 3 core rules, not 20
- [ ] **Add "write from memory" framing** — Change the task from "rewrite" to "explain the same thing differently"

### This Week (Phase 2)

- [ ] **Build detector-guided loop** — Call our detector on output, retry if score high
- [ ] **Add structure comparison** — Reject outputs that mirror input structure
- [ ] **Measure improvement** — Test same passages before/after changes

### Later (Phase 3-4)

- [ ] **Explore DIPPER** — Test if we can use it as a preprocessing step
- [ ] **Build scoring dashboard** — Track how well humanized text passes detectors
- [ ] **Consider fine-tuning** — If prompting hits ceiling, may need custom model

---

## Technical Implementation Notes

### Em Dash Post-Processing (add to route.ts)

```typescript
function stripEmDashes(text: string): string {
  // Replace em dashes with period + space or comma + space
  return text
    .replace(/—/g, '. ')  // or ', ' depending on context
    .replace(/\.\s+\./g, '.') // clean up double periods
    .replace(/,\s+,/g, ',');  // clean up double commas
}
```

### Detector-Guided Loop (pseudocode)

```typescript
async function humanizeWithFeedback(text: string): Promise<string> {
  let result = await humanize(text);
  let score = await detectAI(result);
  
  if (score.overallScore > 40) {
    const guidance = `This text still scores ${score.overallScore}% AI. 
      Flagged phrases: ${score.flaggedPhrases.join(', ')}.
      Rewrite more aggressively. Change the structure. Add fragments.`;
    result = await humanize(result, guidance);
    score = await detectAI(result);
  }
  
  if (score.overallScore > 40) {
    // One more try
    result = await humanize(result, "Maximum human mode. Completely different structure.");
  }
  
  return stripEmDashes(result);
}
```

### Temperature Setting

In the API call:
```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 2048,
  temperature: 0.9, // Higher = more random/human-like
  system: HUMANIZE_SYSTEM,
  messages: [{ role: "user", content: text }],
});
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| GPTZero score on humanized text | 60-80% AI | <30% AI |
| Turnitin AI score | Unknown | <25% AI |
| Em dashes in output | Sometimes | Zero |
| User satisfaction | Low | High |

---

## Summary

**The core insight:** Paraphrasing doesn't work. You need to:

1. **Change structure** (paragraph count, sentence boundaries, topic order)
2. **Increase perplexity** (less predictable word choices)
3. **Increase burstiness** (vary sentence lengths dramatically)
4. **Use detector feedback** (iterate until the score drops)
5. **Post-process** (guarantee no em dashes, banned words)

We can do all of this with our current stack. The detector-guided loop is the biggest win — research shows it's 5-10x more effective than simple paraphrasing.
