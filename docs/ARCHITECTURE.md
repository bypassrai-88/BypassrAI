# BypassrAI — System Architecture

High-level architecture for the AI humanizer product. No implementation yet; this document defines components, boundaries, and data flow.

---

## 1. Overview

- **Product**: AI humanizer — converts AI-generated text into human-sounding text that passes common detectors.
- **Users**: Anonymous (limited free use) → Registered (free trial) → Subscribers (monthly).
- **Core flow**: Paste text → (optional) check AI score → Humanize → View result.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Landing   │  │  Humanizer  │  │   Account   │  │  Billing/Checkout   │  │
│  │   / Home    │  │   (Editor)  │  │  Auth/Profile│  │  (Stripe, etc.)     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────┼────────────────────┼─────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / EDGE                                  │
│  (Auth, rate limiting, routing — e.g. Next.js API routes or separate BFF)   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Usage &    │  │  Humanizer   │  │   Auth &     │  │   Billing &      │ │
│  │   Quotas     │  │   Service    │  │   Users      │  │   Subscriptions  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
└─────────┼─────────────────┼─────────────────┼──────────────────┼───────────┘
          │                 │                 │                  │
          ▼                 ▼                 ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│   Database   │   │  AI/ML or    │   │   Auth       │   │   Payment        │
│   (Users,    │   │  External    │   │   Provider   │   │   Provider       │
│   usage,     │   │  Humanizer   │   │   (e.g.      │   │   (e.g. Stripe)  │
│   history)   │   │  API)        │   │   Auth0)     │   │                  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────────┘
```

---

## 3. Core Components

### 3.1 Client (Frontend)

- **Landing / Home**: Value prop, social proof, CTA to try free or sign up.
- **Humanizer UI**: Text area (paste), optional “Check AI score”, “Humanize” action, result view. Word count and quota display (e.g. “X / 250 words used” for anonymous).
- **Account**: Sign up, login, profile. Gate for free trial and subscription.
- **Billing**: Plan selection, checkout, manage subscription (post-MVP: invoices, upgrade/downgrade).

All user-facing logic (quota checks, paywall messaging) can be enforced again on the backend; frontend is for UX only.

### 3.2 API / Backend-for-Frontend (BFF)

- **Responsibilities**:
  - Route requests to the right services.
  - Resolve identity (anonymous vs authenticated) and attach user/subscription context.
  - Enforce **usage and quotas** (anonymous: 250 words total; trial/subscription: per plan).
  - Call Humanizer Service and return result; optionally call AI-detection for “check score”.
- **Auth**: Validate session/JWT for protected routes; optional API keys for future API product.

### 3.3 Usage & Quotas Service

- **Anonymous**: Track usage by fingerprint (e.g. cookie or lightweight fingerprint). Cap: 250 words total (configurable). No PII.
- **Registered (free trial)**: Track by `user_id`. Trial word limit and duration (e.g. 7 days, N words).
- **Subscribed**: Track by `user_id` + plan. Monthly word limit or “unlimited” depending on plan.
- **Storage**: Counters and (optionally) per-request logs for usage and limits. Can live in main DB or a small service + Redis for fast checks.

### 3.4 Humanizer Service

- **Input**: Raw text, optional options (tone, etc. for later).
- **Output**: Humanized text.
- **Implementation options for MVP**:
  - **A**: Your own model (fine-tuned or prompt-based) behind an internal API.
  - **B**: Third-party “humanizer” API (if available) — you own prompt/params and product UX.
- This service should be stateless and callable by the BFF after quota checks.

### 3.5 Auth & Users

- **Auth**: Sign up / login (email + password, **and Google OAuth**). Session or JWT via Supabase Auth.
- **Backend auth**: API routes validate the Supabase session/JWT (e.g. `getUser()` from request cookies). Identity = `user.id` for quota and billing; no separate auth service.
- **User store**: `user_id`, email, subscription status, trial state, plan_id. In Supabase (auth.users + app tables). Account creation required when anonymous user hits 250-word limit (or chooses “Sign up for more”).

### 3.6 Billing & Subscriptions

- **Plans**: Free trial → Monthly subscription (and later annual, if desired).
- **Provider**: Stripe (or similar) for subscriptions and optional one-time top-ups.
- **Webhooks**: Subscription created/updated/canceled/payment failed — update `user` and quota/entitlements.
- **Entitlements**: Stored per user (e.g. `plan_id`, `period_end`, `cancel_at_period_end`). Usage service reads this to allow or deny humanize requests.

### 3.7 Data Stores (Conceptual)

| Store           | Purpose                                      | MVP suggestion   |
|-----------------|----------------------------------------------|------------------|
| **Primary DB**  | Users, usage aggregates, subscription state  | PostgreSQL       |
| **Cache**       | Rate limiting, session, quota checks         | Redis (optional) |
| **Object store**| Past humanizations (optional, for “history”)  | S3-compatible    |

---

## 4. Key Flows

### 4.1 Anonymous User — First Use (Under 250 Words)

1. User opens Humanizer, pastes text.
2. Frontend shows word count; “Humanize” is enabled if within limit.
3. On “Humanize”, frontend calls BFF with text (no auth).
4. BFF checks anonymous quota (by fingerprint/cookie); if under 250 words total, calls Humanizer Service.
5. Humanizer returns result; BFF increments anonymous usage, returns result to client.
6. Client displays result.

### 4.2 Anonymous User — Limit Reached (250 Words)

1. User hits “Humanize”; BFF finds anonymous usage ≥ 250 words.
2. BFF returns error/code indicating “quota exceeded”.
3. Frontend shows paywall: “Create an account to get a free trial” (and optionally “Subscribe for more”).
4. No humanize result until user signs up (and gets trial) or subscribes.

### 4.3 New User — Sign Up & Free Trial

1. User signs up (email + password or OAuth).
2. Auth & Users create account; Billing creates free trial (e.g. Stripe trial or internal trial flag + end date).
3. Usage & Quotas: user now has trial quota (e.g. 2,000 words for 7 days).
4. User uses Humanizer as logged-in user; BFF checks trial quota and humanizer service.

### 4.4 Subscribed User — Monthly Usage

1. User on paid plan; BFF loads subscription and plan limits from Billing/DB.
2. Each humanize request: BFF checks monthly (or period) word quota, calls Humanizer Service, increments usage.
3. Stripe webhooks keep subscription state in sync (renewal, cancel, payment failed).

---

## 5. Security & Privacy

- **Text**: Treat pasted and humanized text as sensitive. Prefer encryption at rest and TLS in transit; define retention (e.g. no long-term storage for MVP, or short-term for “history”).
- **Auth**: Secure session/JWT; no sensitive data in client-side storage beyond session identifier.
- **Quotas**: Enforce on backend; do not trust client for limits.
- **Rate limiting**: Per IP and per user to prevent abuse and control cost of Humanizer/API calls.

---

## 6. Scalability (Post-MVP)

- **Humanizer**: Scale via queue (e.g. job queue) if processing time or load grows; keep API synchronous for MVP if latency is acceptable.
- **Usage**: Aggregate counters (e.g. daily rollups) to keep per-request checks fast.
- **Multi-region**: Consider later for latency and compliance; single region is fine for MVP.

---

## 7. Out of Scope for Initial Architecture

- Public API for developers (can be added later with API keys and separate quotas).
- AI “detection” feature (optional; can be a separate microservice or third-party call).
- Mobile apps (web-first; responsive UI covers mobile browsers).
- Team/enterprise plans (single-user and solo subscription first).

---

*Document version: 1.0 — Planning only; no code.*
