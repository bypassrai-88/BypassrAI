# BypassrAI — Stripe setup guide

Step-by-step: create products, get keys, add the webhook, and let users subscribe.

---

## 1. Stripe account and keys

1. Go to **[dashboard.stripe.com](https://dashboard.stripe.com)** and sign in (or create an account).
2. **Test mode:** Leave **Test mode** on (toggle top-right) until you’re ready to go live.
3. Get your keys:
   - **Developers** → **API keys**
   - Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy **Secret key** (starts with `sk_test_` or `sk_live_`)

4. Add to **`.env.local`**:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

You’ll add the webhook secret in step 4.

---

## 2. Create the three products in Stripe

Create **three** products (each with one recurring price):

| Product   | Price   | Words/mo | Price ID env var                |
|-----------|---------|----------|----------------------------------|
| **Lite**  | $4.99/mo| 5,000    | `STRIPE_LITE_PRICE_ID`          |
| **Pro**   | $9.99/mo| 25,000   | `STRIPE_PRO_PRICE_ID`           |
| **Premium** | $25/mo | 250,000 words | `STRIPE_PREMIUM_PRICE_ID` |

For each:

1. **Product catalog** → **Add product**.
2. **Name:** e.g. `BypassrAI Lite` (then Pro, Unlimited).
3. **Pricing:** Recurring, monthly, amount as above.
4. **Save product**, then open the price and copy the **Price ID** (e.g. `price_1ABC...`).

Add all three to **`.env.local`**:

```env
STRIPE_LITE_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxx
```

---

## 3. Install Stripe and add webhook + Checkout code

The repo already includes:

- **`/api/webhooks/stripe`** — Receives Stripe events, verifies the signature, and updates `subscriptions` in Supabase (subscription created/updated/deleted).
- **`/api/stripe/create-checkout-session`** — Creates a Stripe Checkout session for the chosen plan (`lite`, `pro`, or `unlimited`); the frontend sends `{ plan: "lite" }` (or pro/premium) and redirects the user to the returned Stripe Checkout URL.

You only need to add your env vars and (in step 4) the webhook signing secret.

---

## 4. Webhook in Stripe (so Stripe can call your app)

Stripe needs a **public URL** to send events. Locally you’ll use the Stripe CLI to forward events; in production you’ll use your deployed URL.

### Option A: Local development (Stripe CLI)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) (e.g. `brew install stripe/stripe-cli/stripe` on macOS).
2. Log in: `stripe login`.
3. From your project root, with `npm run dev` running in another terminal:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. The CLI prints a **webhook signing secret** like `whsec_xxxxx`. Add it to **`.env.local`**:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

5. In Stripe Dashboard → **Developers** → **Webhooks**, you’ll see the CLI’s endpoint. For that endpoint, add events (see “Which events to listen for” below). The CLI uses the secret it gave you.

### Option B: Production (deployed app)

1. Deploy your app (e.g. Vercel) and note the URL, e.g. `https://yourapp.vercel.app`.
2. In Stripe: **Developers** → **Webhooks** → **Add endpoint**.
3. **Endpoint URL:** `https://yourapp.vercel.app/api/webhooks/stripe`
4. **Events to send:** Add these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**. Open the endpoint and reveal **Signing secret** → copy it (e.g. `whsec_...`).
6. In your hosting env vars (e.g. Vercel), set:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

Use **one** secret for local (CLI) and a **different** one for production (Dashboard endpoint).

---

## 5. Which events the app handles

| Event                         | What the app does |
|------------------------------|--------------------|
| `checkout.session.completed` | User finished Checkout. Read `subscription` (or `customer`) and sync that subscription to `subscriptions` (and optionally `profiles.stripe_customer_id`). |
| `customer.subscription.updated` | Subscription changed (renewed, plan change, etc.). Update `subscriptions`: status, `current_period_end`, `cancel_at_period_end`. |
| `customer.subscription.deleted` | Subscription ended. Set `subscriptions.status = 'expired'` (or remove the row). |

The webhook handler in the repo is idempotent and uses `stripe_subscription_id` so it updates the same row.

---

## 6. How users subscribe (Checkout)

1. **Account or Pricing page:** Add a button like “Subscribe — $9/mo” or “Upgrade to Regular”.
2. The button calls your API to create a Checkout session:
   - **POST** `/api/stripe/create-checkout-session` with the user’s email or `user_id` (from session) so you can link the Stripe customer to their Supabase user.
3. The API returns a `url` to Stripe Checkout. Redirect the user: `window.location.href = url`.
4. User pays on Stripe; Stripe redirects back to your **success** and **cancel** URLs (you pass these when creating the session).
5. Stripe sends `checkout.session.completed` (and subscription events) to your webhook; the webhook updates Supabase. After that, the user has an active subscription and quota checks will allow them to use their words.

So: **you** create the product/price and webhook; **the app** creates the Checkout session and handles the webhook. No Stripe code runs in the browser except redirecting to Checkout.

---

## 6b. Customer Portal (manage subscription)

The app includes **POST `/api/stripe/create-portal-session`**, which creates a Stripe [Customer Portal](https://dashboard.stripe.com/settings/billing/portal) session. Users with a Stripe customer ID (after subscribing or starting a trial) see a **Manage subscription** button on the Account page; clicking it sends them to Stripe’s hosted portal to update payment method, cancel, or view invoices. Return URL is your app’s `/account` (using **NEXT_PUBLIC_APP_URL** in production). No extra Stripe config is required beyond enabling the Customer Portal in Stripe Dashboard → **Settings** → **Billing** → **Customer portal** (defaults are fine).

---

## 7. Trial → paid ($9) when you use Stripe

Right now, when a trial ends and the user didn’t cancel, the app only updates the DB to “regular” (no charge). To actually charge them:

- **Option A (simplest):** When their trial is about to end (or has ended), show “Your trial is over. Subscribe to continue” and a button that goes to **Stripe Checkout** (same `create-checkout-session`). No trial period on the Stripe subscription; they just start paying.
- **Option B:** When creating the trial in your DB, also create a Stripe subscription with `trial_period_days: 7`. When the trial ends, Stripe automatically charges them and sends `customer.subscription.updated`. Your webhook already keeps `subscriptions` in sync. This requires creating the Stripe subscription at “Start trial” (and storing `stripe_subscription_id`).

Start with Option A (Checkout after trial end); add Option B later if you want automatic trial → paid.

---

## 8. Checklist

- [ ] Stripe account created; Test mode on for dev.
- [ ] `.env.local` has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_REGULAR_PRICE_ID`.
- [ ] Product “Regular” and monthly price created; `STRIPE_REGULAR_PRICE_ID` set.
- [ ] `npm install stripe` run; webhook and create-checkout-session routes in place.
- [ ] Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`; `STRIPE_WEBHOOK_SECRET` set to the CLI secret.
- [ ] Production: Webhook endpoint added in Stripe with the 4 events; `STRIPE_WEBHOOK_SECRET` set in hosting to the Dashboard signing secret.
- [ ] Account or Pricing page has a “Subscribe” button that calls `/api/stripe/create-checkout-session` and redirects to the returned URL.
- [ ] Success/cancel URLs for Checkout set (e.g. `/account?success=1` and `/account?cancel=1`).

After that, Stripe is wired: users can subscribe, and your app stays in sync via the webhook.
