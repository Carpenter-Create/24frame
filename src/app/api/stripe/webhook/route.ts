import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  decidePaidSignup,
  isLiveSubscriptionStatus,
} from "@/lib/stripe/paid-signup";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook. Verifies the signature, then finalizes a paid signup only when the session is
// paid, the live subscription is active, and amount_total matches the server tier price.
// Metadata alone never activates. effective_from = the Stripe event timestamp, never now() (§5).
// Delayed methods: checkout.session.completed can arrive unpaid; async_payment_succeeded is the
// paid event. Both use the same gate. finalize_paid_signup stays idempotent.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "missing signature or secret" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error(`[stripe:webhook] invalid signature: ${e instanceof Error ? e.message : e}`);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    return fulfillPaidCheckout(event.data.object, event.created);
  }

  return NextResponse.json({ received: true });
}

async function fulfillPaidCheckout(
  session: Stripe.Checkout.Session,
  eventCreated: number,
): Promise<NextResponse> {
  const md = session.metadata ?? {};
  const tier = md.tier ?? "";
  const customerId =
    typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const subId =
    typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);

  if (!md.org_id || !tier || !md.source_document_id || !customerId || !subId) {
    console.error("[stripe:webhook] checkout session missing required metadata");
    return NextResponse.json({ received: true });
  }

  const decision = decidePaidSignup({
    paymentStatus: session.payment_status,
    currency: session.currency,
    amountTotal: session.amount_total,
    tier,
  });
  if (!decision.ok) {
    console.error(
      `[stripe:webhook] refused finalize (${decision.reason}) ` +
        `payment_status=${session.payment_status} tier=${tier} ` +
        `amount_total=${session.amount_total} currency=${session.currency}`,
    );
    return NextResponse.json({ received: true });
  }

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subId);
  } catch (e) {
    console.error(`[stripe:webhook] subscription retrieve failed: ${e instanceof Error ? e.message : e}`);
    return NextResponse.json({ error: "subscription lookup failed" }, { status: 500 });
  }

  // `incomplete` can still become active, so Stripe should retry the live read.
  // Any other non-active status will not, and a 500 would retry a permanent refusal.
  if (!isLiveSubscriptionStatus(subscription.status)) {
    console.error(`[stripe:webhook] subscription status ${subscription.status} is not live`);
    if (subscription.status === "incomplete") {
      return NextResponse.json({ error: "subscription not active" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("finalize_paid_signup", {
    p_org: md.org_id,
    p_tier: decision.tier,
    p_stripe_customer: customerId,
    p_stripe_subscription: subId,
    p_price_cents: decision.priceCents,
    p_effective_from: new Date(eventCreated * 1000).toISOString(),
    p_source_document_id: md.source_document_id,
  });
  if (error) {
    console.error(`[stripe:webhook] finalize_paid_signup failed: ${error.message}`);
    return NextResponse.json({ error: "finalize failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
