# BypassrAI — Build Checklist (What’s Needed for Launch)

Single checklist for **fully secure** setup, **backend API**, **AI API**, **Stripe**, **rate limiting**, and everything else. Tick off as you go. Details live in [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md), [PLANNING_CHECKLIST.md](./PLANNING_CHECKLIST.md), and [TECH_STACK.md](./TECH_STACK.md).

---

## 1. Environment & secrets

- [ ] **Supabase project** — Create project; get URL + anon key (+ service role if needed for webhooks).
- [ ] **Stripe account** — Get secret key, publishable key, webhook secret (after creating webhook endpoint).
- [ ] **Anthropic API key** — For Claude 3.5 Sonnet (humanize, paraphrase, detector, summarizer, grammar, translator).
- [ ] **Env vars** — Set in Vercel and `.env.local`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (optional; for server-only auth in webhooks)
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `ANTHROPIC_API_KEY`

---

## 2. Database (Supabase)

- [ ] **Tables** — Create in Supabase:
  - [ ] `anonymous_usage` — `anonymous_id`, `uses_count` (max 3), optional `words_used`, `updated_at`.
  - [ ] `users` or extend auth — `user_id`, `stripe_customer_id`, `trial_ends_at`, `trial_words_used`, etc., or separate `subscriptions` table.
  - [ ] `subscriptions` (or columns on users) — `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `status`, `current_period_end`, `cancel_at_period_end`.
  - [ ] `usage` — `user_id`, `period_start` (e.g. month), `words_used` (for paid/trial monthly count).
- [ ] **RLS / security** — Row Level Security so users only read/write their own rows; service role for webhooks.

---

## 3. Auth (Supabase Auth)

- [ ] **Email + password** — Sign up, log in, forgot password (Supabase `signUp`, `signInWithPassword`, `resetPasswordForEmail`).
- [ ] **Google OAuth** — Enable in Supabase Dashboard → Authentication → Providers → Google; add client ID/secret. Frontend: “Sign in with Google” / “Sign up with Google” using `signInWithOAuth({ provider: 'google' })`.
- [ ] **Session in API** — Use `@supabase/ssr`; in each API route create Supabase client from cookies, call `getUser()`; use `user.id` for quota and usage.
- [ ] **Auth UI** — Wire login, signup, forgot-password pages to Supabase; redirect after Google OAuth; optional “Signed in as …” and Log out in header.

---

## 4. Secure input handling (no “file upload” for MVP — text only)

- [ ] **Validate/sanitize text** — Max length per request (e.g. 1,500 / 3,000 / 5,000 words by tier); trim; reject empty or oversized.
- [ ] **Word count** — Count words server-side before calling AI; enforce per-use and monthly limits.
- [ ] **HTTPS only** — Enforce in Vercel/hosting (default). No storing pasted text long-term for MVP (or only for “history” if you add it later); document in Privacy Policy.
- [ ] **No executable content** — Paste is plain text; no HTML/script execution. If you ever add file upload, validate type and size and scan for malware.

---

## 5. Backend API (Next.js Route Handlers)

- [ ] **Identity** — Each route: get Supabase user from request (cookies). If no user, get anonymous ID (cookie) for free-tier quota.
- [ ] **Quota checks** — Before calling AI: anonymous → check `uses_count` (≤3) and words per use (≤250); trial → check `trial_ends_at` and `trial_words_used` vs 2,000; paid → check `subscriptions` + `usage` vs plan limit (10K / 25K / 50K). Return 403 + `QUOTA_EXCEEDED` if over.
- [ ] **Per-request cap** — Enforce 250 (free), 1,500 (Regular), 3,000 (Pro), 5,000 (Premium) words per request.
- [ ] **Routes to implement**:
  - [ ] `POST /api/humanize` — Validate text → quota → call Claude (humanize prompt) → increment usage → return result.
  - [ ] `POST /api/paraphrase` — Same pattern; paraphrase prompt.
  - [ ] `POST /api/ai-check` — Same pattern; detector prompt (or GPTZero later).
  - [ ] `POST /api/summarize` — Same pattern; summarizer prompt.
  - [ ] `POST /api/grammar-check` — Same pattern; grammar prompt.
  - [ ] `POST /api/translate` — Same pattern; translate prompt (optional target language param).
  - [ ] `GET /api/usage` — Return current usage (anon or user) for frontend display.
- [ ] **Error handling** — LLM timeout/error → 502/503, don’t increment usage; quota exceeded → 403; invalid session → 401.

---

## 6. AI API (Anthropic Claude 3.5 Sonnet)

- [ ] **Client** — Server-only Anthropic client (e.g. `@anthropic-ai/sdk` or fetch to `https://api.anthropic.com/v1/messages`); use `ANTHROPIC_API_KEY`.
- [ ] **Prompts** — System + user message per tool (humanize, paraphrase, detector, summarize, grammar, translate); see [AI_PROVIDERS.md](./AI_PROVIDERS.md) and [PLANNING_CHECKLIST.md](./PLANNING_CHECKLIST.md).
- [ ] **Token limits** — Set `max_tokens` per request to cap cost and avoid timeouts (e.g. 500–1000 for output).
- [ ] **One key** — All tools use same `ANTHROPIC_API_KEY`; optional later: GPTZero for `POST /api/ai-check` only.

---

## 7. Stripe

- [ ] **Products & Prices** — In Stripe Dashboard: create products for **Regular** ($9/mo), **Pro** ($15/mo), **Premium** ($25/mo); recurring monthly prices.
- [ ] **Checkout** — When user clicks Subscribe, create Stripe Checkout Session (or use Payment Links); redirect to Stripe; success/cancel URLs back to your app (e.g. `/account?success=true`).
- [ ] **Webhooks** — Create endpoint `POST /api/webhooks/stripe`; subscribe to `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`; optionally `invoice.payment_failed`. Verify signature with `STRIPE_WEBHOOK_SECRET`; upsert `subscriptions` (or user) in Supabase; idempotent by `subscription_id`.
- [ ] **Customer Portal** — “Manage subscription” link opens Stripe Customer Portal (cancel, update payment method); use Stripe API to create portal session and redirect.
- [ ] **Trial** — Internal trial (no Stripe): track `trial_ends_at` and `trial_words_used` in Supabase; when user upgrades, create Stripe Customer + Checkout for first paid subscription.

---

## 8. Rate limiting

- [ ] **Implement** — Per IP and/or per user: e.g. max 10 requests per minute for humanize/paraphrase/etc. Reject with 429 if over.
- [ ] **Where** — Option A: in each API route, check DB or in-memory store for “requests in last 1 min”. Option B: Upstash Redis (serverless, free tier) with increment + TTL. Option C: Vercel edge middleware (if available).
- [ ] **Recommendation** — MVP: simple per-IP or per-user limit in API route (e.g. 10/min). Add Upstash later if you need stricter or global limits.

---

## 9. Anonymous tracking (free tier: 250 words/use, 3 uses)

- [ ] **Cookie** — Set long-lived cookie with UUID (or use fingerprint) for anonymous ID.
- [ ] **Storage** — Upsert `anonymous_usage`: `anonymous_id`, `uses_count` (increment up to 3), optional `words_used`.
- [ ] **Enforce** — In API: if anonymous, check `uses_count` < 3 and words ≤ 250 per request; block after 3 uses with clear “Create account for more” response.

---

## 10. Account page & billing UX

- [ ] **Account page** — e.g. `/account` (or `/dashboard`). Show: email (from Supabase), current plan (from Supabase `subscriptions`), “Manage subscription” → Stripe Customer Portal. Optional: “Words used this period.”
- [ ] **Header** — When logged in, show “Account” link and “Log out”; optional “Signed in as …”.
- [ ] **Paywall** — When quota exceeded (anon or trial/paid), return 403; frontend shows “Create account” or “Upgrade” and link to signup/pricing.

---

## 11. Other (security, legal, polish)

- [ ] **Error messages** — Friendly copy for 403 (quota), 401 (login), 502 (AI error); no leaking of internal details.
- [ ] **Privacy Policy** — Draft real policy: what you collect (account, usage counts, pasted text if stored); retention; no selling data. MVP: don’t store pasted text long-term; state that.
- [ ] **Terms of Service** — Draft real terms: acceptable use, subscription terms, cancel anytime, limitations of liability.
- [ ] **Email (optional MVP)** — Supabase password reset only; optional later: welcome email, trial ending (Resend/SendGrid).
- [ ] **CORS / CSP** — If you add a separate frontend domain, set CORS; optional Content-Security-Policy headers for extra security.

---

## 12. Order to build (suggested)

1. Env + Supabase (tables, RLS).  
2. Auth (Supabase Auth + Google); auth UI wired.  
3. Anonymous quota (cookie + `anonymous_usage`); enforce in one API route.  
4. One AI route (e.g. `POST /api/humanize`) with quota check + Claude + usage increment.  
5. Remaining AI routes (paraphrase, ai-check, summarizer, grammar, translate).  
6. Stripe (Products, Checkout, webhooks, Customer Portal); trial + paid quota logic in API.  
7. Rate limiting in API routes.  
8. Account page; paywall copy and error handling.  
9. Privacy/Terms content; optional email.

---

**Quick reference:**  
- **Secure “upload”** = validate/sanitize text, enforce limits, HTTPS, no long-term storage of pasted text (MVP).  
- **Backend API** = Next.js Route Handlers + Supabase session + quota + per-request caps.  
- **AI API** = Anthropic Claude 3.5 Sonnet, one key, one prompt per tool.  
- **Stripe** = Products/Prices, Checkout, webhooks, Customer Portal.  
- **Rate limiting** = per-IP or per-user, e.g. 10 req/min, in API or Upstash.

---

*Document version: 1.0 — Single build checklist for launch.*
