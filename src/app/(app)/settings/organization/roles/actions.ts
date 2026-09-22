"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROLES_CATALOG, ORG_CAPABILITIES } from "@/lib/org-roles";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

const createRoleSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(""),
  capabilities: z.array(z.enum(ORG_CAPABILITIES)).min(1),
});

export async function createCustomRole(
  input: unknown,
): Promise<{ error?: string; id?: string }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: ROLES_CATALOG.forbidden };

  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) {
    const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
    if (nameIssue) return { error: ROLES_CATALOG.nameRequired };
    return { error: ROLES_CATALOG.capabilitiesRequired };
  }

  const supabase = await createClient();
  const { data: canManage, error: canError } = await supabase.rpc("member_can", {
    p_uid: ctx.user.id,
    p_org: parsed.data.orgId,
    p_capability: "manage_team",
  });
  if (canError || canManage !== true) return { error: ROLES_CATALOG.forbidden };

  const { data: roleId, error } = await supabase.rpc("create_org_custom_role", {
    p_org: parsed.data.orgId,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_capabilities: parsed.data.capabilities,
  });

  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { error: ROLES_CATALOG.duplicateName };
    }
    return { error: error.message || ROLES_CATALOG.saveFailed };
  }

  revalidatePath("/settings/organization/roles");
  return { id: roleId ?? undefined };
}
