"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { setActiveOrg } from "@/app/(app)/actions";
import {
  ACCOUNT_INVITE_ACCEPT,
  acceptedInviteOrgId,
  acceptInviteSchema,
  inviteAcceptPath,
  inviteEmailsMatch,
} from "@/lib/account-invite";
import { hashToken } from "@/lib/portal";
import {
  DASHBOARD_SIGN_IN_RATE_LIMITED,
  DASHBOARD_SIGN_IN_SEND_FAILED,
  DASHBOARD_SIGN_IN_SENT,
  issueDashboardSignInLink,
} from "@/lib/auth-magic-link";
import {
  AUTH_SES_SUPPRESSED_USER_MESSAGE,
  isAuthSesSuppressedError,
} from "@/lib/auth-ses";
import {
  assertDashboardSignInAllowed,
  clientIpFromForwarded,
  DashboardSignInRateLimitError,
} from "@/lib/dashboard-sign-in-rate-limit";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function acceptAccountInvite(input: unknown): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!user) return { error: ACCOUNT_INVITE_ACCEPT.signedOut };

  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return { error: ACCOUNT_INVITE_ACCEPT.missing };

  const tokenHash = hashToken(parsed.data.token);
  const supabase = await createClient();
  const { data: peek } = await supabase.rpc("peek_account_invite", {
    p_token_hash: tokenHash,
  });
  const invite = peek?.[0];
  if (!invite || invite.status !== "pending") {
    return { error: ACCOUNT_INVITE_ACCEPT.missing };
  }
  if (!inviteEmailsMatch(user.email, invite.email)) {
    return { error: ACCOUNT_INVITE_ACCEPT.wrongEmail };
  }

  const { data, error } = await supabase.rpc("accept_account_invite", {
    p_token_hash: tokenHash,
  });
  if (error) {
    if (error.message === ACCOUNT_INVITE_ACCEPT.wrongEmail) {
      return { error: ACCOUNT_INVITE_ACCEPT.wrongEmail };
    }
    return { error: ACCOUNT_INVITE_ACCEPT.failed };
  }

  const orgId = acceptedInviteOrgId(data);
  if (orgId) await setActiveOrg(orgId);

  redirect("/settings/organization");
}

export type InviteSignInState = { ok: boolean; message: string };

export async function requestInviteSignIn(
  _prev: InviteSignInState,
  formData: FormData,
): Promise<InviteSignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (!email) return { ok: false, message: ACCOUNT_INVITE_ACCEPT.signInHint };
  if (!acceptInviteSchema.safeParse({ token }).success) {
    return { ok: false, message: ACCOUNT_INVITE_ACCEPT.missing };
  }

  const hdrs = await headers();
  const origin = hdrs.get("origin");
  const ip = clientIpFromForwarded(hdrs.get("x-forwarded-for"));

  try {
    await assertDashboardSignInAllowed({ email, ip });
    await issueDashboardSignInLink({
      email,
      requestOrigin: origin,
      next: inviteAcceptPath(token),
    });
  } catch (err) {
    if (err instanceof DashboardSignInRateLimitError) {
      return { ok: false, message: DASHBOARD_SIGN_IN_RATE_LIMITED };
    }
    if (isAuthSesSuppressedError(err)) {
      return { ok: false, message: AUTH_SES_SUPPRESSED_USER_MESSAGE };
    }
    console.error(
      "[account-invite] sign-in send failed",
      err instanceof Error ? err.message : err,
    );
    return { ok: false, message: DASHBOARD_SIGN_IN_SEND_FAILED };
  }
  return { ok: true, message: DASHBOARD_SIGN_IN_SENT };
}
