import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeBaseUrl } from "@/lib/stripe-base-url";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  lite: process.env.STRIPE_LITE_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "You must be logged in to subscribe." }, { status: 401 });
    }

    let body: { plan?: string; success_url?: string; cancel_url?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const plan = (body.plan && PLAN_PRICE_IDS[body.plan] ? body.plan : "lite") as keyof typeof PLAN_PRICE_IDS;
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId || typeof priceId !== "string" || !priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: `Invalid or missing Stripe Price ID for plan "${plan}". Set STRIPE_${plan.toUpperCase()}_PRICE_ID in your environment (e.g. Vercel).` },
        { status: 500 }
      );
    }

    const baseUrl = getStripeBaseUrl(request.nextUrl.origin);
    const successUrl = body.success_url || `${baseUrl}/account?success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancel_url || `${baseUrl}/account?cancel=1`;

    const admin = createAdminClient();
    const [
      { data: profile },
      { data: existingSub },
    ] = await Promise.all([
      admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle(),
      admin.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
    ]);
    const customerId = profile?.stripe_customer_id ?? undefined;

    const hasActiveOrTrial = existingSub?.status === "active" || existingSub?.status === "trial";
    if (hasActiveOrTrial && customerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/account`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: customerId ? undefined : user.email,
      customer: customerId || undefined,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
