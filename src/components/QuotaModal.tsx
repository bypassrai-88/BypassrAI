"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

type View = "loading" | "auth" | "trial" | "subscribe";

type QuotaModalProps = {
  open: boolean;
  onClose: () => void;
  onSignInSuccess?: () => void;
};

function validateUsername(value: string): string | null {
  const raw = value.trim();
  if (raw.length < USERNAME_MIN || raw.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_REGEX.test(raw)) {
    return "Username can only contain letters, numbers, underscores, and hyphens.";
  }
  return null;
}

export function QuotaModal({ open, onClose, onSignInSuccess }: QuotaModalProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [trialUsed, setTrialUsed] = useState(false);

  // Auth form state
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Trial/subscribe actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError("");
    setSuccess("");
    setUsername("");
    setEmail("");
    setPassword("");
  }, []);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      // Prefer production URL so OAuth redirect never goes to localhost when on live site
      const origin =
        (typeof window !== "undefined" && window.location.origin) ||
        (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "");
      const redirectTo = `${origin || "https://bypassrai.com"}/auth/callback?next=/account`;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      // Browser will redirect to Google, then back to callback
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setLoading(false);
    }
  }

  const handleClose = useCallback(() => {
    reset();
    setActionLoading(null);
    onClose();
  }, [onClose, reset]);

  const fetchAccount = useCallback(async () => {
    const res = await fetch("/api/account");
    if (res.status === 401) {
      setView("auth");
      return;
    }
    if (!res.ok) {
      setView("auth");
      return;
    }
    const data = await res.json().catch(() => ({}));
    const sub = data.subscription;
    const hasActiveOrTrial = sub && (sub.status === "active" || sub.status === "trial");
    if (hasActiveOrTrial) {
      handleClose();
      return;
    }
    setTrialUsed(data.profile?.trial_used ?? false);
    setView(data.profile?.trial_used ? "subscribe" : "trial");
  }, [handleClose]);

  useEffect(() => {
    if (!open) return;
    setView("loading");
    reset();
    fetchAccount();
  }, [open, fetchAccount, reset]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const usernameError = validateUsername(trimmedUsername);
        if (usernameError) {
          setError(usernameError);
          setLoading(false);
          return;
        }
        const emailRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const emailCheck = await emailRes.json().catch(() => ({}));
        if (emailCheck.exists) {
          setError("An account with this email already exists. Log in instead.");
          setLoading(false);
          return;
        }
        const usernameRes = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmedUsername }),
        });
        const usernameCheck = await usernameRes.json().catch(() => ({}));
        if (usernameCheck.taken) {
          setError("That username is already taken. Please choose another.");
          setLoading(false);
          return;
        }
        const supabase = createClient();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: err } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: origin ? `${origin}/auth/callback?next=/account` : undefined,
            data: { username: trimmedUsername },
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          const patchRes = await fetch("/api/account", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: trimmedUsername }),
          });
          if (!patchRes.ok) {
            const patchJson = await patchRes.json().catch(() => ({}));
            setError(patchJson.error || "Account created but could not set username. You can set it in Settings.");
            setLoading(false);
            return;
          }
          handleClose();
          router.refresh();
          onSignInSuccess?.();
          return;
        }
        if (data.user) {
          setSuccess("Check your email. Click the link to confirm — we'll log you in and take you to your account to start your free trial.");
        } else {
          setSuccess("Account created. You can log in now.");
        }
      } else {
        const supabase = createClient();
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          handleClose();
          router.refresh();
          onSignInSuccess?.();
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrial() {
    setActionLoading("trial");
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not start trial");
      if (json.url) {
        window.location.href = json.url;
        handleClose();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-bubble-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600"
          aria-label="Close"
        >
          <span className="text-xl leading-none">×</span>
        </button>

        {view === "loading" && (
          <p className="py-8 text-center text-neutral-500">Loading…</p>
        )}

        {view === "auth" && (
          <>
            <h2 id="quota-modal-title" className="pr-8 text-xl font-bold text-neutral-900">
              {mode === "signup" ? "Create your free account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === "signup"
                ? "Humanize AI text, bypass detectors, and get a 7-day free trial — no credit card required."
                : "Log in to continue using the humanizer and your tools."}
            </p>

            {mode === "signup" && (
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  Humanize AI writing in one click
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  Built to bypass GPTZero, Turnitin & more
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  7-day free trial — cancel anytime
                </li>
              </ul>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-700 shadow-soft transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-medium text-neutral-400">or continue with email</span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <div className="mt-3 flex gap-2 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                className={`border-b-2 px-2 pb-2 text-sm font-medium ${mode === "signup" ? "border-primary-600 text-primary-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className={`border-b-2 px-2 pb-2 text-sm font-medium ${mode === "login" ? "border-primary-600 text-primary-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}
              >
                Log in
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleAuthSubmit}>
              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {success && (
                <div className="rounded-xl bg-primary-50 px-3 py-2 text-sm text-primary-800">{success}</div>
              )}
              {mode === "signup" && (
                <div>
                  <label htmlFor="quota-modal-username" className="block text-sm font-medium text-neutral-700">
                    Username
                  </label>
                  <input
                    id="quota-modal-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={mode === "signup"}
                    autoComplete="username"
                    minLength={USERNAME_MIN}
                    maxLength={USERNAME_MAX}
                    pattern={USERNAME_REGEX.source}
                    title="Letters, numbers, underscores, and hyphens only"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="johndoe"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    {USERNAME_MIN}–{USERNAME_MAX} characters. Letters, numbers, underscores, and hyphens only.
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="quota-modal-email" className="block text-sm font-medium text-neutral-700">
                  Email
                </label>
                <input
                  id="quota-modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="quota-modal-password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <input
                  id="quota-modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 8 : undefined}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="••••••••"
                />
                {mode === "signup" && <p className="mt-1 text-xs text-neutral-500">At least 8 characters</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-bubble transition hover:bg-primary-700 disabled:opacity-50"
              >
                {mode === "signup" ? (loading ? "Creating account…" : "Create account") : (loading ? "Logging in…" : "Log in")}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-neutral-500">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-primary-600 hover:underline" onClick={handleClose}>Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary-600 hover:underline" onClick={handleClose}>Privacy Policy</Link>.
            </p>
          </>
        )}

        {view === "trial" && (
          <>
            <h2 id="quota-modal-title" className="pr-8 text-xl font-bold text-neutral-900">
              Get a free trial or start a subscription
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              You’re out of uses. Start a 7-day free trial or subscribe to continue.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStartTrial}
                disabled={actionLoading !== null}
                className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {actionLoading === "trial" ? "Opening…" : "Start free trial"}
              </button>
              <Link
                href="/pricing"
                onClick={handleClose}
                className="block w-full rounded-lg border border-neutral-300 bg-white py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                See plans
              </Link>
            </div>
          </>
        )}

        {view === "subscribe" && (
          <>
            <h2 id="quota-modal-title" className="pr-8 text-xl font-bold text-neutral-900">
              Subscribe to get more uses
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              You’ve used your free trial. Subscribe to continue using this tool.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/pricing"
                onClick={handleClose}
                className="block w-full rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700"
              >
                See plans & subscribe
              </Link>
              <Link
                href="/account"
                onClick={handleClose}
                className="block w-full rounded-lg border border-neutral-300 bg-white py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Go to account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
