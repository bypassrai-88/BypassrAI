# BypassrAI — Tech Stack (Cheapest & Easiest)

Goal: **minimum cost** and **minimum complexity** — one small team (or solo) can build and run the MVP without DevOps or heavy infra.

---

## 1. Principles

| Principle | Choice |
|-----------|--------|
| **Cheapest** | Use free tiers for hosting, DB, and auth; pay only for usage (LLM API, Stripe %). |
| **Easiest** | Single repo, no Kubernetes, no separate auth service, no Redis unless needed later. |
| **Proven** | Pick tools with great docs and large communities so you can move fast. |

---

## 2. Recommended Stack

### Frontend

| Layer | Technology | Why (cheap / easy) |
|-------|------------|--------------------|
| **Framework** | **Next.js** (React) | One repo for UI + API routes; no separate backend server. Huge ecosystem, easy deploy. |
| **Hosting** | **Vercel** (free tier) | Free for hobby/small projects; automatic deploys from Git; serverless. |
| **Styling** | **Tailwind CSS** | No design-system license; style in markup; fast to match a reference (e.g. NaturalWrite). |
| **Forms / state** | React state + optional **React Hook Form** | Keep it simple; add a form lib only if forms get heavy. |

**Alternatives if you want even simpler:**  
- **Vite + React** + separate tiny backend (e.g. Vercel serverless or a single Node server) — more files but fewer “framework” concepts.  
- **Next.js is recommended** so API and frontend live together and you get free SSL and CDN on Vercel.

---

### Backend / API

| Layer | Technology | Why (cheap / easy) |
|-------|------------|--------------------|
| **API** | **Next.js API Routes** (or Route Handlers in App Router) | No separate API server; same repo, same deploy. |
| **Runtime** | **Vercel serverless** | No servers to manage; scale to zero when idle. |

All “backend” logic (quota checks, humanizer call, auth) lives in these API routes. No separate BFF service.

---

### Database & Auth

| Layer | Technology | Why (cheap / easy) |
|-------|------------|--------------------|
| **Database** | **Supabase** (PostgreSQL) | Free tier: 500MB DB, 50K MAU for auth. One product for DB + Auth. |
| **Auth** | **Supabase Auth** | Email/password + **Google OAuth** (required for MVP) + optional magic link. No Auth0 or custom JWT server. |
| **Usage / quotas** | **Supabase (Postgres)** | Store `anonymous_usage` by fingerprint, `user_usage` by `user_id`; no Redis for MVP. |

**Cost:** Free tier is enough for MVP and early users. Upgrade only when you outgrow it.

**Alternative:** If you prefer “DB only”, you could use **Neon** or **PlanetScale** (free tiers) + **Clerk** or **NextAuth** for auth — but Supabase gives you one dashboard and one SDK for both, which is “easiest”.

---

### Humanizer (AI)

| Layer | Technology | Why (cheap / easy) |
|-------|------------|--------------------|
| **Core logic** | **Single LLM API** (prompt-based) | No ML training or model hosting. You call an API with a “humanize this” prompt. |
| **Provider (locked for MVP)** | **Anthropic Claude 3.5 Sonnet** | One API for humanize, paraphrase, and AI detector (prompt-based). Pay per token; no monthly minimum. Add GPTZero (or similar) for detector later if desired. |
| **Implementation** | API routes: receive text → call Claude with the right prompt (humanize / paraphrase / detector) → return result. | No queues, no workers for MVP. |

**Cost:** Only what you use (tokens). GPT-4o-mini is very cheap per 1K tokens; you can set a max tokens per request to cap cost per humanize.

**Alternative:** A dedicated “humanizer” third-party API exists (e.g. some SaaS); compare cost per 1K words vs. DIY with an LLM.

---

### Billing & Subscriptions

| Layer | Technology | Why (cheap / easy) |
|-------|------------|--------------------|
| **Payments** | **Stripe** | No monthly fee; pay % + fixed fee per transaction. Subscriptions and Customer Portal are built-in. |
| **Plans** | Stripe Products + Prices (monthly recurring) | Create “Free trial” (0 price, trial period) and “Monthly” (e.g. $9/mo). Webhooks update your DB. |
| **State** | Store `stripe_customer_id`, `stripe_subscription_id`, `plan_id`, `period_end` in Supabase (e.g. `users` or `subscriptions` table). | One source of truth; API routes check this before allowing humanize. |

---

### Optional / Later

| Need | Technology | When |
|------|------------|------|
| **Rate limiting** | Vercel edge config or **Upstash Redis** (serverless, free tier) | When you need to throttle anonymous or abusive traffic. |
| **File / history storage** | **Supabase Storage** (free tier) or **Vercel Blob** | If you add “save past humanizations” and need to store text or files. |
| **Email** | **Resend** or **Supabase Inbucket** (dev) | Transactional email (signup, reset password, subscription). Many have free tiers. |

---

## 3. Cost Snapshot (MVP / Early Stage)

| Item | Expected cost |
|------|----------------|
| **Vercel** | $0 (free tier) |
| **Supabase** | $0 (free tier) |
| **Stripe** | $0 fixed; ~2.9% + $0.30 per successful charge |
| **OpenAI / Anthropic** | Pay per token (e.g. few cents per 250-word humanize with GPT-4o-mini) |
| **Domain** | ~$10–15/year (optional; Vercel gives a free `.vercel.app` domain) |

**Total recurring:** Effectively **$0** until you exceed free tiers or have meaningful paid subscriptions. The only variable cost is **LLM API usage** and **Stripe fees** on paid conversions.

---

## 4. Repo Structure (Conceptual)

```
bypassr-ai/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing
│   ├── humanize/
│   │   └── page.tsx        # Humanizer UI
│   ├── account/            # Login, signup, profile
│   ├── api/
│   │   ├── humanize/       # POST: humanize text (quota + LLM)
│   │   ├── usage/          # GET: current usage
│   │   ├── auth/           # Optional: wrap Supabase
│   │   └── webhooks/
│   │       └── stripe/     # Stripe subscription events
│   └── layout.tsx
├── components/
├── lib/
│   ├── supabase.ts         # Client + server clients
│   ├── stripe.ts
│   ├── usage.ts            # Quota checks
│   └── humanizer.ts        # Call LLM API
├── .env.local              # API keys (Supabase, Stripe, OpenAI)
└── package.json
```

Single repo, no microservices. “Easiest” to run locally and deploy with `git push`.

---

## 5. Why This Is “Cheapest and Easiest”

- **One repo:** Next.js frontend + API in one place.  
- **One backend “service”:** API routes on Vercel; no separate Node/Python server.  
- **One data platform:** Supabase for DB + Auth; no separate auth provider or Redis at first.  
- **One LLM call:** Humanizer = one prompt to OpenAI/Anthropic; no ML pipeline.  
- **No fixed monthly infra cost:** Free tiers for Vercel + Supabase; you pay for LLM usage and Stripe only when you have revenue or usage.

You can get to a working MVP (anonymous 250 words, signup, trial, monthly sub) with this stack without touching Kubernetes, Docker (other than optional local), or multiple cloud consoles.

---

*Document version: 1.0 — Planning only; no code. Focus: cheapest and easiest.*
