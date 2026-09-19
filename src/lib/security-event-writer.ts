import "server-only";

import { isIP } from "node:net";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseSourceLabel, type SecurityEventKind } from "@/lib/security-events";

type RecordSecurityEventParams = {
  orgId: string;
  actorUserId: string | null;
  eventKind: SecurityEventKind;
  ip: string | null;
  userAgent: string | null;
  country?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

/** First XFF hop when it is a real inet value; otherwise null.
 *  Empty / "unknown" / non-IP strings are invalid for `inet` and would
 *  drop the whole security_events row. */
export function toInetOrNull(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const first = ip.split(",")[0]?.trim() ?? "";
  if (!first || first.length > 45) return null;
  return isIP(first) ? first : null;
}

/** Insert a security event row via service-role. Fire-and-forget safe —
 *  failures are logged but never surface to the user. */
export async function recordSecurityEvent(params: RecordSecurityEventParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const sourceLabel = parseSourceLabel(params.userAgent);
    const { error } = await admin.from("security_events").insert({
      org_id: params.orgId,
      actor_user_id: params.actorUserId,
      event_kind: params.eventKind,
      ip: toInetOrNull(params.ip),
      user_agent: params.userAgent,
      source_label: sourceLabel,
      country: params.country ?? null,
      metadata: params.metadata ?? null,
    });
    if (error) {
      console.error("[security-event] insert failed", error.message);
    }
  } catch (err) {
    console.error(
      "[security-event] unexpected error",
      err instanceof Error ? err.message : err,
    );
  }
}

/** Resolve the org_id(s) for a user from their active memberships. */
export async function resolveUserOrgIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data ?? []).map((r) => r.org_id);
}

/** Record a sign-in event for every org the user belongs to. */
export async function recordSignInEvent(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const orgIds = await resolveUserOrgIds(userId);
  await Promise.all(
    orgIds.map((orgId) =>
      recordSecurityEvent({
        orgId,
        actorUserId: userId,
        eventKind: "sign_in",
        ip,
        userAgent,
      }),
    ),
  );
}

/** Record a sign-out event for every org the user belongs to. */
export async function recordSignOutEvent(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const orgIds = await resolveUserOrgIds(userId);
  await Promise.all(
    orgIds.map((orgId) =>
      recordSecurityEvent({
        orgId,
        actorUserId: userId,
        eventKind: "sign_out",
        ip,
        userAgent,
      }),
    ),
  );
}
