# Google OAuth setup for Supabase “Sign in with Google”

You need a **Client ID** and **Client Secret** from Google, then you add them (and a redirect URL) in Supabase. Do this once.

---

## Step 1: Open Google Cloud Console

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**.
2. Sign in with your Google account.

---

## Step 2: Create or select a project

1. At the top, click the **project dropdown** (it may say “Select a project” or your project name).
2. Click **New project**.
3. **Project name:** e.g. `BypassrAI` (or anything you like).
4. Click **Create** and wait a few seconds.
5. Make sure that new project is **selected** (check the top bar).

---

## Step 3: Configure the OAuth consent screen

Google requires a “consent screen” before you can create OAuth keys.

1. In the left menu go to **APIs & Services** → **OAuth consent screen**.
2. Choose **External** (so any Google user can sign in). Click **Create**.
3. Fill in:
   - **App name:** e.g. `BypassrAI`
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue**.
5. **Scopes:** click **Save and Continue** (default is fine).
6. **Test users:** click **Save and Continue** (you can add test users later if the app is in “Testing”).
7. Click **Back to Dashboard**.

---

## Step 4: Create OAuth credentials

1. In the left menu go to **APIs & Services** → **Credentials**.
2. Click **+ Create credentials** → **OAuth client ID**.
3. **Application type:** choose **Web application**.
4. **Name:** e.g. `BypassrAI Web` (optional).
5. **Authorized redirect URIs** — click **+ Add URI** and add **exactly**:
   ```text
   https://vfarzcponhxchhvunibb.supabase.co/auth/v1/callback
   ```
   (Use your real Supabase project URL if different: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.)
6. Click **Create**.
7. A popup shows your **Client ID** and **Client Secret**:
   - Copy the **Client ID** (looks like `xxxxx.apps.googleusercontent.com`).
   - Copy the **Client secret** (shorter string).
   - Store them somewhere safe; you’ll paste them into Supabase next.

---

## Step 5: Add them in Supabase

1. Go to **[Supabase](https://supabase.com)** → your project.
2. **Authentication** → **Providers** → **Google**.
3. Turn **Enable Sign in with Google** **on**.
4. Paste:
   - **Client ID** (from Google) → into the **Client ID** field in Supabase.
   - **Client Secret** (from Google) → into the **Client Secret** field in Supabase.
5. Click **Save**.

The redirect URL is already set on the Google side (Step 4.5). Supabase’s Google provider uses `https://YOUR_PROJECT.supabase.co/auth/v1/callback` by default, so you don’t add a redirect in the Supabase Google provider screen—only in Google Cloud Console.

### Step 5b: Allow your app’s callback URL (required for this app)

So that users are sent back to your Next.js app after Google sign-in:

1. In Supabase go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://yourdomain.com/auth/callback` (for production, e.g. `https://bypassrai.com/auth/callback`)
3. Save. The app uses `signInWithOAuth({ options: { redirectTo: origin + '/auth/callback?next=/account' } })`, so this URL must be allowed.

---

## Summary

| Where | What to do |
|-------|------------|
| Google Cloud Console | Create project → OAuth consent screen → Credentials → OAuth client ID (Web app) → Add redirect `https://YOUR_REF.supabase.co/auth/v1/callback` → Copy Client ID + Client Secret |
| Supabase | Authentication → Providers → Google → Enable → Paste Client ID and Client Secret → Save |

After this, “Sign in with Google” in your app will use Supabase, and Supabase will use these Google credentials.
