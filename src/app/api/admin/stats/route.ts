import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function requireAdminSecret(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const provided = (request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-admin-secret") ?? "").trim();
  return provided.length > 0 && secret === provided;
}

export async function GET(request: NextRequest) {
  if (!requireAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [
      profilesRes,
      subsRes,
      usageRes,
      anonRes,
      recentProfilesRes,
      subsWithUserRes,
      usageByUserRes,
      anonEventsForChartRes,
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("subscriptions").select("status, plan"),
      admin.from("usage").select("words_used"),
      admin.from("anonymous_usage").select("uses_count, words_used"),
      admin.from("profiles").select("id, email, created_at, trial_used").order("created_at", { ascending: false }).limit(50),
      admin.from("subscriptions").select("user_id, status, plan, current_period_end").order("current_period_end", { ascending: false }),
      admin.from("usage").select("user_id, words_used"),
      Promise.resolve(admin.from("anonymous_usage_events").select("created_at").gte("created_at", fourteenDaysAgo)).catch(() => ({ data: [] as { created_at?: string }[] })),
    ]);

    const subsWithUser = (subsWithUserRes as { data?: { user_id?: string; status?: string; plan?: string; current_period_end?: string }[] }).data ?? [];
    const usageByUserRows = (usageByUserRes as { data?: { user_id?: string; words_used?: number }[] }).data ?? [];
    const anonEventsForChart = (anonEventsForChartRes as { data?: { created_at?: string }[] }).data ?? [];

    // Top users by total words (sum across periods)
    const wordsByUser = usageByUserRows.reduce<Record<string, number>>((acc, r) => {
      const uid = r.user_id ?? "";
      if (!uid) return acc;
      acc[uid] = (acc[uid] ?? 0) + (Number(r.words_used) || 0);
      return acc;
    }, {});
    const topUserIds = Object.entries(wordsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([id]) => id);

    // Fetch emails for subscription users and top users (unique ids, no Set to avoid downlevelIteration)
    const allIds = subsWithUser.map((s) => s.user_id).filter((id): id is string => Boolean(id)).concat(topUserIds);
    const idsForEmail = allIds.filter((id, i) => allIds.indexOf(id) === i);
    let emailByUserId: Record<string, string> = {};
    if (idsForEmail.length > 0) {
      const { data: profileRows } = await admin.from("profiles").select("id, email").in("id", idsForEmail);
      const profiles = (profileRows ?? []) as { id: string; email?: string }[];
      profiles.forEach((p) => {
        emailByUserId[p.id] = p.email ?? "—";
      });
    }

    const subscriptionsWithEmail = subsWithUser.map((s) => ({
      user_id: s.user_id,
      email: emailByUserId[s.user_id ?? ""] ?? "—",
      status: s.status ?? "—",
      plan: s.plan ?? "—",
      current_period_end: s.current_period_end ?? null,
    }));

    const topUsersByWords = topUserIds.map((id) => ({
      user_id: id,
      email: emailByUserId[id] ?? "—",
      words_used: wordsByUser[id] ?? 0,
    }));

    // Anonymous uses by day (last 14 days, UTC)
    const dayCounts: Record<string, number> = {};
    for (let d = 13; d >= 0; d--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - d);
      const key = date.toISOString().slice(0, 10);
      dayCounts[key] = 0;
    }
    anonEventsForChart.forEach((e) => {
      const day = (e.created_at ?? "").slice(0, 10);
      if (day && dayCounts.hasOwnProperty(day)) dayCounts[day]++;
    });
    const anonByDay = Object.entries(dayCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, uses]) => ({ date, uses }));

    const profileCount = (profilesRes as { count?: number }).count ?? 0;
    const subscriptions = subsRes.data ?? [];
    const usageRows = usageRes.data ?? [];
    const anonRows = anonRes.data ?? [];
    const recentProfiles = recentProfilesRes.data ?? [];

    const subByStatus = subscriptions.reduce<Record<string, number>>((acc, s) => {
      const key = (s as { status?: string }).status ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const subByPlan = subscriptions.reduce<Record<string, number>>((acc, s) => {
      const key = (s as { plan?: string }).plan ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const totalWordsUsed = usageRows.reduce((sum, r) => sum + (Number((r as { words_used?: number }).words_used) || 0), 0);
    const totalAnonUses = anonRows.reduce((sum, r) => sum + (Number((r as { uses_count?: number }).uses_count) || 0), 0);
    const totalAnonWords = anonRows.reduce((sum, r) => sum + (Number((r as { words_used?: number }).words_used) || 0), 0);

    // Anonymous usage by period (from anonymous_usage_events if table exists)
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let anonByPeriod: {
      allTime: { uses: number; words: number };
      last30Days: { uses: number; words: number };
      last7Days: { uses: number; words: number };
      today: { uses: number; words: number };
    } = {
      allTime: { uses: totalAnonUses, words: totalAnonWords },
      last30Days: { uses: 0, words: 0 },
      last7Days: { uses: 0, words: 0 },
      today: { uses: 0, words: 0 },
    };

    try {
      const { data: eventRows } = await admin
        .from("anonymous_usage_events")
        .select("words_used, created_at")
        .gte("created_at", thirtyDaysAgo);
      const events = (eventRows ?? []) as { words_used?: number; created_at?: string }[];
      const w = (r: { words_used?: number }) => Number(r?.words_used) || 0;
      anonByPeriod.last30Days = {
        uses: events.length,
        words: events.reduce((s, r) => s + w(r), 0),
      };
      const last7 = events.filter((e) => (e.created_at ?? "") >= sevenDaysAgo);
      anonByPeriod.last7Days = { uses: last7.length, words: last7.reduce((s, r) => s + w(r), 0) };
      const today = events.filter((e) => (e.created_at ?? "") >= startOfTodayUTC);
      anonByPeriod.today = { uses: today.length, words: today.reduce((s, r) => s + w(r), 0) };
    } catch {
      // anonymous_usage_events table may not exist; all-time is still from anonymous_usage
    }

    let authUsers: { id: string; email?: string; created_at?: string }[] = [];
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
      authUsers = (authData?.users ?? []).map((u) => ({ id: u.id, email: u.email, created_at: u.created_at }));
    } catch {
      // Fallback: use recent profiles as user list (no auth.admin)
    }

    const envChecks = {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_LITE_PRICE_ID),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "(not set, Vercel URL used)",
    };

    const site = {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
      vercelUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      vercelEnv: process.env.VERCEL_ENV || null,
      nodeEnv: process.env.NODE_ENV || "development",
    };

    return NextResponse.json({
      site,
      summary: {
        totalUsers: authUsers.length > 0 ? authUsers.length : profileCount,
        totalProfiles: profileCount,
        totalSubscriptions: subscriptions.length,
        subscriptionsByStatus: subByStatus,
        subscriptionsByPlan: subByPlan,
        totalWordsUsed,
        totalAnonUses,
        totalAnonWords,
        usageRowsCount: usageRows.length,
      },
      anonymousByPeriod: anonByPeriod,
      anonByDay,
      subscriptionsWithEmail,
      topUsersByWords,
      recentProfiles: recentProfiles.map((p) => ({
        id: (p as { id: string }).id,
        email: (p as { email?: string }).email,
        created_at: (p as { created_at?: string }).created_at,
        trial_used: (p as { trial_used?: boolean }).trial_used,
      })),
      authUsers: authUsers.length > 0 ? authUsers : undefined,
      env: envChecks,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load stats" }, { status: 500 });
  }
}
