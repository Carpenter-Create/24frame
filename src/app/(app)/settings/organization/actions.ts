"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  ACCOUNT_INVITE,
  revokeInviteSchema,
  teamInviteSchema,
} from "@/lib/account-invite";
import { inviteAcceptUrl, mintInviteToken } from "@/lib/account-invite-token";
import { sendTeamInviteEmail } from "@/lib/email";
import { isAuthSesSuppressedError } from "@/lib/auth-ses";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

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
