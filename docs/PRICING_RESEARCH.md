# BypassrAI — Pricing Research: Free, Paid, Tiers

Research on how current AI humanizer / detector services structure free quotas, paid pricing, and tier features. Use this to set BypassrAI’s plans.

---

## 0. Competitor snapshot (2024–2025)

Direct comparison of similar products (AI humanizer / bypass / detector).

| Service | Free / trial | Paid entry | Words at entry | Mid tier | High tier |
|--------|--------------|------------|----------------|----------|-----------|
| **Undetectable AI** | Free trial, money-back if flagged | $19/mo or $5/mo (annual) | 20K or 10K/mo | — | 35K–380K at $31–$209/mo |
| **Natural Text AI** | — | $5.99 Basic | 10K/mo, 500/request | $15.99 Pro: 20K, 1.5K/request | $34.99 Ultra: 40K, 3K/request |
| **HIX Bypass** | — | $14.99 Standard | 5K/mo | $29.99 Premium: 50K | $59.99 Unlimited |
| **StealthWriter** | 10 humanizations/day, 1K/use | $20 Basic | 20 Ghost Pro/day, 2K/use | $35: 50/day, 3K/use | $50: unlimited, 5K/use |
| **GPTinf** | 3K words free | $19 Lite | 20K/mo | $29 Basic: 50K | $79 Pro: 150K |
| **AI-Text-Humanizer** | 500 words free, 250/process | $19.99 PRO | 50K/mo | — | $59.99 one-time 100K (24 mo) |
| **Humanize.ai** | 5K words/day free, no signup | From $30/mo | Usage-based | — | — |
| **HumanizerPro.ai** | — | $7 Basic | 15K/mo | $12 Pro: 50K | $19 Advanced: 1M |
| **BypassrAI (current)** | 3 uses, 500 words/use (anon); 7-day trial 5K words (signed up) | $9/mo Regular | 10K/mo | (Pro $15 / 25K — planned) | (Premium $25 / 50K — planned) |

**Patterns:**

- **Entry monthly:** Often **$6–20/mo** with **5K–20K words/month**.
- **Annual discount:** Many offer ~50% off (e.g. Undetectable $5/mo annual, Natural Text 50% off annual).
- **Free:** Either small trial (300–500 words), limited uses (e.g. 3), or daily free cap (1K–5K words).
- **Words/request:** Several cap single request (500–3K words) on lower tiers.
- **BypassrAI:** $9/mo for 10K is on the **low end** of price; trial (5K words, 7 days) is competitive with “try then pay” flows.

---

## 1. Free tier patterns

| Service | Free offer | Notes |
|--------|------------|--------|
| **NaturalWrite** | Limited monthly words, no card | Exact free cap not always stated; “try for free.” |
| **QuillBot** | 125 words/paraphrase; **3 humanize uses** (Basic); 1,200 words AI detector | Free = very limited humanizer, then pay. |
| **Undetectable AI** | Free trial (then paid) | Trial then subscription. |
| **GPTZero** | **10,000 words/month** (detector) | Generous free for detector-only. |
| **The Humanizer** | **500 words** free | Freemium then $9/mo. |
| **GPTHuman** | **300 words** free trial | Very small trial. |
| **Humanize.sh** | **200 words/request**, 5 requests/day | ~1,000 words/day free. |
| **AIHumanizer.ai** | **500 words/month** | Monthly free cap. |
| **Humanizer.Pro** | **200 words/month** | Very small free. |

**Takeaways:**  
- Free humanizer limits are often **200–500 words** total or per month, or a **small number of uses** (e.g. 3).  
- **250 words** (our current plan) fits the market: enough to try, not enough for serious use without signup.  
- Some do “free trial” (no card) with a higher limit once signed up; others require card for trial.

---

## 2. Paid pricing (humanizer-focused)

| Service | Monthly price | Words/month | Words/request (if capped) |
|--------|----------------|-------------|----------------------------|
| **NaturalWrite (naturaltextai)** | $5.99 Basic | 10,000 | 500 |
| | $15.99 Pro (popular) | 20,000 | 1,500 |
| | $34.99 Ultra | 40,000 | 3,000 |
| **QuillBot Premium** | ~$8.33/mo (annual) | **Unlimited** humanizer | — |
| **Undetectable AI** | $19/mo | 20,000 | — |
| | $5/mo (annual) | 10,000 | — |
| **The Humanizer** | From $9/mo | — | Freemium |
| **Humanize.sh** | $9.99 Basic | — | — |
| **GPTHuman** | $15/mo Starter | 25,000 | — |
| **HumanizerPro.ai** | $7 Basic | 15,000 | — |
| | $12 Pro | 50,000 | — |
| | $19 Advanced | 1,000,000 | — |
| **AIHumanizer.ai** | $19.99 Basic | 10,000 | — |
| **Humanizer.org** | $19.99 Standard | 8,000 | — |
| | $29.99 Premium | 80,000 | — |

**Takeaways:**  
- **Entry tier** often **$6–10/mo** with **8K–15K words/month**.  
- **Mid tier** often **$15–20/mo** with **20K–50K words**.  
- **High tier** $30–50/mo, 40K–unlimited.  
- QuillBot stands out with **unlimited humanizer** at ~$8.33/mo (annual); most others cap words.

---

## 3. Features by tier (what to copy)

| Feature type | Free | Paid (typical) |
|--------------|------|------------------|
| **Humanizer** | 200–500 words total or 3 uses | 10K–unlimited words/month |
| **Paraphraser** | 125 words/use or limited | Unlimited or higher cap |
| **AI Detector** | 1,200 words or limited | Unlimited or 150K+ |
| **Modes** | 1–2 (Basic only) | More modes (academic, creative, etc.) |
| **Words per request** | 250–500 | 500–3,000 |
| **Support** | Community / none | Email / priority |
| **API** | No | Yes (often higher tier) |
| **No ads / faster** | — | Yes on paid |

For **MVP** we can keep it simple: free = 250 words (no account); trial = more words (no card); paid = one or two tiers with word cap and “all tools.”

---

## 4. Recommended structure for BypassrAI

Based on the research, a simple and competitive setup:

### 4.1 Tiers (locked)

| Tier | Who | Words / duration | Per-use limit | Price | Notes |
|------|-----|-------------------|---------------|--------|--------|
| **Free (no account)** | Anonymous | **250 words max per use**, **3 uses total** | 250 words/paste | $0 | Cookie/fingerprint. Max 750 words total. |
| **Free trial (signed up)** | New user, no card | **2,000 words** and/or **7 days** | Same as Regular | $0 | Internal trial (no Stripe). Whichever hits first. |
| **Regular** | Subscriber | **10,000 words/month** | **1,500 words/request** | **$9/mo** | All tools share same pool. |
| **Pro** | Subscriber | **25,000 words/month** | **3,000 words/request** | **$15/mo** | All tools share same pool. |
| **Premium** | Subscriber | **50,000 words/month** | **5,000 words/request** | **$25/mo** | All tools share same pool. |

**Per-use limit:** API can handle large input (Claude 200K context), but very long single requests = higher cost, slower response, serverless timeout risk. Caps (1,500 / 3,000 / 5,000 by tier) keep latency and cost predictable.  

### 4.2 Features per tier (MVP)

| Feature | Free (anon) | Trial (signed up) | Paid ($9/mo) |
|---------|-------------|-------------------|--------------|
| Humanizer | ✓ (250 words total) | ✓ (2,000 words trial) | ✓ (10,000 words/mo) |
| Paraphraser | ✓ (same 250-word pool) | ✓ (same trial pool) | ✓ (same 10K pool) |
| AI Detector | ✓ (same 250-word pool) | ✓ (same trial pool) | ✓ (same 10K pool) |
| Account / history | — | ✓ | ✓ |
| Manage subscription | — | — | ✓ (Stripe Portal) |

**MVP:** One shared word pool per user (anonymous, trial, or paid). No “per-tool” caps; no separate “Pro” features (e.g. advanced mode) — add later if needed.

### 4.3 Optional: second paid tier (post-MVP)

| Tier | Words/month | Price | When |
|------|-------------|--------|------|
| **Basic** | 10,000 | $9/mo | MVP |
| **Pro** | 25,000 or 30,000 | $15–19/mo | When you want “most popular” tier like NaturalWrite Pro. |

---

## 5. Why is QuillBot so cheap?

QuillBot offers **unlimited** humanizer at ~**$8.33/mo** (annual). Reasons they can do that:

1. **Scale** — Huge user base; they likely have negotiated rates with LLM providers or use cheaper / in-house models for some tasks.
2. **Annual billing** — $8.33/mo = $100/year upfront; most users pay annually, so QuillBot gets cash upfront and lower churn.
3. **Usage curve** — Most users don't hit "unlimited"; heavy users are a minority, so average cost per subscriber is manageable.
4. **Product mix** — Paraphraser, grammar, plagiarism, etc. spread revenue; humanizer is one feature.

**For us:** We're new, so word caps protect margin and keep unit economics predictable. We can add an "unlimited" or high-cap tier later at a higher price (e.g. $20–30/mo) once we have scale and data.

---

## 6. Summary

- **Free (no account):** 250 words max per use, 3 uses total (max 750 words).  
- **Free trial (signed up):** 2,000 words and/or 7 days, no card — internal trial in Supabase.  
- **Paid (MVP):** One tier, **$9/mo, 10,000 words/month**, all three tools (humanize, paraphrase, detector) share the same pool.  
- **Features:** No tiered feature list for MVP — only word limits. Add “Pro” tier (e.g. $15–19/mo, 25K–30K words) and per-request caps later if you want to match NaturalWrite/Undetectable more closely.

---

*Document version: 1.0 — Research and recommendation for BypassrAI plans.*
