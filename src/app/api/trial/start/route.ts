import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRIAL_WORDS_INCLUDED } from "@/lib/quota-user";
import { getStripeBaseUrl } from "@/lib/stripe-base-url";

const TRIAL_DAYS = 7;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;
const stripeLitePriceId = process.env.STRIPE_LITE_PRICE_ID;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to start a trial." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("trial_used")
      .eq("id", user.id)
      .single();

    if (profile?.trial_used) {
      return NextResponse.json(
        { error: "You've already used your free trial." },
        { status: 400 }
      );
    }

    if (stripe && stripeLitePriceId && typeof stripeLitePriceId === "string" && stripeLitePriceId.startsWith("price_")) {
      const baseUrl = getStripeBaseUrl();
      const { data: profileForCustomer } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
      const customerId = profileForCustomer?.stripe_customer_id ?? undefined;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: stripeLitePriceId, quantity: 1 }],
        subscription_data: { trial_period_days: TRIAL_DAYS },
        success_url: `${baseUrl}/account?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/account?cancel=1`,
        client_reference_id: user.id,
        customer: customerId || undefined,
        customer_email: customerId ? undefined : (user.email ?? undefined),
      });
      return NextResponse.json({ url: session.url });
    }

    // DB-only trial (no Stripe configured)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + TRIAL_DAYS);
    const periodStartStr = now.toISOString().slice(0, 10);

    const { error: subError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        status: "trial",
        plan: "trial",
        words_included: TRIAL_WORDS_INCLUDED,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      console.error("Trial start subscription error:", subError);
      return NextResponse.json(
        { error: "Could not start trial. Please try again." },
        { status: 500 }
      );
    }

    await admin
      .from("profiles")
      .update({ trial_used: true, updated_at: now.toISOString() })
      .eq("id", user.id);

    await admin.from("usage").upsert(
      {
        user_id: user.id,
        period_start: periodStartStr,
        words_used: 0,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id,period_start" }
    );

    return NextResponse.json({
      success: true,
      trial_ends_at: periodEnd.toISOString(),
      words_included: TRIAL_WORDS_INCLUDED,
    });
  } catch (err) {
    console.error("[trial/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start trial. Please try again." },
      { status: 500 }
    );
  }
}
