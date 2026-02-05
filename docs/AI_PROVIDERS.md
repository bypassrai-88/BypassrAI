# BypassrAI — AI Providers: Humanizer & Detector

Recommendations and **locked choice for MVP:** one API (Anthropic Claude 3.5 Sonnet) for **humanize**, **paraphrase**, and **AI detector** (prompt-based). Add a dedicated detector API (e.g. GPTZero) later when we want best accuracy.

---

## 0. Do other humanizers / detectors use AI APIs?

- **Humanizers:** Many commercial humanizers use **LLM APIs** (OpenAI, Anthropic, or wrappers) with rewrite prompts — same idea as us: “rewrite this to sound human.” Some use their own fine-tuned models; the API approach is common and keeps things simple.
- **Detectors:** Dedicated detectors (e.g. GPTZero, Copyleaks) usually use **their own trained models** (deep learning on human + AI text, sentence-level classification, perplexity/burstiness). They are **not** “just a chat API” — they’re purpose-built. We can still do a **prompt-based** detector with our same LLM for a simple start; it’s less accurate but one provider, one key.

---

## 1. Humanizer: Which model?

### 1.1 Research summary

- **Best for natural, human-like rewriting:** **Claude 3.5 Sonnet** (Anthropic). Consistently ranks highest for writing quality, natural voice, and “sounds human” — important for bypassing detectors. Slightly more expensive than GPT-4o but better for this use case.
- **Best balance of cost + quality:** **Claude 3.5 Sonnet**. Good price-to-quality for writing; ~$3–15 per million tokens (input/output). GPT-4o is faster and a bit cheaper; Claude edges ahead for nuanced prose.
- **Cheapest usable option:** **GPT-4o-mini** (OpenAI). Roughly half the cost of Claude Haiku per token; good for high volume if you’re willing to trade a bit of “human” feel for cost. Claude 3 Haiku is also cheap but GPT-4o-mini is often cheaper per request.

### 1.2 Recommendation

| Goal | Model | Why |
|------|--------|-----|
| **Best humanizing quality** | **Claude 3.5 Sonnet** | Best natural voice and writing quality; best chance to pass detectors. |
| **Best balance (affordable + reliable/good)** | **Claude 3.5 Sonnet** | Same as above; cost is still pay-per-token with no monthly minimum. |
| **Cheapest** | **GPT-4o-mini** | Lowest cost per 250 words; quality is good but not quite as “human” as Claude Sonnet. |

**Suggested default for MVP:** **Claude 3.5 Sonnet** (Anthropic). If cost becomes an issue, add a fallback or option to use GPT-4o-mini for high-volume tiers.

### 1.3 Test before locking in

We have a script so you can run the same sample text through several models and compare output + cost locally:

- **Script:** `scripts/test-humanizer-models.mjs`
- **How:** Set `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in `.env.local` (or env), then run `node scripts/test-humanizer-models.mjs`.
- **What it does:** Sends a short sample through GPT-4o-mini, GPT-4o, Claude 3.5 Haiku, and Claude 3.5 Sonnet with a humanize prompt; prints each result and estimated cost so you can pick the best balance for you.

---

## 2. AI Detector: Do third-party detectors have APIs?

**Yes.** Several major detectors offer developer APIs:

| Provider | API? | Pricing (approx) | Notes |
|----------|------|------------------|--------|
| **GPTZero** | Yes | From ~$45/mo for 300k words; more at scale. | [Developers](https://gptzero.me/developers), [API docs](https://gptzero.stoplight.io). Used by Microsoft, NewsGuard, etc. In benchmarks ~99% accuracy, low false positive rate. |
| **Copyleaks** | Yes | Custom / enterprise. | [API](https://copyleaks.com/api). AI detection + plagiarism. SDKs for Node, Python, etc. |
| **Originality.ai** | Yes | Pay-as-you-go ~$30 for 3k credits (1 credit = 100 words); Pro ~$13–15/mo for 2k credits/mo. API on higher plans. | [API docs](https://docs.originality.ai/). Check current plan for API access (e.g. Monthly/Enterprise). |

So you can **use a third-party detector API** (GPTZero is a strong choice for accuracy and reliability) and keep your “Check for AI” feature backed by a dedicated detector.

---

## 3. Can we create our own detector with an AI API?

**Yes, in two ways:**

### 3.1 Prompt-based detector (LLM API)

- **Idea:** Send the text to an LLM with a prompt like: “Rate from 0–100 how likely this text is to be AI-generated. Reply with only a number.” (or “human / mixed / AI”).
- **Pros:** Cheap (same LLM you use for humanize), no extra vendor, easy to add.
- **Cons:** LLMs are not trained to be detectors; accuracy and consistency are lower than dedicated detectors. Risk of false positives/negatives and gaming.

**Verdict:** OK for an MVP “rough guess” or placeholder. For “best detector,” use a **third-party API** (e.g. GPTZero).

### 3.2 Proper detector (research-style)

- **Idea:** Use methods like DetectGPT (probability curvature), Binoculars (contrastive scoring), or similar — usually need log-probabilities from models or separate classifier models.
- **Pros:** Can be very accurate (e.g. 90%+ in papers).
- **Cons:** More engineering (custom pipeline, possibly different infra). Not “just call one LLM API.”

**Verdict:** Not recommended for MVP. Use a **third-party API** first; revisit DIY only if you have specific needs (e.g. on-prem, custom models).

---

## 4. Detector recommendation

| Option | Use when |
|--------|----------|
| **GPTZero API** | You want the **best balance of accuracy and reliability** and are OK with ~$45/mo for 300k words. Best supported “detector API” choice. |
| **Originality.ai API** | You want a lower entry cost (e.g. pay-as-you-go or smaller monthly plan). Confirm API is included on the plan you choose. |
| **DIY prompt-based (LLM)** | MVP “good enough” or placeholder: cheap, one API key, but **not** as reliable as dedicated detectors. |
| **DIY research-style** | Later, only if you need a custom detector and have engineering time. |

**Suggested path:**  
- **MVP:** Either **GPTZero API** (best detector) or **DIY prompt-based** (cheapest; e.g. “X% AI” from Claude/GPT).  
- **Later:** If you started with DIY, you can add GPTZero (or another API) when you want “best detector” and have budget.

---

## 5. Locked choice: one API for all (MVP)

**Decision:** At the start, use **one provider and one model for everything** to keep it simple.

| Use case    | MVP implementation |
|------------|---------------------|
| **Humanizer**  | **Claude 3.5 Sonnet** (Anthropic) — rewrite prompt. |
| **Paraphraser**| **Same Claude 3.5 Sonnet** — paraphrase prompt. |
| **AI Detector**| **Same Claude 3.5 Sonnet** — prompt-based (e.g. “Rate 0–100 how likely this text is AI-generated. Reply with only a number.”). |

- **One API key:** `ANTHROPIC_API_KEY` only (no OpenAI or GPTZero at first).
- **Later:** Add a dedicated detector API (e.g. GPTZero) when we want best accuracy; humanizer and paraphraser stay on Claude.

---

## 6. Summary

- **Humanizer:** **Claude 3.5 Sonnet** (Anthropic) — best “human” voice for bypassing detectors.
- **Paraphraser:** Same Claude 3.5 Sonnet, different prompt.
- **Detector (MVP):** Same Claude 3.5 Sonnet, prompt-based score (0–100 or similar). **Later:** add GPTZero (or similar) API for best detector.
- **Other humanizers** often use LLM APIs like this; **dedicated detectors** usually use their own models — we keep it simple with one API for all at the start.

---

*Document version: 1.1 — One API for all (Claude 3.5 Sonnet); add detector API later.*
