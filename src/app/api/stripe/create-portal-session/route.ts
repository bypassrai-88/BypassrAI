import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session so the user can manage subscription, payment method, invoices.
 */
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  const customerId = profile?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe first to manage your subscription." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const returnUrl = `${baseUrl}/account`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
