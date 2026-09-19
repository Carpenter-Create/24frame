"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ACCOUNT_INVITE_ACCEPT } from "@/lib/account-invite";
import {
  acceptAccountInvite,
  requestInviteSignIn,
  type InviteSignInState,
} from "./actions";

const INITIAL: InviteSignInState = { ok: false, message: "" };

export function InviteAcceptForm({
  token,
  email,
  signedIn,
}: {
  token: string;
  email: string;
  signedIn: boolean;
}) {
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [signInState, signInAction, signInPending] = useActionState(requestInviteSignIn, INITIAL);

  async function onAccept() {
    setAccepting(true);
    setError("");
    const res = await acceptAccountInvite({ token });
    if (res?.error) {
      setError(res.error);
      setAccepting(false);
    }
  }

  if (!signedIn) {
    return (
      <form action={signInAction} className="flex flex-col gap-[var(--space-4)]">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <p className="t-body-sm text-ink-2">{ACCOUNT_INVITE_ACCEPT.signInHint}</p>
        <Button type="submit" disabled={signInPending} className="self-start">
          {signInPending ? ACCOUNT_INVITE_ACCEPT.accepting : ACCOUNT_INVITE_ACCEPT.signIn}
        </Button>
        {signInState.message ? (
          <InlineNotice tone={signInState.ok ? "info" : "error"}>{signInState.message}</InlineNotice>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Button type="button" disabled={accepting} onClick={onAccept} className="self-start">
        {accepting ? ACCOUNT_INVITE_ACCEPT.accepting : ACCOUNT_INVITE_ACCEPT.accept}
      </Button>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </div>
  );
}
