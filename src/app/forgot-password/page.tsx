"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">Forgot password?</h1>
          <p className="mt-1 text-sm text-neutral-500">
            We&apos;ll send you a link to reset your password.
          </p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-primary-50 p-4 text-sm text-primary-800">
              Check your email. If an account exists for {email}, you&apos;ll receive a reset link.
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-primary-600 hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
