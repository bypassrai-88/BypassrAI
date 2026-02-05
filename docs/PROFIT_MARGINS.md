# BypassrAI — Profit Margin Analysis (Max Word Usage)

Analysis of **profit margins per paid tier** if subscribers use the **maximum words** they get each month. Assumptions and numbers below; update when pricing or usage changes.

---

## 1. Assumptions

| Item | Value | Notes |
|------|--------|--------|
| **LLM** | Claude 3.5 Sonnet (Anthropic) | One API for humanize, paraphrase, detector, summarizer, grammar, translator. |
| **Input price** | $6.00 per million tokens | Anthropic list price (check [pricing](https://www.anthropic.com/pricing) for latest). |
| **Output price** | $30.00 per million tokens | Same. |
| **Words → tokens** | ~1.3 tokens per word (English) | Input and output are similar length for rewrite/summarize/translate. |
| **Cost per 1,000 words** | ~**$0.047** | 1,300 input + 1,300 output tokens: (1.3/1e6)×6 + (1.3/1e6)×30 ≈ $0.047. |
| **Stripe** | 2.9% + $0.30 per successful charge | US; adjust for your region if needed. |
| **Other costs** | $0 for this analysis | Hosting (Vercel), DB (Supabase) on free tiers; ignore for per-sub margin. |

**Note:** If Anthropic pricing is lower (e.g. $3 input / $15 output), cost per 1,000 words ≈ $0.023; margins below improve by roughly 2–3 percentage points.

---

## 2. Tiers and Max Words (current)

| Tier | Price | Max words/month |
|------|--------|------------------|
| **Lite** | $4.99/mo | 5,000 |
| **Pro** | $9.99/mo | 25,000 |
| **Premium** | $25/mo | 250,000 |

---

## 3. Cost at Max Usage (If They Use Every Word)

### 3.1 API cost (Claude)

| Tier | Max words | Cost per 1,000 words | **API cost** |
|------|-----------|----------------------|--------------|
| Lite | 5,000 | $0.047 | **$0.24** |
| Pro | 25,000 | $0.047 | **$1.18** |
| Premium | 250,000 | $0.047 | **$11.75** |

### 3.2 Stripe fee (per transaction)

| Tier | Price | 2.9% | + $0.30 | **Stripe fee** |
|------|--------|------|---------|----------------|
| Lite | $4.99 | $0.14 | $0.30 | **$0.44** |
| Pro | $9.99 | $0.29 | $0.30 | **$0.59** |
| Premium | $25.00 | $0.73 | $0.30 | **$1.03** |

### 3.3 Total cost at max usage

| Tier | API cost | Stripe fee | **Total cost** |
|------|----------|------------|----------------|
| Lite | $0.24 | $0.44 | **$0.68** |
| Pro | $1.18 | $0.59 | **$1.77** |
| Premium | $11.75 | $1.03 | **$12.78** |

---

## 4. Profit and Margin at Max Usage

| Tier | Revenue | Total cost | **Profit** | **Margin** |
|------|---------|------------|------------|------------|
| **Lite** | $4.99 | $0.68 | **$4.31** | **~86%** |
| **Pro** | $9.99 | $1.77 | **$8.22** | **~82%** |
| **Premium** | $25.00 | $12.78 | **$12.22** | **~49%** |

- **Lite and Pro:** Even at max usage you keep **~82–86%** gross margin.
- **Premium:** At full 250K words, API cost is high, so margin drops to **~49%** — still profitable; most Premium users will use less than the cap, so blended margin will be higher.

---

## 5. Sensitivity

- **Lower API price** (e.g. $3 / $15 per million): Cost per 1,000 words ≈ $0.023; margins rise to ~90–91% at max usage.
- **Higher usage mix** (e.g. summarizer = shorter output): API cost per “word” of input is lower; margins improve.
- **Heavy translator/long output:** Output tokens can exceed input; cost per 1,000 words can be higher; margins a bit lower than above.
- **Stripe:** If you add annual billing (e.g. pay once per year), you pay Stripe once per year instead of 12×; effective fee per month goes down and margin goes up.

---

## 6. Summary

| Tier | At max words: profit | At max words: margin |
|------|----------------------|----------------------|
| Lite ($4.99) | **~$4.31** | **~86%** |
| Pro ($9.99) | **~$8.22** | **~82%** |
| Premium ($25) | **~$12.22** | **~49%** |

**Bottom line:** Lite and Pro stay **~82–86%** margin at max usage. Premium at full 250K words is **~49%** (API cost scales with words); in practice many Premium users won’t hit the cap, so blended margin will be higher.

---

## 7. Premium stack: better LLM + real detector API

If you switch to a **more expensive LLM** (e.g. Claude 3 Opus for humanize/paraphrase) and a **real AI detector API** (e.g. GPTZero) instead of Claude + prompt-based detector, costs go up. Margins drop but stay healthy.

### 7.1 Assumptions (premium stack)

| Item | Value | Notes |
|------|--------|--------|
| **Humanize / paraphrase / summarizer / grammar / translate** | Claude 3 Opus (or similar) | $15 input / $75 output per million tokens → **~$0.117 per 1,000 words** (2.5× Sonnet). |
| **AI detector** | GPTZero API | ~$45/mo for 300k words → **~$0.15 per 1,000 words** (check [GPTZero developers](https://gptzero.me/developers) for latest). |
| **Usage mix** | 50% rewrite, 50% detect | Half of quota used for humanize/etc. (Opus), half for “Check for AI” (GPTZero). Worst-case for cost. |
| **Stripe** | Same | 2.9% + $0.30. |

### 7.2 Cost at max usage (premium stack)

| Tier | Max words | 50% Opus (rewrite) | 50% GPTZero (detect) | **API cost** | Stripe | **Total cost** |
|------|-----------|--------------------|----------------------|--------------|--------|----------------|
| Lite | 5,000 | 2.5K × $0.117 = $0.29 | 2.5K × $0.15 = $0.38 | **$0.67** | $0.44 | **$1.11** |
| Pro | 25,000 | 12.5K × $0.117 = $1.46 | 12.5K × $0.15 = $1.88 | **$3.34** | $0.59 | **$3.93** |
| Premium | 250,000 | 125K × $0.117 = $14.63 | 125K × $0.15 = $18.75 | **$33.38** | $1.03 | **$34.41** |

### 7.3 Profit and margin (premium stack, max usage)

| Tier | Revenue | Total cost | **Profit** | **Margin** |
|------|---------|------------|------------|------------|
| **Lite** | $4.99 | $1.11 | **$3.88** | **~78%** |
| **Pro** | $9.99 | $3.93 | **$6.06** | **~61%** |
| **Premium** | $25.00 | $34.41 | **-$9.41** | **loss** |

With a premium API stack, Premium at **full** 250K words would lose money; you’d need a higher price or lower cap for that tier if you switch to Opus + GPTZero.

### 7.4 Comparison

| Stack | Lite margin | Pro margin | Premium margin |
|-------|-------------|------------|----------------|
| **Current** (Claude Sonnet + prompt detector) | **~86%** | **~82%** | **~49%** |
| **Premium** (Opus + GPTZero, 50/50 mix) | **~78%** | **~61%** | loss at max |

If the mix is more rewrite-heavy (e.g. 70% Opus, 30% GPTZero), API cost drops and margins move up a few points. If you use Sonnet for most tools and only GPTZero for “Check for AI,” margins sit between the two rows above.

---

*Document version: 1.1 — Added premium stack (Opus + GPTZero) margin analysis.*
