import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { DETAIL_LIST, UNPAGINATED_MAX, splitProbe } from "@/lib/list-bounds";
import { normalizeMyDeliveries, type DeliveryBrowseRow } from "@/lib/deliveries-browse";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * House ceiling for my_* list RPCs. Below PostgREST max_rows (1000). SQL hard
 * max is this + 1 (probe). Keep 501 in lockstep with
 * supabase/migrations/20260914310000_bound_my_rpcs.sql.
 */
export const MY_LIST_LIMIT = UNPAGINATED_MAX;
export const MY_LIST_HARD_MAX = UNPAGINATED_MAX + 1;
export const MY_TITLE_DELIVERIES_LIMIT = DETAIL_LIST;

export type BoundedList<T> = { rows: T[]; truncated: boolean };

export type MyFindingRow = Database["public"]["Functions"]["my_findings"]["Returns"][number];
export type MyNotificationRow =
  Database["public"]["Functions"]["my_notifications"]["Returns"][number];

/**
 * Probe one past the cap so a short list cannot look finished.
 * Omit p_title_id (do not pass null) — optional-detach rule.
 */
export async function loadMyDeliveries(
  supabase: ServerClient,
  opts?: { titleId?: string; limit?: number },
): Promise<BoundedList<DeliveryBrowseRow>> {
  const limit = opts?.limit ?? MY_LIST_LIMIT;
  const args: { p_limit: number; p_title_id?: string } = { p_limit: limit + 1 };
  if (opts?.titleId) args.p_title_id = opts.titleId;
  const { data } = await supabase.rpc("my_deliveries", args);
  const probed = splitProbe(data, limit);
  return { rows: normalizeMyDeliveries(probed.rows), truncated: probed.truncated };
}

export async function loadMyFindings(
  supabase: ServerClient,
  opts?: { orgId?: string; limit?: number },
): Promise<BoundedList<MyFindingRow>> {
  const limit = opts?.limit ?? MY_LIST_LIMIT;
  const args: { p_limit: number; p_org_id?: string } = { p_limit: limit + 1 };
  if (opts?.orgId) args.p_org_id = opts.orgId;
  const { data } = await supabase.rpc("my_findings", args);
  return splitProbe(data as MyFindingRow[] | null, limit);
}

export async function loadMyNotifications(
  supabase: ServerClient,
  opts?: { limit?: number },
): Promise<BoundedList<MyNotificationRow>> {
  const limit = opts?.limit ?? MY_LIST_LIMIT;
  const { data } = await supabase.rpc("my_notifications", { p_limit: limit + 1 });
  return splitProbe(data as MyNotificationRow[] | null, limit);
}
