import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

// Rolling-window caps for dashboard magic-link send. Counted from
// dashboard_sign_in_requests (same durable-count pattern as portal_otps).
// In-memory is not enough on multi-instance Vercel.
export const DASHBOARD_SIGN_IN_RATE = {
  emailCooldownSeconds: 60,
  perEmailPerHour: 5,
  perIpPerHour: 20,
  globalPerHour: 100,
} as const;

export type DashboardSignInRateScope = "email-cooldown" | "email" | "ip" | "global";

export class DashboardSignInRateLimitError extends Error {
  readonly scope: DashboardSignInRateScope;

  constructor(scope: DashboardSignInRateScope) {
    super("rate-limited");
    this.name = "DashboardSignInRateLimitError";
    this.scope = scope;
  }
}

export function normalizeDashboardSignInEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function clientIpFromForwarded(raw: string | null): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim() ?? "";
  if (!first || first.length > 45) return null;
  return first;
}

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function countSince(
  admin: AdminClient,
  args: { email?: string; ip?: string; sinceIso: string },
): Promise<{ count: number | null; error: { message: string } | null }> {
  let query = admin
    .from("dashboard_sign_in_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", args.sinceIso);
  if (args.email) query = query.eq("email_normalized", args.email);
  if (args.ip) query = query.eq("ip", args.ip);
  return query;
}

// Fail-open on store errors so a pending migration or PostgREST blip cannot
// block Production sign-in. Caps engage once the table exists.
export async function assertDashboardSignInAllowed(args: {
  email: string;
  ip: string | null;
}): Promise<void> {
  const email = normalizeDashboardSignInEmail(args.email);
  const ip = args.ip;
  const admin = createAdminClient();
  const hourSince = new Date(Date.now() - 3_600_000).toISOString();
  const cooldownSince = new Date(
    Date.now() - DASHBOARD_SIGN_IN_RATE.emailCooldownSeconds * 1000,
  ).toISOString();

  const checks: Array<{
    scope: DashboardSignInRateScope;
    email?: string;
    ip?: string;
    sinceIso: string;
    limit: number;
  }> = [
    {
      scope: "email-cooldown",
      email,
      sinceIso: cooldownSince,
      limit: 1,
    },
    {
      scope: "email",
      email,
      sinceIso: hourSince,
      limit: DASHBOARD_SIGN_IN_RATE.perEmailPerHour,
    },
    {
      scope: "global",
      sinceIso: hourSince,
      limit: DASHBOARD_SIGN_IN_RATE.globalPerHour,
    },
  ];
  if (ip) {
    checks.splice(2, 0, {
      scope: "ip",
      ip,
      sinceIso: hourSince,
      limit: DASHBOARD_SIGN_IN_RATE.perIpPerHour,
    });
  }

  for (const check of checks) {
    const { count, error } = await countSince(admin, check);
    if (error) {
      console.error("[dashboard-sign-in] rate-limit read failed", error.message);
      return;
    }
    if ((count ?? 0) >= check.limit) {
      console.warn("[dashboard-sign-in] rate limited", {
        scope: check.scope,
        email: fingerprint(email),
        ip: ip ? fingerprint(ip) : null,
      });
      throw new DashboardSignInRateLimitError(check.scope);
    }
  }

  const { error: insertError } = await admin.from("dashboard_sign_in_requests").insert({
    email_normalized: email,
    ip,
  });
  if (insertError) {
    console.error("[dashboard-sign-in] rate-limit write failed", insertError.message);
  }
}
