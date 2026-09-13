"use client";

import { useActionState, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { LOGIN_VERIFICATION_FAILED } from "@/lib/app-states";
import { PRODUCT_NAME } from "@/lib/product";
import { LOGIN_TURNSTILE_OPTIONS } from "@/lib/turnstile-widget";
import { requestMagicLink, type LoginState } from "./actions";

const INITIAL: LoginState = { ok: false, message: "" };

export function LoginForm({ authError }: { authError: string | null }) {
  const [token, setToken] = useState("");
  const [challengeError, setChallengeError] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Tokens are single-use. Reset in this wrapper (not an effect) after a failed
  // action so a retry does not resubmit a spent or empty Safari token.
  async function submit(prev: LoginState, formData: FormData): Promise<LoginState> {
    const next = await requestMagicLink(prev, formData);
    if (!next.ok) {
      turnstileRef.current?.reset();
      setToken("");
    }
    return next;
  }

  const [state, action, pending] = useActionState(submit, INITIAL);

  function markReady(next: string) {
    setChallengeError(false);
    setToken(next);
  }

  function clearChallenge() {
    setToken("");
    setChallengeError(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <span className="t-label text-ink-3">{PRODUCT_NAME}</span>
        <h1 className="t-subhead text-ink">Sign in</h1>
        <p className="t-body-sm text-body">
          We&rsquo;ll email you a secure sign-in link. No password to remember.
        </p>
      </div>

      {state.ok ? (
        // Link sent — replace the form with the confirmation (no email field lingering).
        <InlineNotice tone="info">{state.message}</InlineNotice>
      ) : (
        <form
          action={action}
          onSubmit={(event) => {
            if (!token) event.preventDefault();
          }}
          className="flex flex-col gap-4"
        >
          {authError ? <InlineNotice tone="error">{authError}</InlineNotice> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>

          {/* Invisible/managed: the widget only surfaces if a challenge is actually
              required. Set the sitekey's widget mode to "Invisible" (or "Managed")
              in the Cloudflare dashboard to match. Explicit size is required —
              omitting it makes marsidev emit style={}, which Safari paints as {}. */}
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            options={LOGIN_TURNSTILE_OPTIONS}
            onSuccess={markReady}
            onExpire={clearChallenge}
            onError={clearChallenge}
            onUnsupported={clearChallenge}
            onTimeout={clearChallenge}
          />
          <input type="hidden" name="cf-turnstile-response" value={token} />

          <Button type="submit" disabled={pending || !token} className="w-full">
            {pending ? "Sending…" : "Send sign-in link"}
          </Button>

          {state.message || challengeError ? (
            <InlineNotice tone="error">{state.message || LOGIN_VERIFICATION_FAILED}</InlineNotice>
          ) : null}
        </form>
      )}
    </main>
  );
}
