"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { HOUSE_GRANT, houseGrantSchema, revokeInviteSchema } from "@/lib/account-invite";
import { inviteAcceptUrl, mintInviteToken } from "@/lib/account-invite-token";
import { sendHouseGrantEmail } from "@/lib/email";
import { isAuthSesSuppressedError } from "@/lib/auth-ses";
import { GC_CLIENTS_HREF } from "@/lib/clients";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

async function assertHouseGrantOperate(): Promise<{ error?: string }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: HOUSE_GRANT.signedOut };
  if (!ctx.isGcStaff) return { error: HOUSE_GRANT.forbidden };

  const supabase = await createClient();
  const { data: canOperate, error } = await supabase.rpc("gc_can", {
    p_uid: ctx.user.id,
    p_capability: "operate",
  });
  if (error || canOperate !== true) return { error: HOUSE_GRANT.forbidden };
  return {};
}

export async function grantHouseAccount(input: unknown): Promise<{ error?: string }> {
  const gate = await assertHouseGrantOperate();
  if (gate.error) return { error: gate.error };

  const parsed = houseGrantSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return { error: HOUSE_GRANT.invalidEmail };
    if (field === "orgName") return { error: HOUSE_GRANT.invalidOrg };
    return { error: HOUSE_GRANT.invalidTier };
  }

  const supabase = await createClient();
  const { token, tokenHash } = mintInviteToken();
  const { data: inviteId, error } = await supabase.rpc("grant_house_account", {
    p_email: parsed.data.email,
    p_org_name: parsed.data.orgName,
    p_tier: parsed.data.tier,
    p_token_hash: tokenHash,
  });
  if (error || !inviteId) {
    if (error?.message === "Not authorized") return { error: HOUSE_GRANT.forbidden };
    return { error: HOUSE_GRANT.sendFailed };
  }

  const hdrs = await headers();
  try {
    await sendHouseGrantEmail(parsed.data.email, inviteAcceptUrl(token, hdrs.get("origin")));
  } catch (err) {
    await Promise.resolve(supabase.rpc("revoke_account_invite", { p_id: inviteId })).catch(
      () => undefined,
    );
    if (isAuthSesSuppressedError(err)) return { error: HOUSE_GRANT.sendFailed };
    console.error("[account-invite] grant send failed", err instanceof Error ? err.message : err);
    return { error: HOUSE_GRANT.sendFailed };
  }

  revalidatePath(GC_CLIENTS_HREF);
  return {};
}

export async function revokeHouseGrant(input: unknown): Promise<{ error?: string }> {
  const gate = await assertHouseGrantOperate();
  if (gate.error) return { error: gate.error };

  const parsed = revokeInviteSchema.safeParse(input);
  if (!parsed.success) return { error: HOUSE_GRANT.revokeFailed };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_account_invite", { p_id: parsed.data.id });
  if (error) {
    if (error.message === "Not authorized") return { error: HOUSE_GRANT.forbidden };
    return { error: HOUSE_GRANT.revokeFailed };
  }

  revalidatePath(GC_CLIENTS_HREF);
  return {};
}
