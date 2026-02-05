# BypassrAI — MVP Scope

Minimum viable product: get to “someone can humanize 250 words free, then sign up for a trial and monthly subscription” without extra features. No code here — scope and phases only.

---

## 1. MVP Goals

1. **Anonymous user** can humanize up to **250 words** in the browser; after that, they must create an account.
2. **New user** can **sign up** and get a **free trial** (e.g. 7 days and/or a trial word limit).
3. **Subscribed user** can use a **monthly plan** (e.g. fixed word limit or “unlimited” per month).
4. **Landing + humanizer + account + billing** exist and work end-to-end with the cheapest/easiest stack (see [TECH_STACK.md](./TECH_STACK.md)).

---

## 2. In Scope for MVP

| Area | What’s in |
|------|-----------|
| **Landing** | Hero, trust line, 3-step section, short social proof, FAQ, footer. “Try for free” → humanizer. |
| **Humanizer** (`/humanize`) | Paste text, word count, “Humanize” + optional “Check for AI,” result view. Quota display (e.g. X/250 words). |
| **Paraphraser** (`/paraphrase`) | Same UI pattern; “Paraphrase” button. Wire to API when backend is ready. |
| **AI Detector** (`/ai-check`) | Same UI pattern; “Check for AI” button. Wire to detection API when ready. |
| **Quotas** | Anonymous: 250 words total (by fingerprint/cookie). Trial: e.g. 2,000 words or 7 days. Paid: per plan (e.g. 10K words/month or unlimited). |
| **Paywall** | When anonymous limit reached: message + “Create an account for a free trial.” No humanize until signup (or subscribe). |
| **Auth** | Sign up (`/signup`), log in (`/login`), forgot password (`/forgot-password`). **Google sign-in** on login and signup (required for MVP). Backend auth = Supabase Auth (sessions/JWT validated in API routes). See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md). |
| **Account** | Minimal profile: email, plan, “Manage subscription” (Stripe Portal). |
| **Help** | FAQ (`/help`), How it works (`/help/how-it-works`), Contact (`/contact`). |
| **Billing** | Pricing page (`/pricing`); free trial + one monthly paid plan. Stripe Checkout for subscribe; webhooks update DB. |
| **Usage tracking** | Backend checks and increments usage for anonymous and logged-in users; frontend shows remaining quota. |

---

## 3. Out of Scope for MVP (Backend)

- **AI detection / “Check AI score”** — UI exists on Humanize and AI Check; wire to detection API when ready.
- **Paraphraser** — UI exists; wire to paraphrase API when ready (can share or extend humanizer backend).
- **Public API** — no API keys or developer product.
- **History of past humanizations** — no “My history” or saved outputs (can add later with Supabase Storage or DB).
- **Team / enterprise plans** — single-user only.
- **Annual billing** — monthly only.
- **Multiple languages** — English only for MVP (UI + humanizer).
- **Dark mode** — light theme only.
- **Blog, affiliate, “Mini tools”** — not required for launch.

---

## 4. User Flows (Summary)

1. **Anonymous, under 250 words:** Open humanizer → paste → Humanize → see result. Usage increments.
2. **Anonymous, at 250 words:** Humanize blocked or next request blocked; show “Create an account for a free trial.”
3. **Sign up:** Create account → get trial (words and/or days) → use humanizer as logged-in user.
4. **Subscribe:** From pricing or paywall, go to Stripe Checkout → after payment, subscription active; humanizer uses paid quota.
5. **Manage subscription:** “Manage subscription” → Stripe Customer Portal (cancel, update payment).

---

## 5. Phases (High-Level)

| Phase | Focus | Outcome |
|-------|--------|---------|
| **0. Setup** | Repo, Vercel, Supabase, Stripe (test), env vars. | Deploy empty Next.js app; DB and auth and Stripe test mode ready. |
| **1. Landing** | Implement landing from [UI_DESIGN.md](./UI_DESIGN.md). | Homepage live with hero, steps, FAQ, footer. |
| **2. Humanizer (anon)** | Humanizer UI + API route that calls LLM; anonymous quota (250 words) by fingerprint/cookie. | Anonymous users can humanize up to 250 words. |
| **3. Auth & trial** | Sign up / log in (Supabase): email+password + **Google OAuth**; trial entitlement and quota. | New users can sign up (including “Sign in with Google”) and get a trial quota. |
| **4. Billing** | One monthly plan, Stripe Checkout, webhooks, “Manage subscription.” | Users can subscribe and use paid quota. |
| **5. Polish** | Paywall copy, error states, quota display, responsive pass. | MVP ready for soft launch. |

You can build in that order and stop after each phase with a working slice (e.g. after Phase 2 you have “free 250 words” without accounts).

---

## 6. Success Criteria for MVP

- Anonymous user can humanize 250 words total, then is prompted to sign up.
- New user can sign up and use a free trial (words/days) without paying.
- User can subscribe to the monthly plan and use humanizer within plan limits.
- Subscription state is correct after payment and cancel (via Stripe + webhooks).
- Landing and humanizer match the NaturalWrite-inspired design direction (see [UI_DESIGN.md](./UI_DESIGN.md)).
- All of the above runs on the cheapest/easiest stack (see [TECH_STACK.md](./TECH_STACK.md)) with no extra infra.

---

*Document version: 1.0 — Planning only; no code.*
