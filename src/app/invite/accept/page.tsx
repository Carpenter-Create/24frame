import {
  ACCOUNT_INVITE_ACCEPT,
  grantTierLabel,
  inviteEmailsMatch,
  teamRoleLabel,
} from "@/lib/account-invite";
import { hashToken } from "@/lib/portal";
import { PRODUCT_NAME } from "@/lib/product";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { InviteAcceptForm } from "./invite-accept-form";

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token: rawToken } = await searchParams;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  const user = await getAuthUser();

  if (!token) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <h1 className="t-subhead text-ink">{ACCOUNT_INVITE_ACCEPT.title}</h1>
        <p className="t-body text-ink-2">{ACCOUNT_INVITE_ACCEPT.missing}</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: peek } = await supabase.rpc("peek_account_invite", {
    p_token_hash: hashToken(token),
  });
  const invite = peek?.[0];

  let body: string = ACCOUNT_INVITE_ACCEPT.missing;
  if (!invite) {
    body = ACCOUNT_INVITE_ACCEPT.missing;
  } else if (invite.status === "expired") {
    body = ACCOUNT_INVITE_ACCEPT.expired;
  } else if (invite.status === "revoked") {
    body = ACCOUNT_INVITE_ACCEPT.revoked;
  } else if (invite.status === "accepted") {
    body = ACCOUNT_INVITE_ACCEPT.acceptedAlready;
  } else if (invite.kind === "house_grant") {
    body = invite.tier
      ? `${ACCOUNT_INVITE_ACCEPT.grantBody} ${grantTierLabel(invite.tier)} · ${invite.org_name ?? ""}`.trim()
      : ACCOUNT_INVITE_ACCEPT.grantBody;
  } else {
    const role = invite.role ? teamRoleLabel(invite.role) : "";
    body = [ACCOUNT_INVITE_ACCEPT.teamBody, invite.org_name, role].filter(Boolean).join(" · ");
  }

  const pending = invite?.status === "pending";
  const emailMatch = pending && inviteEmailsMatch(user?.email ?? "", invite.email);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <span className="t-label text-ink-3">{PRODUCT_NAME}</span>
        <h1 className="t-subhead text-ink">{ACCOUNT_INVITE_ACCEPT.title}</h1>
        <p className="t-body text-ink-2">{body}</p>
      </div>
      {pending ? (
        <InviteAcceptForm
          token={token}
          email={invite.email}
          signedIn={!!user}
          emailMatch={emailMatch}
        />
      ) : null}
    </main>
  );
}
