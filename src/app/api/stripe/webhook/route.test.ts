import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import { TIER_META } from "@/lib/agreements";

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "./route";

const SECRET = "whsec_test_secret";
const ORG = "550e8400-e29b-41d4-a716-446655440000";
const DOC = "11111111-2222-4333-8444-555555555555";
const CREATED = 1_725_000_000;

function webhookRequest() {
  return new Request("http://test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=test" },
    body: "{}",
  });
}

function session(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test",
    object: "checkout.session",
    payment_status: "paid",
    currency: "usd",
    amount_total: TIER_META.pro.annualPriceCents,
    customer: "cus_123",
    subscription: "sub_123",
    metadata: { org_id: ORG, tier: "pro", source_document_id: DOC },
    ...overrides,
  } as Stripe.Checkout.Session;
}

function event(
  type: Stripe.Event.Type,
  object: Stripe.Event.Data.Object = session(),
): Stripe.Event {
  return {
    id: "evt_test",
    object: "event",
    type,
    created: CREATED,
    data: { object },
  } as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
    status: "active",
  } as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>);
});

describe("POST /api/stripe/webhook", () => {
  it("finalizes a paid active subscription at the server tier price", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event("checkout.session.completed"));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
    expect(rpc).toHaveBeenCalledWith("finalize_paid_signup", {
      p_org: ORG,
      p_tier: "pro",
      p_stripe_customer: "cus_123",
      p_stripe_subscription: "sub_123",
      p_price_cents: TIER_META.pro.annualPriceCents,
      p_effective_from: new Date(CREATED * 1000).toISOString(),
      p_source_document_id: DOC,
    });
  });

  it("finalizes checkout.session.async_payment_succeeded under the same gate", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event(
        "checkout.session.async_payment_succeeded",
        session({
          amount_total: TIER_META.premium.annualPriceCents,
          metadata: { org_id: ORG, tier: "premium", source_document_id: DOC },
          subscription: { id: "sub_premium" } as Stripe.Subscription,
          customer: { id: "cus_premium" } as Stripe.Customer,
        }),
      ),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_premium");
    expect(rpc).toHaveBeenCalledWith(
      "finalize_paid_signup",
      expect.objectContaining({
        p_tier: "premium",
        p_price_cents: TIER_META.premium.annualPriceCents,
        p_stripe_customer: "cus_premium",
        p_stripe_subscription: "sub_premium",
      }),
    );
  });

  it("does not finalize from metadata when payment_status is not paid", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event("checkout.session.completed", session({ payment_status: "unpaid" })),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("does not finalize when amount_total is not the server tier price", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event("checkout.session.completed", session({ amount_total: 0 })),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("does not finalize a premium claim paid at the pro price", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event(
        "checkout.session.completed",
        session({
          amount_total: TIER_META.pro.annualPriceCents,
          metadata: { org_id: ORG, tier: "premium", source_document_id: DOC },
        }),
      ),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("does not finalize when the live subscription is not active", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event("checkout.session.completed"));
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: "trialing",
    } as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>);

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry while a paid subscription is still incomplete", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event("checkout.session.completed"));
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: "incomplete",
    } as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>);

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "subscription not active" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("retries when the live subscription cannot be read", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event("checkout.session.completed"));
    vi.mocked(stripe.subscriptions.retrieve).mockRejectedValue(new Error("stripe down"));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "subscription lookup failed" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("ignores events other than the paid checkout events", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event("checkout.session.async_payment_failed", session()),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("does not finalize a session missing metadata", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      event("checkout.session.completed", session({ metadata: {} })),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before any lookup", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("bad sig");
    });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(400);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects a missing signature", async () => {
    const res = await POST(
      new Request("http://test/api/stripe/webhook", { method: "POST", body: "{}" }),
    );

    expect(res.status).toBe(400);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
