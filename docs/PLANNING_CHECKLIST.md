# BypassrAI — What’s Left to Plan

Use this as the master list of things to decide and implement. Auth is already documented in [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md); below are **AI API**, **Stripe/pricing**, and **everything else** to plan out.

---

## 1. AI API (Humanizer, Paraphraser, Detector)

**Locked for MVP:** **One API for all** — Anthropic **Claude 3.5 Sonnet** for humanize, paraphrase, and detector (prompt-based). One key (`ANTHROPIC_API_KEY`). Add a dedicated detector API (e.g. GPTZero) later. See [AI_PROVIDERS.md](./AI_PROVIDERS.md).

### 1.1 Humanizer

| Decide | Options / notes |
|-------|------------------|
| **Provider / model (locked)** | **Claude 3.5 Sonnet** (Anthropic). Best “human” voice for bypassing detectors. |
| **Prompt** | System: “Rewrite this text so it sounds human-written while keeping the same meaning. Vary sentence structure and word choice; avoid patterns that AI detectors flag.” User = raw text. |
| **Where** | `POST /api/humanize` — check quota → call Claude → return result → increment usage. |

### 1.2 Paraphraser

| Decide | Options / notes |
|-------|------------------|
| **API (locked)** | **Same Claude 3.5 Sonnet.** Different system prompt: “Paraphrase this text in your own words. Keep the meaning; change wording and structure.” |
| **Route** | `POST /api/paraphrase` — same quota/usage logic as humanize (shared or separate pool). |

### 1.3 AI Detector (“Check for AI”) — MVP

| Decide | Options / notes |
|-------|------------------|
| **MVP (locked)** | **Same Claude 3.5 Sonnet**, prompt-based. E.g. system: “You are an AI detector. Rate from 0 to 100 how likely the user’s text is to be AI-generated. Reply with only a number.” User = text. Return that number as “AI score” (e.g. “X% AI”). |
| **Later** | Add **GPTZero** (or similar) API when we want best detector accuracy; keep humanizer/paraphraser on Claude. |

**Summary:** One provider (Anthropic), one model (Claude 3.5 Sonnet), one key for humanize, paraphrase, and detector. Implement detector API later for best accuracy.

---

## 2. Pricing & Stripe

**See [PRICING_RESEARCH.md](./PRICING_RESEARCH.md)** for competitor research and rationale.

### 2.1 Plans (locked)

| Plan | Words / duration | Per-use limit | Price | Notes |
|------|-------------------|---------------|--------|--------|
| **Free (no account)** | **250 words max per use**, **3 uses total** | 250 words/paste | $0 | Anonymous; cookie/fingerprint. Max 750 words total (3 × 250). |
| **Free trial (signed up)** | **2,000 words** and/or **7 days** | Same as Regular | $0 | Internal trial (no Stripe, no card). Whichever hits first. |
| **Regular** | **10,000 words/month** | **1,500 words/request** (recommended) | **$9/mo** | All tools share same pool. |
| **Pro** | **25,000 words/month** | **3,000 words/request** (recommended) | **$15/mo** | All tools share same pool. |
| **Premium** | **50,000 words/month** | **5,000 words/request** (recommended) | **$25/mo** | All tools share same pool. |

**Per-use limit (why):** The API (Claude) can handle large inputs (200K-token context), but very long single requests = higher cost, slower response, and risk of serverless timeout (e.g. Vercel 10–60s). Capping **per request** (1,500 / 3,000 / 5,000 by tier) keeps latency and cost predictable. You can relax or remove caps later if needed.

### 2.2 Stripe setup (implementation)

| Item | Notes |
|------|--------|
| **Products & Prices** | In Stripe Dashboard: create Products + Prices for **Regular** ($9/mo), **Pro** ($15/mo), **Premium** ($25/mo). Trial (no card) = internal in Supabase; or Stripe trial if preferred. |
| **Checkout** | User clicks “Subscribe” → redirect to Stripe Checkout (prebuilt page). Success/cancel URLs back to your app. |
| **Customer Portal** | “Manage subscription” link opens Stripe Customer Portal (cancel, update payment). No custom billing UI needed for MVP. |
| **Webhooks** | Endpoint: `POST /api/webhooks/stripe`. Subscribe to: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` (optional). Verify signature with `STRIPE_WEBHOOK_SECRET`; update Supabase: `stripe_customer_id`, `stripe_subscription_id`, `status`, `period_end`, `plan_id`. |
| **Trial strategy** | (A) Internal trial: no Stripe until they upgrade; track “trial_ends_at” and “trial_words_used” in Supabase. (B) Stripe trial: create Customer at signup with a $0 subscription and trial period; Stripe sends webhooks when trial ends. (A) = simpler and no card required for trial. |

### 2.3 Where subscription state lives

- **Supabase table** (e.g. `subscriptions` or columns on `users`): `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `status` (active, trialing, canceled, etc.), `current_period_end`, `cancel_at_period_end`.
- API routes: before allowing humanize/paraphrase, read this row and check `status` + `current_period_end` and word usage for the period.

**Summary:** Free = 250 words/use, 3 uses (anon). Trial = 2K words or 7 days (signed up, no card). Paid = Regular $9/10K, Pro $15/25K, Premium $25/50K; recommend per-request caps (1,500 / 3,000 / 5,000). Stripe for checkout and portal; webhooks keep Supabase in sync.

---

## 3. Anonymous Tracking (free tier: 250 words/use, 3 uses)

| Decide | Options / notes |
|--------|------------------|
| **How to identify anonymous user** | (A) Cookie: set a UUID in a long-lived cookie; key usage by that ID. (B) Fingerprint: e.g. FingerprintJS; key usage by fingerprint hash. Cookie is simpler. |
| **What to store** | Supabase table e.g. `anonymous_usage`: `anonymous_id`, `uses_count` (integer, max 3), `words_used` (integer; optional for analytics). Each use: max 250 words; increment `uses_count`; block after 3 uses. |
| **Reset?** | No reset for MVP — 3 uses total per anonymous identity. Optional later: reset per day or per IP. |

---

## 4. Rate Limiting

| Decide | Options / notes |
|--------|------------------|
| **Do we need it?** | Yes, to prevent abuse and control AI API cost. |
| **Where** | (A) Vercel: edge middleware or serverless function limits. (B) Upstash Redis (serverless, free tier): increment key per IP or per user; reject if over N requests per minute. (C) Simple: in API route, check DB for “requests in last 1 min” per IP — no Redis. |
| **Recommendation** | MVP: simple per-IP or per-user limit in API route (e.g. 10 humanize requests per minute). Add Upstash later if needed. |

---

## 5. Environment Variables / Secrets

List to create (e.g. in Vercel and `.env.local`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public; safe for client). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; for admin operations or reading auth in webhooks. Optional if you only use anon + user JWT. |
| `STRIPE_SECRET_KEY` | Server-only; Stripe API (create Checkout session, etc.). |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side if you use Stripe.js (e.g. Customer Portal redirect). |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | Server-only; LLM calls. |

---

## 6. Error Handling & Edge Cases

| Scenario | Plan |
|----------|------|
| Humanizer API fails (LLM timeout, rate limit) | Return 502/503 and a friendly message; don’t increment usage. Optionally log for debugging. |
| Quota exceeded | Return 403 with code e.g. `QUOTA_EXCEEDED`; frontend shows paywall / “Create account” or “Upgrade.” |
| Invalid or expired session | Return 401; frontend redirect to login. |
| Stripe webhook fails (e.g. DB update fails) | Log; return 500 so Stripe retries. Idempotent handlers (e.g. upsert by `subscription_id`) to avoid double updates. |

---

## 7. Email (Optional for MVP)

| Need | Options |
|------|---------|
| Password reset | Supabase handles it (sends email via Supabase SMTP or custom SMTP). |
| Welcome email | Optional; Resend, SendGrid, or Supabase Edge Function. |
| Trial ending / payment failed | Stripe can send “invoice payment failed”; optional: your own “Trial ending soon” email. |

**Recommendation:** MVP = Supabase password reset only. Add welcome/trial emails later.

---

## 8. Account Page

| Decide | Notes |
|--------|--------|
| **What to show** | Email (from Supabase auth), current plan (from Supabase `subscriptions` or `users`), “Manage subscription” button → Stripe Customer Portal. Optional: “Words used this period.” |
| **Where** | e.g. `/account` or `/dashboard`. Header: “Account” link when logged in. |

---

## 9. Data / Privacy (for Privacy Policy)

Decide and document:

- **Pasted text:** Do we store it? For how long? (MVP: don’t store humanizer input/output long-term to reduce liability; or store only for “history” if user is logged in and we add that feature.)
- **Anonymous usage:** We store `anonymous_id` + word count; no PII. Say so in privacy policy.

---

## 10. Order of Implementation (recap)

1. **Env + Supabase** — Project, tables (users/subscriptions, anonymous_usage), Auth (email + Google).
2. **Auth UI** — Login, signup, Google, forgot password; protect routes; session in API routes.
3. **Anonymous quota** — Cookie or fingerprint; `anonymous_usage` table; enforce in API.
4. **Humanizer API** — One LLM provider, one prompt; `POST /api/humanize` with quota check and usage increment.
5. **Paraphraser API** — Same LLM, paraphrase prompt; `POST /api/paraphrase`.
6. **Stripe** — Products, Prices, Checkout, webhooks; Supabase subscription state; “Manage subscription” → Portal.
7. **Trial + paid quota** — Logic in API: if user, read subscription + usage; allow or deny.
8. **AI Detector** — Mock or third-party API; `POST /api/ai-check` (optional for MVP).
9. **Rate limiting** — Simple per-IP or per-user limit in API.
10. **Account page** — Email, plan, link to Stripe Portal.
11. **Polish** — Error messages, paywall copy, Privacy/Terms content.

---

*Document version: 1.0 — Planning checklist. Update as you decide each item.*
