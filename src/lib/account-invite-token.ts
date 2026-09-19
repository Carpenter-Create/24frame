import "server-only";

import { generateToken, hashToken } from "@/lib/portal";
import { inviteAcceptPath } from "@/lib/account-invite";
import { resolveDashboardOrigin } from "@/lib/auth-magic-link";

export function mintInviteToken(): { token: string; tokenHash: string } {
  const token = generateToken();
  return { token, tokenHash: hashToken(token) };
}

export function inviteAcceptUrl(token: string, requestOrigin: string | null): string {
  const origin = resolveDashboardOrigin(requestOrigin);
  return `${origin}${inviteAcceptPath(token)}`;
}
