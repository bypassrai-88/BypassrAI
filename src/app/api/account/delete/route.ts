import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/account/delete — Permanently delete the current user's account.
 * Cancels Stripe subscription if present, then deletes the auth user (Supabase cascades to profiles, subscriptions, usage).
 */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Cancel Stripe subscription if any
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  const { data: subRow } = await admin.from("subscriptions").select("stripe_subscription_id").eq("user_id", user.id).maybeSingle();

  if (process.env.STRIPE_SECRET_KEY && subRow?.stripe_subscription_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
      await stripe.subscriptions.cancel(subRow.stripe_subscription_id);
    } catch (err) {
      console.error("Stripe cancel on delete:", err);
      // Continue with delete even if Stripe fails (e.g. already canceled)
    }
  }

  // Delete auth user (cascades to profiles, subscriptions, usage via FK)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Auth delete user error:", deleteError);
    return NextResponse.json({ error: "Could not delete account. Please try again or contact support." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
