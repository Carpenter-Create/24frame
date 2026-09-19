"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ACCOUNT_INVITE,
  revokeInviteSchema,
  teamInviteSchema,
} from "@/lib/account-invite";
import { LEGAL_ENTITIES } from "@/lib/legal-entities";
import { inviteAcceptUrl, mintInviteToken } from "@/lib/account-invite-token";
import { sendTeamInviteEmail } from "@/lib/email";
import { isAuthSesSuppressedError } from "@/lib/auth-ses";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

const ENTITY_TYPE_VALUES = [
  "sole_prop", "llc", "corporation", "partnership",
  "trust", "nonprofit", "individual", "other",
] as const;

const addEntitySchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  entityType: z.enum(ENTITY_TYPE_VALUES).default("other"),
  jurisdiction: z.string().trim().max(200).optional(),
});

export async function inviteTeamMember(input: unknown): Promise<{ error?: string }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: ACCOUNT_INVITE.signedOut };

  const parsed = teamInviteSchema.safeParse(input);
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find((issue) => issue.path[0] === "email");
    if (emailIssue) return { error: ACCOUNT_INVITE.invalidEmail };
    return { error: ACCOUNT_INVITE.invalidRole };
  }

  const supabase = await createClient();
  const { data: canInvite, error: canError } = await supabase.rpc("member_can", {
    p_uid: ctx.user.id,
    p_org: parsed.data.orgId,
    p_capability: "manage_team",
  });
  if (canError || canInvite !== true) return { error: ACCOUNT_INVITE.forbidden };

  const { token, tokenHash } = mintInviteToken();
  const { data: inviteId, error } = await supabase.rpc("invite_org_member", {
    p_org: parsed.data.orgId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_token_hash: tokenHash,
    p_entity_scope: parsed.data.entityScope ?? "all",
    p_entity_ids: parsed.data.entityScope === "selected" ? parsed.data.entityIds : undefined,
  });
  if (error || !inviteId) return { error: error?.message || ACCOUNT_INVITE.sendFailed };

  const hdrs = await headers();
  try {
    await sendTeamInviteEmail(parsed.data.email, inviteAcceptUrl(token, hdrs.get("origin")));
  } catch (err) {
    await Promise.resolve(supabase.rpc("revoke_account_invite", { p_id: inviteId })).catch(
      () => undefined,
    );
    if (isAuthSesSuppressedError(err)) return { error: ACCOUNT_INVITE.sendFailed };
    console.error("[account-invite] team send failed", err instanceof Error ? err.message : err);
    return { error: ACCOUNT_INVITE.sendFailed };
  }

  revalidatePath("/settings/organization");
  return {};
}

export async function revokeTeamInvite(input: unknown): Promise<{ error?: string }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: ACCOUNT_INVITE.signedOut };

  const parsed = revokeInviteSchema.safeParse(input);
  if (!parsed.success) return { error: ACCOUNT_INVITE.revokeFailed };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_account_invite", { p_id: parsed.data.id });
  if (error) return { error: error.message || ACCOUNT_INVITE.revokeFailed };

  revalidatePath("/settings/organization");
  return {};
}

export async function addLegalEntity(input: unknown): Promise<{ error?: string }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: LEGAL_ENTITIES.signedOut };

  const parsed = addEntitySchema.safeParse(input);
  if (!parsed.success) return { error: LEGAL_ENTITIES.nameRequired };

  const supabase = await createClient();
  const { data: canManage, error: canError } = await supabase.rpc("member_can", {
    p_uid: ctx.user.id,
    p_org: parsed.data.orgId,
    p_capability: "manage_settings",
  });
  if (canError || canManage !== true) return { error: LEGAL_ENTITIES.forbidden };

  const { error } = await supabase.rpc("create_legal_entity", {
    p_org_id: parsed.data.orgId,
    p_name: parsed.data.name,
    p_entity_type: parsed.data.entityType,
    p_jurisdiction: parsed.data.jurisdiction || undefined,
  });
  if (error) return { error: error.message || LEGAL_ENTITIES.addFailed };

  revalidatePath("/settings/organization");
  return {};
}
