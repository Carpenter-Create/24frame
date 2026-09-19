import type { LegalEntityRow } from "@/lib/legal-entities";
import { mapOrgLegalEntity } from "@/lib/legal-entities";
import { getOrgContext, type OrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export async function loadOrganizationWriteAccess(): Promise<{
  ctx: OrgContext;
  canEdit: boolean;
  entities: LegalEntityRow[];
} | null> {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  if (!ctx.activeOrg) {
    return { ctx, canEdit: false, entities: [] };
  }

  const supabase = await createClient();
  const orgId = ctx.activeOrg.id;
  const [canEditRes, entitiesRes] = await Promise.all([
    supabase.rpc("member_can", {
      p_uid: ctx.user.id,
      p_org: orgId,
      p_capability: "manage_settings",
    }),
    supabase.rpc("org_legal_entities", { p_org: orgId }),
  ]);

  return {
    ctx,
    canEdit: canEditRes.data === true,
    entities: (entitiesRes.data ?? []).map(mapOrgLegalEntity),
  };
}
