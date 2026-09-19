import type { Database } from "@/lib/supabase/database.types";

// Shared org_role labels. Keep this module free of server-only imports
// so Settings Team (client) and the staff directory can share one map.

export type OrgRole = Database["public"]["Enums"]["org_role"];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  account_owner: "Account owner",
  accountant: "Accountant",
  legal: "Legal",
  delivery_ops: "Delivery ops",
  viewer: "Viewer",
};
