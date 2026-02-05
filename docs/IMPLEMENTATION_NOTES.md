# BypassrAI — Implementation Notes

Notes for when we implement backend, auth, and billing. Use this as the checklist and reference.

**See also:** [PLANNING_CHECKLIST.md](./PLANNING_CHECKLIST.md) for AI API, Stripe/pricing, anonymous tracking, rate limiting, env vars, and everything else to plan.

---

## 1. Authentication

### 1.1 Provider: Supabase Auth

- **Backend auth** = **Supabase Auth**. No separate auth service (no Auth0, no custom JWT server).
- Supabase gives us: user store, sessions, and a single place to add email/password and OAuth.

### 1.2 Login methods (MVP)

| Method | Supported | Notes |
|--------|-----------|--------|
| **Email + password** | Yes | Sign up, log in, forgot password. Supabase handles signUp, signInWithPassword, resetPasswordForEmail. |
| **Google** | Yes (required) | “Sign in with Google” on login and signup pages. Supabase Auth supports Google OAuth; enable in Supabase Dashboard → Authentication → Providers → Google, add Google OAuth client ID/secret. Frontend: `signInWithOAuth({ provider: 'google' })`. |
| Magic link | Optional | Supabase supports it; add “Email me a link” later if desired. |

### 1.3 Backend authentication (how API routes know who the user is)

- **Session format:** Supabase uses JWTs. The client (browser) holds the session in a cookie (or localStorage; cookie is better for SSR and same-site API calls).
- **In Next.js API routes (Route Handlers):**
  1. Read the request (cookies or `Authorization` header).
  2. Create a Supabase client that can validate the user (e.g. `createRouteHandlerClient` with cookies, or `createClient` with the JWT from the request).
  3. Call `supabase.auth.getUser()` (or `getSession()`). If valid, you get `user.id`, `user.email`, etc.
  4. Use `user.id` for quota lookups, usage increments, and subscription checks. If no user (anonymous), use fingerprint/cookie for anonymous quota.
- **Libraries:** Use `@supabase/ssr` in Next.js so the same session works in Server Components, Route Handlers, and middleware. Middleware can optionally protect routes (e.g. redirect unauthenticated users from /account).
- **Summary:** Every protected or quota-checking API route gets the Supabase user from the request; that’s the single source of identity for the backend.

### 1.4 UI checklist for auth (when implementing)

- [ ] Login page: email + password form + **“Sign in with Google”** button.
- [ ] Signup page: email + password form + **“Sign up with Google”** button.
- [ ] Forgot password: email form → Supabase `resetPasswordForEmail`.
- [ ] After Google OAuth redirect: Supabase handles callback; redirect user to `/humanize` or `/account`.
- [ ] Optional: show “Signed in as …” in header when logged in; Log out clears Supabase session.

---

## 2. Quotas & usage

- **Anonymous:** Identify by cookie or fingerprint; store total word count in DB (e.g. `anonymous_usage` keyed by fingerprint). Cap 250 words.
- **Logged-in:** Key by `user.id` from Supabase; store trial/subscription state and word usage in Supabase (e.g. `users` or `usage` table). API route: get user → read quota/usage → allow or deny → increment usage after humanize.

---

## 3. Billing

- Stripe Checkout for subscription; Stripe webhooks update Supabase (e.g. `subscription_status`, `period_end`). API routes read subscription state from Supabase when checking quota.

---

## 4. Humanizer / Paraphraser / AI Check / Tools

- **One API for all (MVP):** Anthropic **Claude 3.5 Sonnet** for humanize, paraphrase, AI detector (prompt-based), **summarizer**, **grammar checker**, and **translator**. One key: `ANTHROPIC_API_KEY`. See [AI_PROVIDERS.md](./AI_PROVIDERS.md).
- **Nav:** Main = AI Humanizer, AI Detector; **Tools** dropdown = Paraphraser, Grammar checker, Summarizer, Translator. All tools share the same quota/usage pool.
- API route receives text + identity (anonymous or `user.id`). Check quota → call Claude with the right prompt (humanize / paraphrase / detector / summarize / grammar / translate) → return result → increment usage. Auth = Supabase session only.
- **Translator:** Claude can translate between languages; optional “target language” param can be added when wiring the API.
- **Later:** Add dedicated detector API (e.g. GPTZero) for best “Check for AI” accuracy; other tools stay on Claude.

---

*Document version: 1.0 — For implementation reference.*
