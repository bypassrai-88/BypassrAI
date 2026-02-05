"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountData = {
  email: string | null;
  created_at?: string | null;
  profile: { trial_used: boolean; can_manage_billing?: boolean; username?: string | null };
  subscription: {
    status: string;
    plan: string | null;
    words_included: number;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  usage: { words_used: number; period_start: string } | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (message?.type === "success") {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message?.type, message?.text]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const sessionId = params?.get("session_id");
      const success = params?.get("success") === "1";
      if (success) {
        try {
          await fetch("/api/stripe/sync-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionId?.startsWith("cs_") ? { session_id: sessionId } : {}),
          });
        } catch {
          // ignore sync errors
        }
        router.replace("/account", { scroll: false });
      }
      fetchAccount();
    });
  }, [router, fetchAccount]);

  async function handleStartTrial() {
    setActionLoading("trial");
    setMessage(null);
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not start trial");
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setMessage({ type: "success", text: "Free trial started! You have 5,000 words for 7 days." });
      await fetchAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not open billing portal");
      if (json.url) window.location.href = json.url;
      else throw new Error("No portal URL returned");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelTrial() {
    setActionLoading("cancel");
    setMessage(null);
    try {
      const res = await fetch("/api/trial/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel trial");
      setMessage({ type: "success", text: json.message || "Trial canceled. You can keep using your remaining words until the trial period ends." });
      await fetchAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setActionLoading(null);
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
        <div className="h-9 w-48 animate-pulse rounded bg-neutral-200" />
        <p className="mt-2 h-5 w-72 animate-pulse rounded bg-neutral-100" />
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
              <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 h-5 w-36 animate-pulse rounded bg-neutral-100" />
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-28 animate-pulse rounded-lg bg-neutral-100" />
              <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-100" />
            </div>
          </div>
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
        <p className="text-neutral-600">Could not load account.</p>
        </div>
      </div>
    );
  }

  const sub = data.subscription;
  const isTrial = sub?.status === "trial";
  const isActive = sub?.status === "active";
  const isPremium = sub?.plan === "premium";
  const canStartTrial = !sub && !data.profile.trial_used;
  const canCancelTrial = isTrial && !sub?.cancel_at_period_end;
  const canManageBilling = data.profile.can_manage_billing ?? false;
  const showUpgradeAndCancel = !isPremium;
  const planLabels: Record<string, string> = {
    lite: "Lite ($4.99/mo)",
    pro: "Pro ($9.99/mo)",
    premium: "Premium ($25/mo)",
  };
  const planLabel = isTrial
    ? "Free trial"
    : isActive
      ? (sub?.plan ? planLabels[sub.plan] ?? sub.plan : "Paid")
      : "No plan";

  return (
    <div className="min-h-[60vh] bg-page-gradient">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Account</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Your account details and subscription.
        </p>

      {message && (
        <div className={`mt-4 rounded-xl p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-primary-50 text-primary-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
          <dl className="mt-4 space-y-2">
            {data.profile.username && (
              <div>
                <dt className="text-sm text-neutral-500">Username</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">{data.profile.username}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-neutral-500">Email</dt>
              <dd className="mt-0.5 font-medium text-neutral-900">{data.email}</dd>
            </div>
            {data.created_at && (
              <div>
                <dt className="text-sm text-neutral-500">User since</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">
                  {new Date(data.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
            )}
          </dl>
          <Link
            href="/account/settings"
            className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Settings →
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Plan</h2>
          <p className="mt-2 font-medium text-neutral-900">{planLabel}</p>
          {sub?.current_period_end && (
            <p className="mt-1 text-sm text-neutral-500">
              {isTrial ? "Trial ends" : "Period ends"}: {new Date(sub.current_period_end).toLocaleDateString()}
              {isTrial && sub.cancel_at_period_end && " (canceled — access until then)"}
              {isTrial && !sub.cancel_at_period_end && " — Converts to Lite ($4.99/mo) if you don’t cancel."}
            </p>
          )}
          {data.usage && sub && (
            <p className="mt-2 text-sm text-neutral-600">
              Words used this period: {data.usage.words_used.toLocaleString()} / {sub.words_included.toLocaleString()}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {canStartTrial && (
              <div>
                <p className="mb-2 text-sm text-neutral-600">
                  Get 5,000 words for 7 days. You may be asked to add your card; you're charged $4.99/mo only after the trial unless you cancel.
                </p>
                <button
                  type="button"
                  onClick={handleStartTrial}
                  disabled={actionLoading !== null}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading === "trial" ? "Starting…" : "Start free trial"}
                </button>
              </div>
            )}
            {showUpgradeAndCancel && canCancelTrial && (
              <button
                type="button"
                onClick={handleCancelTrial}
                disabled={actionLoading !== null}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {actionLoading === "cancel" ? "Canceling…" : "Cancel trial (keep words until period end)"}
              </button>
            )}
            {canManageBilling && (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={actionLoading !== null}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {actionLoading === "portal" ? "Opening…" : "Manage subscription"}
              </button>
            )}
            {showUpgradeAndCancel && (isTrial || isActive) && (
              <Link
                href="/pricing"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 hover:bg-primary-700"
              >
                Upgrade subscription
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/account/settings"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Settings
          </Link>
          <Link
            href="/humanize"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Go to Humanizer
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900"
          >
            Log out
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
