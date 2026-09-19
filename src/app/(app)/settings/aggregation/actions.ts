"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { issueDashboardSignInLink } from "@/lib/auth-magic-link";
import {
  ORG_TEAM,
  isOrgTeamUserNotFoundError,
  orgTeamInviteSchema,
  orgTeamUpdateSchema,
  orgTeamWriteError,
} from "@/lib/org-team";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

async function requireManageTeam(orgId: string): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; error?: undefined } | { supabase?: undefined; error: string }
> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: ORG_TEAM.signedOut };

  const supabase = await createClient();
  const { data: canManage, error } = await supabase.rpc("member_can", {
    p_uid: ctx.user.id,
    p_org: orgId,
    p_capability: "manage_team",
  });
  if (error || canManage !== true) return { error: ORG_TEAM.forbidden };
  return { supabase };
}

async function sendInviteSignInLink(email: string): Promise<string | undefined> {
  const origin = (await headers()).get("origin");
  try {
    await issueDashboardSignInLink({ email, requestOrigin: origin });
    return undefined;
  } catch {
    return ORG_TEAM.signInSendFailed;
  }
}

// invite_org_member is the write. If the login identity is not in auth.users
// yet, the house magic-link mint creates it (generateLink / createUser) and
// we retry. Never signInWithOtp. Never write gc_staff. Never create a profile.
export async function inviteOrgMember(input: unknown): Promise<{ error?: string }> {
  const parsed = orgTeamInviteSchema.safeParse(input);
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find((issue) => issue.path[0] === "email");
    if (emailIssue?.code === "too_small" || emailIssue?.code === "invalid_type") {
      return { error: ORG_TEAM.emailRequired };
    }
    if (emailIssue) return { error: ORG_TEAM.invalidEmail };
    return { error: ORG_TEAM.addFailed };
  }

  const gate = await requireManageTeam(parsed.data.orgId);
  if (gate.error || !gate.supabase) return { error: gate.error };

  const args = {
    p_org: parsed.data.orgId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_status: parsed.data.status,
  };

  let mailed = false;
  let mailError: string | undefined;
  let { data, error } = await gate.supabase.rpc("invite_org_member", args);
  if (error && isOrgTeamUserNotFoundError(error.message)) {
    mailError = await sendInviteSignInLink(parsed.data.email);
    mailed = true;
    ({ data, error } = await gate.supabase.rpc("invite_org_member", args));
  }
  if (error || !data) {
    return { error: orgTeamWriteError(error?.message, mailError ?? ORG_TEAM.addFailed) };
  }

  if (!mailed && parsed.data.status === "invited") {
    const mailError = await sendInviteSignInLink(parsed.data.email);
    if (mailError) {
      revalidatePath("/settings/aggregation");
      return { error: mailError };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/settings/aggregation");
  return {};
}

// Role/status persist through memberships_update RLS (manage_team) and the
// existing last-owner trigger. Bind the write to the org the form rendered.
export async function updateOrgMember(input: unknown): Promise<{ error?: string }> {
  const parsed = orgTeamUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: ORG_TEAM.saveFailed };

  const gate = await requireManageTeam(parsed.data.orgId);
  if (gate.error || !gate.supabase) return { error: gate.error };

  const { data, error } = await gate.supabase
    .from("memberships")
    .update({ role: parsed.data.role, status: parsed.data.status })
    .eq("id", parsed.data.membershipId)
    .eq("org_id", parsed.data.orgId)
    .select("id")
    .maybeSingle();
  if (error) return { error: orgTeamWriteError(error.message, ORG_TEAM.saveFailed) };
  if (!data) return { error: ORG_TEAM.forbidden };

  revalidatePath("/settings");
  revalidatePath("/settings/aggregation");
  return {};
}
