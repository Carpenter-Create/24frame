import "server-only";
import type Stripe from "stripe";

import { TIER_META } from "@/lib/agreements";

// Paid Checkout tiers. Access has no annual Stripe price and must not activate here.
export const PAID_SIGNUP_TIERS = ["pro", "premium"] as const;
export type PaidSignupTier = (typeof PAID_SIGNUP_TIERS)[number];

// Checkout does not start a trial. Only `active` means Stripe has collected the subscription.
export const LIVE_SUBSCRIPTION_STATUS = "active" satisfies Stripe.Subscription.Status;

export type PaidSignupRefusal = "unpaid" | "tier" | "amount";

export type PaidSignupDecision =
  | { ok: true; tier: PaidSignupTier; priceCents: number }
  | { ok: false; reason: PaidSignupRefusal };

export function isPaidSignupTier(tier: string): tier is PaidSignupTier {
  return (PAID_SIGNUP_TIERS as readonly string[]).includes(tier);
}

/** Same cents Checkout charges (`TIER_META`). Not the webhook payload. */
export function serverTierPriceCents(tier: PaidSignupTier): number {
  return TIER_META[tier].annualPriceCents;
}

/**
 * Session-side gate before finalize_paid_signup.
 * Metadata, a signed event, and a non-null amount are not payment.
 * Amount must equal the server tier price in USD; Checkout adds no tax or discount.
 */
export function decidePaidSignup(input: {
  paymentStatus: Stripe.Checkout.Session.PaymentStatus;
  currency: string | null;
  amountTotal: number | null;
  tier: string;
}): PaidSignupDecision {
  if (input.paymentStatus !== "paid") return { ok: false, reason: "unpaid" };
  if (!isPaidSignupTier(input.tier)) return { ok: false, reason: "tier" };
  const priceCents = serverTierPriceCents(input.tier);
  if (input.currency !== "usd" || input.amountTotal !== priceCents) {
    return { ok: false, reason: "amount" };
  }
  return { ok: true, tier: input.tier, priceCents };
}

export function isLiveSubscriptionStatus(status: string): boolean {
  return status === LIVE_SUBSCRIPTION_STATUS;
}
