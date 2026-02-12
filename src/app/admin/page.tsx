"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type AdminStats = {
  site?: {
    appUrl: string | null;
    vercelUrl: string | null;
    vercelEnv: string | null;
    nodeEnv: string;
  };
    summary: {
    totalUsers: number;
    totalProfiles: number;
    totalSubscriptions: number;
    subscriptionsByStatus: Record<string, number>;
    subscriptionsByPlan: Record<string, number>;
    totalWordsUsed: number;
    totalAnonUses: number;
    totalAnonWords: number;
    usageRowsCount: number;
  };
  anonymousByPeriod?: {
    allTime: { uses: number; words: number };
    last30Days: { uses: number; words: number };
    last7Days: { uses: number; words: number };
    today: { uses: number; words: number };
  };
  recentProfiles: { id: string; email?: string | null; created_at?: string | null; trial_used?: boolean }[];
  authUsers?: { id: string; email?: string; created_at?: string }[];
  env: {
    supabase: boolean;
    stripe: boolean;
    anthropic: boolean;
    appUrl: string;
  };
  generatedAt: string;
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!secret.trim()) {
      setError("Enter your admin secret.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?secret=${encodeURIComponent(secret.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to load stats");
        setStats(null);
        return;
      }
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [secret]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Admin console</h1>

        {!stats ? (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input
                type="password"
                placeholder="Admin secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadStats()}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm w-64"
              />
              <button
                onClick={loadStats}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded px-4 py-2 text-sm font-medium"
              >
                {loading ? "Loading…" : "Load dashboard"}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setStats(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ← Change secret / sign out
              </button>
              <span className="text-zinc-500 text-xs">Updated {new Date(stats.generatedAt).toLocaleString()}</span>
            </div>

            {/* Site details */}
            {stats.site && (
              <section className="mb-8">
                <h2 className="text-lg font-medium mb-3">Site details</h2>
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-500">App URL</span>
                      <div className="font-mono text-zinc-300 truncate" title={stats.site.appUrl || ""}>{stats.site.appUrl || "—"}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Vercel URL</span>
                      <div className="font-mono text-zinc-300 truncate" title={stats.site.vercelUrl || ""}>{stats.site.vercelUrl || "—"}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Environment</span>
                      <div className="text-zinc-300">{stats.site.vercelEnv || stats.site.nodeEnv}</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Traffic & clicks */}
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-3">Traffic & clicks</h2>
              <p className="text-zinc-400 text-sm mb-3">
                Page views, unique visitors, and click data come from your analytics provider. Use the links below to view them.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500">
                  Vercel → Analytics & traffic
                </a>
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500">
                  Google Analytics
                </a>
              </div>
            </section>

            {/* Non-user (anonymous) uses */}
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-3">Non-user usage (anonymous)</h2>
              <p className="text-zinc-400 text-sm mb-3">
                Uses of the humanizer by visitors who haven’t signed in (tracked by cookie). Period breakdowns use the{" "}
                <code className="bg-zinc-800 px-1 rounded">anonymous_usage_events</code> table (see docs/SUPABASE_ANONYMOUS_EVENTS.md).
              </p>
              {stats.anonymousByPeriod ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-zinc-700 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900/50">
                        <th className="text-left p-3 font-medium">Period</th>
                        <th className="text-right p-3 font-medium">Uses</th>
                        <th className="text-right p-3 font-medium">Words</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-300">
                      <tr className="border-b border-zinc-800">
                        <td className="p-3">All time</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.allTime.uses.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.allTime.words.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-3">Last 30 days</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.last30Days.uses.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.last30Days.words.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-3">Last 7 days</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.last7Days.uses.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.last7Days.words.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-3">Today (UTC)</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.today.uses.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono">{stats.anonymousByPeriod.today.words.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-4">
                    <div className="text-2xl font-semibold">{stats.summary.totalAnonUses.toLocaleString()}</div>
                    <div className="text-xs text-zinc-400">Anonymous uses (all time)</div>
                  </div>
                  <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-4">
                    <div className="text-2xl font-semibold">{stats.summary.totalAnonWords.toLocaleString()}</div>
                    <div className="text-xs text-zinc-400">Anonymous words (all time)</div>
                  </div>
                </div>
              )}
            </section>

            {/* Env / services */}
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-3">Services & env</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`rounded-lg border p-3 ${stats.env.supabase ? "border-emerald-600/50 bg-emerald-950/20" : "border-red-600/50 bg-red-950/20"}`}>
                  <div className="font-medium text-sm">Supabase</div>
                  <div className="text-xs text-zinc-400">{stats.env.supabase ? "Configured" : "Missing keys"}</div>
                </div>
                <div className={`rounded-lg border p-3 ${stats.env.stripe ? "border-emerald-600/50 bg-emerald-950/20" : "border-red-600/50 bg-red-950/20"}`}>
                  <div className="font-medium text-sm">Stripe</div>
                  <div className="text-xs text-zinc-400">{stats.env.stripe ? "Configured" : "Missing keys"}</div>
                </div>
                <div className={`rounded-lg border p-3 ${stats.env.anthropic ? "border-emerald-600/50 bg-emerald-950/20" : "border-red-600/50 bg-red-950/20"}`}>
                  <div className="font-medium text-sm">Anthropic (AI)</div>
                  <div className="text-xs text-zinc-400">{stats.env.anthropic ? "Configured" : "Missing key"}</div>
                </div>
                <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-900/50">
                  <div className="font-medium text-sm">App URL</div>
                  <div className="text-xs text-zinc-400 truncate" title={stats.env.appUrl}>{stats.env.appUrl}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Vercel</a>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Supabase</a>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Stripe</a>
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Anthropic</a>
              </div>
            </section>

            {/* Summary */}
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-3">Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-900/50">
                  <div className="text-2xl font-semibold">{stats.summary.totalUsers}</div>
                  <div className="text-xs text-zinc-400">Users (auth)</div>
                </div>
                <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-900/50">
                  <div className="text-2xl font-semibold">{stats.summary.totalProfiles}</div>
                  <div className="text-xs text-zinc-400">Profiles</div>
                </div>
                <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-900/50">
                  <div className="text-2xl font-semibold">{stats.summary.totalSubscriptions}</div>
                  <div className="text-xs text-zinc-400">Subscriptions</div>
                </div>
                <div className="rounded-lg border border-zinc-700 p-3 bg-zinc-900/50">
                  <div className="text-2xl font-semibold">{stats.summary.totalWordsUsed.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">Words used (paid)</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span>By status: {Object.entries(stats.summary.subscriptionsByStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}</span>
                <span>By plan: {Object.entries(stats.summary.subscriptionsByPlan).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}</span>
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Logged-in usage rows: {stats.summary.usageRowsCount}
              </div>
            </section>

            {/* Recent users */}
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-3">Recent profiles (up to 50)</h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-900/50">
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Created</th>
                      <th className="text-left p-2 font-medium">Trial used</th>
                      <th className="text-left p-2 font-medium">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentProfiles.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-800">
                        <td className="p-2">{p.email ?? "—"}</td>
                        <td className="p-2 text-zinc-400">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
                        <td className="p-2">{p.trial_used ? "Yes" : "No"}</td>
                        <td className="p-2 font-mono text-xs text-zinc-500 truncate max-w-[120px]" title={p.id}>{p.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-zinc-500 text-sm">
              <Link href="/" className="text-emerald-400 hover:underline">Back to site</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
