import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cancel trial: user keeps access until trial end but won't be charged.
 * Updates both our DB and Stripe so Stripe does not charge when the trial ends.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to cancel your trial." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, status, stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  if (!sub || sub.status !== "trial") {
    return NextResponse.json(
      { error: "You don't have an active trial to cancel." },
      { status: 400 }
    );
  }

  // Tell Stripe to cancel at period end so the customer is not charged when the trial ends
  if (process.env.STRIPE_SECRET_KEY && sub.stripe_subscription_id) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    try {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      console.error("Stripe trial cancel error:", err);
      return NextResponse.json(
        { error: "Could not cancel trial with billing provider. Please try again or use Manage subscription." },
        { status: 500 }
      );
    }
  }

  const { error } = await admin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Trial cancel DB error:", error);
    return NextResponse.json(
      { error: "Could not cancel trial. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Your trial is canceled. You can keep using your remaining words until the trial period ends. You will not be charged.",
  });
}
