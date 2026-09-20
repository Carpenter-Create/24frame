"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AGGREGATION_VIEW_AS_COOKIE,
  aggregationViewAsAuditRow,
  aggregationViewAsCookieOptions,
  parseAggregationViewAsOrgId,
} from "@/lib/aggregation-impersonation";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { workspaceHome } from "@/lib/workspace";

async function writeViewAsAudit(input: {
  actorId: string;
  orgId: string;
  orgName: string;
  action: "start" | "end";
}) {
  const admin = createAdminClient();
  return admin.from("audit_log").insert(aggregationViewAsAuditRow(input));
}

export async function startAggregationViewAs(formData: FormData): Promise<void> {
  const ctx = await getOrgContext();
  if (!ctx) return;
  if (!ctx.isGcStaff) return;

  const orgId = parseAggregationViewAsOrgId(String(formData.get("orgId") ?? ""));
  if (!orgId) return;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, status")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return;

  const { error } = await writeViewAsAudit({
    actorId: ctx.user.id,
    orgId: org.id,
    orgName: org.name,
    action: "start",
  });
  if (error) {
    console.error("[aggregation-view-as] start audit failed");
    return;
  }

  (await cookies()).set(AGGREGATION_VIEW_AS_COOKIE, org.id, aggregationViewAsCookieOptions());
  redirect(DASHBOARD_HREF);
}

export async function stopAggregationViewAs(): Promise<void> {
  const ctx = await getOrgContext();
  if (!ctx) return;
  if (!ctx.isGcStaff) return;

  const jar = await cookies();
  const orgId =
    parseAggregationViewAsOrgId(jar.get(AGGREGATION_VIEW_AS_COOKIE)?.value) ??
    ctx.aggregationViewAs?.orgId ??
    null;
  const orgName = ctx.aggregationViewAs?.orgName ?? ctx.activeOrg?.name ?? null;

  jar.set(AGGREGATION_VIEW_AS_COOKIE, "", {
    ...aggregationViewAsCookieOptions(),
    maxAge: 0,
  });

  if (orgId && orgName) {
    const { error } = await writeViewAsAudit({
      actorId: ctx.user.id,
      orgId,
      orgName,
      action: "end",
    });
    if (error) {
      console.error("[aggregation-view-as] end audit failed");
    }
  }

  redirect(workspaceHome("staff"));
}
