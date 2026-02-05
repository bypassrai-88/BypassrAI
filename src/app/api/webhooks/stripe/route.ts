import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { WORDS_BY_PLAN } from "@/lib/quota-user";

function getPlanFromPriceId(priceId: string | null): "lite" | "pro" | "premium" {
  if (!priceId) return "lite";
  if (priceId === process.env.STRIPE_LITE_PRICE_ID) return "lite";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return "lite";
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string | null;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

        if (!userId || !subscriptionId) {
          console.warn("checkout.session.completed missing client_reference_id or subscription", { userId, subscriptionId });
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = sub.current_period_end;
        const periodStart = sub.current_period_start;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const plan = getPlanFromPriceId(priceId);
        const wordsIncluded = WORDS_BY_PLAN[plan] ?? 5000;
        const isTrialing = sub.status === "trialing";
        const periodStartDate = new Date(periodStart * 1000).toISOString().slice(0, 10);

        await supabase.from("subscriptions").upsert(
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
          await supabase.from("profiles").update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() }).eq("id", userId);
        }

        if (isTrialing) {
          await supabase.from("profiles").update({ trial_used: true, updated_at: new Date().toISOString() }).eq("id", userId);
          await supabase.from("usage").upsert(
            {
              user_id: userId,
              period_start: periodStartDate,
              words_used: 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,period_start" }
          );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subId = sub.id;

        const { data: row } = await supabase.from("subscriptions").select("user_id").eq("stripe_subscription_id", subId).maybeSingle();
        if (!row) break;

        if (event.type === "customer.subscription.deleted") {
          await supabase
            .from("subscriptions")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("user_id", row.user_id);
        } else {
          const periodEnd = sub.current_period_end;
          const periodStart = sub.current_period_start;
          const priceId = sub.items.data[0]?.price?.id ?? null;
          const plan = getPlanFromPriceId(priceId);
          const isTrialing = sub.status === "trialing";
          const status = isTrialing ? "trial" : sub.status === "active" ? "active" : sub.status;
          const wordsIncluded = isTrialing ? 5000 : (WORDS_BY_PLAN[plan] ?? 5000);
          await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_price_id: priceId,
              plan: isTrialing ? "lite" : plan,
              words_included: wordsIncluded,
              current_period_start: new Date(periodStart * 1000).toISOString(),
              current_period_end: new Date(periodEnd * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", row.user_id);
        }
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
