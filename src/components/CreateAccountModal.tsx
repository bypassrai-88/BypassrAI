"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CreateAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateAccountModal({ open, onClose }: CreateAccountModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const check = await res.json().catch(() => ({}));
        if (check.exists) {
          setError("An account with this email already exists. Log in instead.");
          setLoading(false);
          return;
        }
        const supabase = createClient();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: origin ? `${origin}/auth/callback?next=/account` : undefined,
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          handleClose();
          router.refresh();
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
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-account-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg"
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
        <h2 id="create-account-title" className="pr-8 text-xl font-bold text-neutral-900">
          Create an account to use more
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Sign up for a free trial. No credit card required.
        </p>
        <div className="mt-4 flex gap-2 border-b border-neutral-200">
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
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">{success}</div>
          )}
          <div>
            <label htmlFor="modal-email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="modal-email"
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
            <label htmlFor="modal-password" className="block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={mode === "signup" ? 8 : undefined}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="••••••••"
            />
            {mode === "signup" && <p className="mt-1 text-xs text-neutral-500">At least 8 characters</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
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
      </div>
    </div>
  );
}
