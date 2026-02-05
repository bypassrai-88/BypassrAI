"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountData = {
  email: string | null;
  created_at?: string | null;
  profile: { username?: string | null; can_manage_billing?: boolean };
  subscription: { plan: string | null; words_included: number } | null;
  usage: { words_used: number; period_start: string } | null;
};

type UsageRow = { period_start: string; words_used: number };

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/account");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load account");
      setData(json);
      setUsername(json.profile?.username ?? "");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchUsageHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/account/usage");
      if (res.ok) {
        const json = await res.json();
        setUsageHistory(json.usage ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      fetchAccount();
      fetchUsageHistory();
    });
  }, [router, fetchAccount, fetchUsageHistory]);

  useEffect(() => {
    if (message?.type === "success") {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message?.type, message?.text]);

  async function handlePasswordReset() {
    if (!data?.email) return;
    setPasswordResetLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/account/settings?reset=1`,
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Check your email for the password reset link." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not send reset email." });
    } finally {
      setPasswordResetLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete account");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
      setDeleteLoading(false);
    }
  }

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setUsernameSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update username");
      setMessage({ type: "success", text: "Username updated." });
      fetchAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not open billing portal");
      if (json.url) window.location.href = json.url;
      else throw new Error("No portal URL");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-page-gradient">
        <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 h-9 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] bg-page-gradient">
        <div className="mx-auto max-w-2xl px-4 py-12">
        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-primary-50 text-primary-800"}`}>
            {message.text}
          </div>
        )}
        <p className="text-neutral-600">Could not load settings.</p>
        <Link href="/account" className="mt-4 inline-block text-primary-600 hover:underline">Back to Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-page-gradient">
      <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Settings</span>
        </h1>
        <Link href="/account" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          ← Account
        </Link>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-primary-50 text-primary-800"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <p className="mt-1 text-neutral-900">{data.email}</p>
              <p className="mt-0.5 text-xs text-neutral-500">Email cannot be changed here.</p>
            </div>
            {data.created_at && (
              <div>
                <label className="block text-sm font-medium text-neutral-700">User since</label>
                <p className="mt-1 text-neutral-900">
                  {new Date(data.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            <form onSubmit={handleSaveUsername} className="space-y-2">
              <label htmlFor="settings-username" className="block text-sm font-medium text-neutral-700">
                Username
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  minLength={2}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_-]+"
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="submit"
                  disabled={usernameSaving}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 hover:bg-primary-700 disabled:opacity-50"
                >
                  {usernameSaving ? "Saving…" : "Save"}
                </button>
              </div>
              <p className="text-xs text-neutral-500">2–30 characters. Letters, numbers, underscores, and hyphens only.</p>
            </form>
          </div>
        </section>

        {/* Password */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Password</h2>
          <p className="mt-1 text-sm text-neutral-600">
            We'll send you an email with a link to set a new password.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={passwordResetLoading}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {passwordResetLoading ? "Sending…" : "Email me a link to reset my password"}
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Billing & payments</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your subscription, payment method, and view invoice history.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={portalLoading || !data.profile.can_manage_billing}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 hover:bg-primary-700 disabled:opacity-50"
            >
              {portalLoading ? "Opening…" : "Manage subscription & payment history"}
            </button>
            {!data.profile.can_manage_billing && (
              <p className="mt-2 text-xs text-neutral-500">Subscribe or start a trial to access billing.</p>
            )}
          </div>
        </section>

        {/* Usage */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Usage history</h2>
          {data.usage && data.subscription && (
            <p className="mt-1 text-sm text-neutral-600">
              This period: {data.usage.words_used.toLocaleString()} / {data.subscription.words_included.toLocaleString()} words
            </p>
          )}
          {usageHistory.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Period</th>
                    <th className="px-4 py-2 text-right font-medium text-neutral-700">Words used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {usageHistory.map((row) => (
                    <tr key={row.period_start}>
                      <td className="px-4 py-2 text-neutral-900">{row.period_start}</td>
                      <td className="px-4 py-2 text-right text-neutral-600">{row.words_used.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No usage history yet.</p>
          )}
        </section>

        {/* Delete account */}
        <section className="rounded-xl border border-red-200 bg-red-50/30 p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Delete account</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Permanently delete your account and all data. Your subscription will be canceled. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-neutral-700">Type DELETE to confirm:</p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full max-w-xs rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleteLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting…" : "Permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Log out */}
        <section className="border-t border-neutral-200 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900"
          >
            Log out
          </button>
        </section>
      </div>
      </div>
    </div>
  );
}
