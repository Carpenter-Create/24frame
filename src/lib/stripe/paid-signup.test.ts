import { describe, expect, it } from "vitest";

import { TIER_META } from "@/lib/agreements";

import { decidePaidSignup, isLiveSubscriptionStatus } from "./paid-signup";

describe("decidePaidSignup", () => {
  it("accepts a paid usd session only at the server tier price", () => {
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: TIER_META.pro.annualPriceCents,
        tier: "pro",
      }),
    ).toEqual({ ok: true, tier: "pro", priceCents: TIER_META.pro.annualPriceCents });

    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: TIER_META.premium.annualPriceCents,
        tier: "premium",
      }),
    ).toEqual({
      ok: true,
      tier: "premium",
      priceCents: TIER_META.premium.annualPriceCents,
    });
  });

  it("refuses unpaid and no-payment sessions even when the amount matches", () => {
    for (const paymentStatus of ["unpaid", "no_payment_required"] as const) {
      expect(
        decidePaidSignup({
          paymentStatus,
          currency: "usd",
          amountTotal: TIER_META.premium.annualPriceCents,
          tier: "premium",
        }),
      ).toEqual({ ok: false, reason: "unpaid" });
    }
  });

  it("refuses access and unknown tiers", () => {
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: 0,
        tier: "access",
      }),
    ).toEqual({ ok: false, reason: "tier" });
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: TIER_META.pro.annualPriceCents,
        tier: "enterprise",
      }),
    ).toEqual({ ok: false, reason: "tier" });
  });

  it("refuses an amount that is not the server price for the claimed tier", () => {
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: 0,
        tier: "pro",
      }),
    ).toEqual({ ok: false, reason: "amount" });
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: null,
        tier: "pro",
      }),
    ).toEqual({ ok: false, reason: "amount" });
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: TIER_META.pro.annualPriceCents - 1,
        tier: "pro",
      }),
    ).toEqual({ ok: false, reason: "amount" });
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "usd",
        amountTotal: TIER_META.pro.annualPriceCents,
        tier: "premium",
      }),
    ).toEqual({ ok: false, reason: "amount" });
    expect(
      decidePaidSignup({
        paymentStatus: "paid",
        currency: "eur",
        amountTotal: TIER_META.pro.annualPriceCents,
        tier: "pro",
      }),
    ).toEqual({ ok: false, reason: "amount" });
  });
});

describe("isLiveSubscriptionStatus", () => {
  it("accepts only an active subscription", () => {
    expect(isLiveSubscriptionStatus("active")).toBe(true);
    for (const status of [
      "trialing",
      "past_due",
      "unpaid",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "paused",
    ]) {
      expect(isLiveSubscriptionStatus(status)).toBe(false);
    }
  });
});
