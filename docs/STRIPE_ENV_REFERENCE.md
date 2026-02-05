# Stripe environment variables reference

Use this when setting up Stripe (local and production).

---

## Local development (`.env.local`)

| Variable | Where to get it | Example |
|----------|-----------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys (Test mode) → Publishable key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Same page → Secret key | `sk_test_...` |
| `STRIPE_LITE_PRICE_ID` | Product catalog → Lite product → copy Price ID | `price_...` |
| `STRIPE_PRO_PRICE_ID` | Product catalog → Pro product → copy Price ID | `price_...` |
| `STRIPE_PREMIUM_PRICE_ID` | Product catalog → Premium product → copy Price ID | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → CLI prints `whsec_...` | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Optional. Omit for local (app uses `http://localhost:3000`) | `http://localhost:3000` |

---

## Production (Vercel → Settings → Environment Variables, Production)

| Variable | Where to get it | Example |
|----------|-----------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard, **Live mode** → Developers → API keys → Publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Same page (Live) → Secret key | `sk_live_...` |
| `STRIPE_LITE_PRICE_ID` | Create Lite product in **Live mode** → copy Price ID | `price_...` |
| `STRIPE_PRO_PRICE_ID` | Create Pro product in Live mode → copy Price ID | `price_...` |
| `STRIPE_PREMIUM_PRICE_ID` | Create Premium product in Live mode → copy Price ID | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe (Live) → Developers → Webhooks → Add endpoint → `https://YOUR_DOMAIN/api/webhooks/stripe` → reveal Signing secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Your live site URL (optional; app falls back to Vercel URL) | `https://bypassrai.vercel.app` |

---

## Copy-paste block for `.env.local` (fill in your values)

```env
# Stripe — get keys from https://dashboard.stripe.com (Test mode), price IDs from Product catalog
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_LITE_PRICE_ID=price_
STRIPE_PRO_PRICE_ID=price_
STRIPE_PREMIUM_PRICE_ID=price_
STRIPE_WEBHOOK_SECRET=whsec_
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

After editing, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
