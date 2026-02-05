"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const usernameError = validateUsername(trimmedUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    setLoading(true);
    try {
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
        router.push("/account");
        router.refresh();
        return;
      }
      if (data.user) {
        setSuccess("Check your email. Click the link to confirm — we'll log you in and take you to your account to start your free trial.");
      } else {
        setSuccess("Account created. You can log in now.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">Try for free</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Get a free trial. No credit card required.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              Log in
            </Link>
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="space-y-1">
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
                {error.includes("Failed to fetch") && (
                  <p className="text-xs text-neutral-500">
                    Check your connection. If using Supabase: restart dev server after setting .env.local, and ensure the project is not paused in the Supabase dashboard.
                  </p>
                )}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
                {success}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                minLength={USERNAME_MIN}
                maxLength={USERNAME_MAX}
                pattern={USERNAME_REGEX.source}
                title="Letters, numbers, underscores, and hyphens only"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="johndoe"
              />
              <p className="mt-1 text-xs text-neutral-500">
                {USERNAME_MIN}–{USERNAME_MAX} characters. Letters, numbers, underscores, and hyphens only.
              </p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-neutral-500">At least 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
