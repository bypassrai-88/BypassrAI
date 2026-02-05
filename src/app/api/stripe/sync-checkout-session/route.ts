import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WORDS_BY_PLAN } from "@/lib/quota-user";

function getPlanFromPriceId(priceId: string | null): "lite" | "pro" | "premium" {
  if (!priceId) return "lite";
  if (priceId === process.env.STRIPE_LITE_PRICE_ID) return "lite";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return "lite";
}

async function syncSubscriptionFromStripe(
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe,
  userId: string,
  subscriptionId: string,
  customerId: string | null
) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = sub.current_period_end;
  const periodStart = sub.current_period_start;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const plan = getPlanFromPriceId(priceId);
  const wordsIncluded = WORDS_BY_PLAN[plan] ?? 5000;
  const isTrialing = sub.status === "trialing";
  const periodStartDate = new Date(periodStart * 1000).toISOString().slice(0, 10);

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      status: isTrialing ? "trial" : "active",
      plan: isTrialing ? "lite" : plan,
      words_included: isTrialing ? 5000 : wordsIncluded,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (customerId) {
    await admin.from("profiles").update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() }).eq("id", userId);
  }

  if (isTrialing) {
    await admin.from("profiles").update({ trial_used: true, updated_at: new Date().toISOString() }).eq("id", userId);
    await admin.from("usage").upsert(
      {
        user_id: userId,
        period_start: periodStartDate,
        words_used: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period_start" }
    );
  }
}

/**
 * POST /api/stripe/sync-checkout-session
 * After Stripe redirects to success URL, sync the subscription to our DB.
 * - If session_id is provided: retrieve that checkout session and sync (used when success URL includes {CHECKOUT_SESSION_ID}).
 * - If no session_id but success=1: try to find Stripe customer by user email and sync their latest subscription (fallback for old redirects).
 */
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const sessionId = body.session_id?.trim();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const admin = createAdminClient();

  if (sessionId && sessionId.startsWith("cs_")) {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error("Stripe session retrieve error:", err);
      return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
    }

    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string | null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    if (userId !== user.id) {
      return NextResponse.json({ error: "Session does not belong to this user." }, { status: 403 });
    }
    if (!subscriptionId) {
      return NextResponse.json({ error: "No subscription in this session." }, { status: 400 });
    }

    await syncSubscriptionFromStripe(admin, stripe, user.id, subscriptionId, customerId);
    return NextResponse.json({ ok: true });
  }

  // Fallback: no session_id (e.g. old success redirect). Find customer by email and sync latest subscription.
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) {
    return NextResponse.json({ error: "No Stripe customer found for this email." }, { status: 404 });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "all",
    limit: 1,
  });
  const sub = subscriptions.data[0];
  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  await syncSubscriptionFromStripe(admin, stripe, user.id, sub.id, customer.id);
  return NextResponse.json({ ok: true });
}
