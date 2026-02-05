# Anonymous quota: how it works

How we identify anonymous users, store their usage, and enforce **3 uses** and **250 words per use** before they hit the paywall.

---

## 1. How we identify anonymous users

We need a stable ID per browser so we can count "this person has used the tool 3 times." Options:

| Method | Pros | Cons |
|--------|------|------|
| **Cookie** | Simple, works everywhere, no extra libs. Server sets it once, browser sends it on every request. | User can clear cookies and get 3 more uses (acceptable for MVP). |
| **Fingerprint** | Harder to bypass (no cookie clear). | More complex, privacy concerns, can change (e.g. browser update). |
| **IP only** | Very simple. | Shared IPs (office, café) share one quota; VPN gives new quota. Not ideal for "3 uses per person." |

**Choice: cookie.** We set a long-lived cookie containing a random **anonymous_id** (UUID). Same browser = same cookie = same quota. Clear cookie = new identity (we accept that for MVP).

---

## 2. Where we store usage

Table **`anonymous_usage`** (already in Supabase):

| Column | Purpose |
|--------|--------|
| `anonymous_id` | UUID from the cookie (unique per browser). |
| `uses_count` | Number of times they’ve used any AI tool (humanize, paraphrase, etc.). Max 3. |
| `words_used` | Optional total words across all uses (e.g. for analytics or a 750‑word total cap). |
| `updated_at` | Last time we incremented. |

**Rules we enforce:**

- **Per use:** This request’s word count ≤ 250.
- **Total uses:** `uses_count` < 3. After the 3rd successful use we block until they sign up.

We can either (a) cap each use at 250 and count uses only (`uses_count`), or (b) also enforce a 750‑word total via `words_used`. For “3 uses, 250 words each,” (a) is enough: we check request words ≤ 250 and `uses_count` < 3.

---

## 3. Who creates the anonymous_id?

**Server creates it.** The client never invents the ID.

1. User (not logged in) hits an AI API route (e.g. POST /api/humanize).
2. API reads cookies. No Supabase session → treat as anonymous.
3. Look for cookie e.g. `bypassrai_anon_id`.
   - **If missing:** Generate UUID, set cookie in the **response** (`Set-Cookie`), and ensure a row exists in `anonymous_usage` for that ID (e.g. `uses_count = 0`). Then run the same quota check as below.
   - **If present:** Use that value as `anonymous_id`.
4. Query `anonymous_usage` for this `anonymous_id` (use **service_role** or a server-only client; this table isn’t exposed to the client).
5. **Quota check:** If `uses_count >= 3` → return 403 with a clear message: e.g. “Free limit reached (3 uses). Create an account for a free trial.”
6. **Request check:** If this request’s word count > 250 → return 400: “Free tier is 250 words per use.”
7. If both pass → call Claude, then **increment** `uses_count` (and optionally add to `words_used`), then return the result.

So: **first request** from a new browser might create the cookie and the row; **every request** reads the cookie, looks up the row, and enforces the limits.

---

## 4. Cookie details

- **Name:** e.g. `bypassrai_anon_id`.
- **Value:** UUID v4 (e.g. `a1b2c3d4-...`).
- **HttpOnly:** Yes (so JS can’t read it; only the server sees it). Reduces tampering.
- **Secure:** Yes in production (HTTPS only).
- **SameSite:** Lax or Strict so it’s sent on same-site API calls.
- **Max-Age:** Long-lived (e.g. 1 year) so the same device keeps the same quota until they clear cookies or sign up.

The cookie is set in the **API route response** the first time we see no cookie: we do the usual quota logic (and may create the row), and before returning we call `response.headers.set('Set-Cookie', ...)` with the new cookie. Next request from that browser will include the cookie automatically.

---

## 5. Flow summary

```
Request comes in (e.g. POST /api/humanize, body: { text })
  → Get Supabase user (getUser() from cookies).
  → If user exists: use logged-in quota (trial / paid) — not anonymous.
  → If no user:
      → Read cookie bypassrai_anon_id.
      → If no cookie: generate UUID, create row in anonymous_usage (uses_count=0), 
                      set Set-Cookie on response for next time.
      → Load row from anonymous_usage for this anonymous_id.
      → If uses_count >= 3 → 403 "Free limit reached. Create an account."
      → If request word count > 250 → 400 "Max 250 words per use for free tier."
      → Call Claude (humanize).
      → Increment uses_count (and optionally words_used) in anonymous_usage.
      → Return result (and if we just set a new cookie, include it in response).
```

---

## 6. Shared vs separate quota for tools

**One shared pool for anonymous:** The same 3 uses and 250 words per use apply to **all** tools (humanize, paraphrase, AI check, summarizer, grammar, translator). So 1 humanize + 1 paraphrase + 1 grammar = 3 uses, then blocked. No separate “3 uses per tool.”

---

## 7. What we don’t do (MVP)

- **No reset** of anonymous quota (no “3 uses per day”). 3 uses total until they sign up.
- **No fingerprint** — cookie only.
- **No IP-based quota** for anonymous (IP can be used later for rate limiting abuse, separately).

---

## 8. Implementation checklist

- [ ] In each AI API route: if no Supabase user, get or set `bypassrai_anon_id` cookie and load/update `anonymous_usage` (use admin/service_role client for this table).
- [ ] Before calling Claude: enforce `uses_count < 3` and request words ≤ 250; return 403/400 with clear messages.
- [ ] After successful Claude call: increment `uses_count` (and optionally `words_used`).
- [ ] Set cookie on response when we create a new anonymous_id (first time no cookie).
- [ ] Frontend: when API returns 403 with “Free limit reached”, show a CTA to sign up (e.g. modal or banner).

Once this structure is in place, we can add trial and paid checks for logged-in users in the same routes.
