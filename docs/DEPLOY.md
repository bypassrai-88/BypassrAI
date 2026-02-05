# Deploy BypassrAI to Vercel

Your stack uses **Vercel** for hosting. Two ways to deploy:

---

## Option A: Deploy from the Vercel website (easiest)

1. **Push your code to GitHub** (if you haven’t already):
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in (GitHub is fine).

3. **Import your repo**: Click **Add New… → Project**, choose your **BypassrAI** repo, then **Import**.

4. **Configure the project** (Vercel usually detects Next.js):
   - Framework Preset: **Next.js**
   - Root Directory: leave as **./**
   - Build Command: **`npm run build`** (default)
   - Output Directory: leave default

5. **Add environment variables** before deploying (Project → **Settings → Environment Variables**). Set these for **Production** (and Preview/Development if you use them):

   | Variable | Description |
   |----------|-------------|
   | `ANTHROPIC_API_KEY` | Claude API key ([console.anthropic.com](https://console.anthropic.com)) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (e.g. `pk_live_...`) |
   | `STRIPE_SECRET_KEY` | Stripe secret key (e.g. `sk_live_...`) |
   | `STRIPE_LITE_PRICE_ID` | Stripe price ID for Lite plan |
   | `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan |
   | `STRIPE_PREMIUM_PRICE_ID` | Stripe price ID for Premium plan |
   | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for **production** (see step 6) |
   | `NEXT_PUBLIC_APP_URL` | Your live site URL (e.g. `https://bypassrai.vercel.app`) — used for Checkout and Customer Portal return URLs |

   See `.env.example` in the repo for reference. Never commit real keys.

6. **Stripe webhook (production)** — so Stripe can sync subscriptions:
   - Deploy once to get your URL (e.g. `https://bypassrai-xxx.vercel.app`).
   - In [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
   - **Endpoint URL:** `https://your-vercel-url.vercel.app/api/webhooks/stripe`
   - **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Add the endpoint, then reveal and copy the **Signing secret** (`whsec_...`).
   - Add it in Vercel as **`STRIPE_WEBHOOK_SECRET`** (use this only for production; local dev uses the Stripe CLI secret).
   - Redeploy after adding the secret.

7. Click **Deploy**. When it finishes, you get a URL like `https://bypassrai-xxx.vercel.app`.

8. **Custom domain** (optional): In the project → **Settings → Domains**, add your domain. If you use it, set **`NEXT_PUBLIC_APP_URL`** to that domain.

---

## Option B: Deploy from the command line

1. **Install Vercel CLI** (one time):
   ```bash
   npm i -g vercel
   ```
   Or use it without installing:
   ```bash
   npx vercel
   ```

2. **From your project folder** (`/Users/connoradams/Desktop/BypassrAI`):
   ```bash
   cd /Users/connoradams/Desktop/BypassrAI
   vercel
   ```
   - First time: log in and link the project (or create a new one).
   - It will build and deploy and print a preview URL.

3. **Add environment variables** for production:
   - In the [Vercel dashboard](https://vercel.com/dashboard): your project → **Settings → Environment Variables**.
   - Add all required variables (see the table in Option A, step 5): Anthropic, Supabase, Stripe keys and price IDs, **STRIPE_WEBHOOK_SECRET** (from Stripe Dashboard webhook for your production URL), and **NEXT_PUBLIC_APP_URL** (your production URL).
   - Redeploy so the new env is used:
     ```bash
     vercel --prod
     ```

4. **Production URL**: After `vercel --prod` you get the live URL (e.g. `https://bypassrai.vercel.app`). Use this as **NEXT_PUBLIC_APP_URL** and as the Stripe webhook endpoint base.

---

## After deploy

- **Preview URLs**: Every push to a branch gets a preview deploy; only `vercel --prod` (or the **Production** branch in the dashboard) updates the main site.
- **Secrets**: Never commit `.env.local`. Set all secrets in Vercel’s Environment Variables (Anthropic, Supabase, Stripe).
- **Stripe**: Use a separate webhook endpoint (and **STRIPE_WEBHOOK_SECRET**) for production than for local dev (Stripe CLI).
- **Redeploy**: Push to your connected branch, or run `vercel --prod` again after changing env vars.
