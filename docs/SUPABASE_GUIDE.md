# BypassrAI — Supabase Setup Guide

Step-by-step guide to set up Supabase for auth, database, and usage tracking. Do this before wiring login/signup in the app.

---

## 1. Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **New project**.
3. Choose your **organization** (or create one).
4. Set:
   - **Name:** e.g. `bypassrai`
   - **Database password:** generate and **save it** (you need it for DB access; not for the app env vars below).
   - **Region:** pick one close to your users.
5. Click **Create new project** and wait for it to finish.

---

## 2. Get your API keys and URL

1. In the project, go to **Settings** (gear) → **API**.
2. Copy and save:
   - **Project URL** — e.g. `https://xxxxx.supabase.co`
   - **anon public** key — safe to use in the browser; used by your Next.js app.
   - **service_role** key — **secret**; use only on the server (e.g. webhooks, admin). Do not expose in the frontend.

3. Add to your app env:

In **`.env.local`** (and later in Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Use your real Project URL and anon key; add `SUPABASE_SERVICE_ROLE_KEY` when you need server-only access (e.g. Stripe webhooks updating the DB).

---

## 3. Enable Auth providers

### Email + password (default)

- Go to **Authentication** → **Providers**.
- **Email** should already be enabled. You can leave “Confirm email” on or off Add `http://localhost:3000/auth/callback` and your production URL to Auth → URL Configuration → Redirect URLs so the confirm link works. Turn it off for instant signup (no email step).

### Google OAuth

1. Go to **Authentication** → **Providers** → **Google**.
2. Turn **Enable Sign in with Google** on.
3. In [Google Cloud Console](https://console.cloud.google.com/):
   - Create or select a project.
   - **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: add your Supabase callback URL:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - For local dev you can also add `http://localhost:3000` if you use a different callback path; Supabase’s default is the first one.
4. Copy the **Client ID** and **Client Secret** into Supabase (Google provider).
5. Save.

---

## 4. Create database tables

In Supabase go to **SQL Editor** and run the following (adjust if you prefer different names).

### 4.1 Anonymous usage (for guests before signup)

```sql
create table if not exists public.anonymous_usage (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null unique,
  uses_count int not null default 0,
  words_used int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_anonymous_usage_anonymous_id
  on public.anonymous_usage(anonymous_id);
```

### 4.2 User profiles / trial (extends Supabase Auth)

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  trial_ends_at timestamptz,
  trial_words_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 4.3 Subscriptions (Stripe)

```sql
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);
```

### 4.4 Usage (words per user per period)

```sql
create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  words_used int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, period_start)
);

create index if not exists idx_usage_user_period
  on public.usage(user_id, period_start);
```

### 4.5 Row Level Security (RLS)

Ensure users only see their own data:

```sql
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can read own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert/update own usage"
  on public.usage for all
  using (auth.uid() = user_id);
```

For **anonymous_usage** you typically don’t use RLS with the anon key for random IDs; your API (using the service role or a small backend-only API) will read/write by `anonymous_id`. So either:

- Leave RLS off for `anonymous_usage` and only allow access from the server (e.g. API routes using the service role), or  
- Add a policy that allows insert/update/select only when a custom claim or header matches (more involved).  

For MVP, many apps just use the service role in API routes for anonymous_usage and don’t expose that table to the client.

---

## 5. Install Supabase in the app

From the BypassrAI repo:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- **@supabase/supabase-js** — client and types.
- **@supabase/ssr** — cookie-based session for Next.js (App Router and Route Handlers).

---

## 6. Next.js client and server setup

### 6.1 Browser client (for login/signup from the frontend)

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 6.2 Server client (for API routes and Server Components)

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
```

### 6.3 Get current user in API routes

In any Route Handler (e.g. `app/api/humanize/route.ts`):

```ts
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Logged in: use user.id for quota and usage
  } else {
    // Anonymous: use cookie/fingerprint and anonymous_usage table
  }
  // ...
}
```

---

## 7. Auth UI (quick reference)

- **Sign up (email):** `supabase.auth.signUp({ email, password })`
- **Sign in (email):** `supabase.auth.signInWithPassword({ email, password })`
- **Sign in with Google:** `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Forgot password:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })`
- **Sign out:** `supabase.auth.signOut()`
- **Get session:** `supabase.auth.getSession()` or in server `getUser()` as above.

Use the **browser client** (`createClient()` from `@/lib/supabase/client`) on login/signup/forgot-password pages. Use the **server client** in API routes and Server Components.

---

## 8. Auth callback (for OAuth — add when you enable Google/Apple)

When you add Google or Apple sign-in later, create `src/app/auth/callback/route.ts` so Supabase can complete the OAuth flow:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/humanize";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

In Supabase Dashboard → **Authentication** → **URL Configuration**, set **Redirect URLs** to include e.g. `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`. (Only needed once you enable Google/Apple.)

---

## 9. Checklist

- [ ] Supabase project created
- [ ] Project URL and anon key in `.env.local`
- [ ] Email provider enabled (Google/Apple optional for later)
- [ ] Tables created: `anonymous_usage`, `profiles`, `subscriptions`, `usage`
- [ ] RLS enabled and policies added
- [ ] `@supabase/supabase-js` and `@supabase/ssr` installed
- [ ] `src/lib/supabase/client.ts` and `server.ts` added
- [ ] Auth callback route `app/auth/callback/route.ts` (only when you add Google/Apple)
- [ ] Login, signup, and forgot-password pages wired to Supabase (email + password only for MVP)

After this, wire login/signup/forgot-password to the Supabase client; redirect after success to `/humanize` or `/account`. Add Google and Apple sign-in later.
