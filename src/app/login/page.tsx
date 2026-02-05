"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/humanize");
      router.refresh();
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
          <h1 className="text-2xl font-bold text-neutral-900">Log in</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary-600 hover:underline">
              Sign up
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            By logging in, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
