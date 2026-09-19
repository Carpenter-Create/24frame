import { z } from "zod";

import { ACCOUNT_NAME_MAX } from "@/lib/account-profile";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/org-roles";
import { PRODUCT_NAME } from "@/lib/product";

export type { OrgRole };

export type GrantTier = "access" | "pro" | "premium";

// Account Team invite + house grant/comp. Copy lives here, not in JSX.
//
// One SoT: organizations + memberships + org_role + contract_terms.tier.
// account_invites is the pending-email row only — never a second membership
// table, never a marketing invite code, never a third species of user.
//
// Authz (mirrored in SQL; SQL is the gate):
//   Team invite/revoke — member_can(manage_team) = account_owner
//     of that org (gc_account_owner via gc_can).
//   House grant/revoke — is_gc_staff AND gc_can(operate).
//     UI hides Grant account unless gc_can(operate).
//   Accept — session email must match the invite (case-normalized).
//   After accept, set gc_active_org via setActiveOrg (existing cookie SoT).
//
// Defaults: team role viewer (least seat). Grant tier access (least plan).
// TTL 14 days. Stripe checkout for comps is deferred — the term row is
// the entitlement.

export const ACCOUNT_INVITE_TTL_DAYS = 14;

export const TEAM_INVITE_ROLES = [
  "account_owner",
  "accountant",
  "legal",
  "delivery_ops",
  "viewer",
] as const satisfies readonly OrgRole[];

export const TEAM_INVITE_DEFAULT_ROLE: OrgRole = "viewer";
export const HOUSE_GRANT_DEFAULT_TIER: GrantTier = "access";

export const GRANT_TIER_LABELS: Record<GrantTier, string> = {
  access: "Access",
  pro: "Pro",
  premium: "Premium",
};

export const ACCOUNT_INVITE = {
  team: "Team",
  teamEmpty: "No other people on this team.",
  pending: "Pending",
  invite: "Invite",
  inviting: "Sending…",
  sent: "Invite sent.",
  emailLabel: "Email",
  roleLabel: "Role",
  revoke: "Withdraw",
  revoking: "Withdrawing…",
  revoked: "Invite withdrawn.",
  forbidden: "Only the account owner can invite people to this team.",
  signedOut: "Not authenticated.",
  invalidEmail: "Enter a valid email address.",
  invalidRole: "Choose a role.",
  sendFailed: "Could not send the invite.",
  revokeFailed: "Could not withdraw the invite.",
} as const;

export const HOUSE_GRANT = {
  title: "Grant account",
  empty: "No pending grants.",
  emailLabel: "Email",
  orgLabel: "Organization",
  tierLabel: "Plan",
  grant: "Grant",
  granting: "Sending…",
  sent: "Grant sent.",
  revoke: "Withdraw",
  revoking: "Withdrawing…",
  forbidden: "Only house staff can grant an account.",
  signedOut: "Not authenticated.",
  invalidEmail: "Enter a valid email address.",
  invalidOrg: "Organization name is required.",
  invalidTier: "Choose a plan.",
  sendFailed: "Could not send the grant.",
  revokeFailed: "Could not withdraw the grant.",
} as const;

export const ACCOUNT_INVITE_ACCEPT = {
  title: "Accept invite",
  teamBody: "You have been invited to join this team.",
  grantBody: "You have been granted an account.",
  accept: "Accept",
  accepting: "Accepting…",
  accepted: "Accepted.",
  signIn: "Send sign-in link",
  signInHint: "Sign in with the invited email to accept.",
  missing: "This invite is missing or no longer valid.",
  expired: "This invite has expired.",
  revoked: "This invite was withdrawn.",
  acceptedAlready: "This invite was already accepted.",
  wrongEmail: "Sign in with the invited email to accept.",
  signedOut: "Not authenticated.",
  failed: "Could not accept this invite.",
} as const;

export const ACCOUNT_INVITE_ABSENT = [
  "invite code",
  "promo code",
  "referral code",
  "Go use a code",
  "marketing site",
] as const;

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export const teamInviteSchema = z.object({
  orgId: z.string().uuid(),
  email: emailSchema,
  role: z.enum(TEAM_INVITE_ROLES),
});

export const houseGrantSchema = z.object({
  email: emailSchema,
  orgName: z
    .string()
    .trim()
    .min(1)
    .max(ACCOUNT_NAME_MAX),
  tier: z.enum(["access", "pro", "premium"] as const),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(16).max(128),
});

export const revokeInviteSchema = z.object({
  id: z.string().uuid(),
});

export function inviteAcceptPath(token: string): string {
  return `/invite/accept?token=${encodeURIComponent(token)}`;
}

export function inviteEmailsMatch(sessionEmail: string, inviteEmail: string): boolean {
  const session = sessionEmail.trim().toLowerCase();
  const invited = inviteEmail.trim().toLowerCase();
  return session.length > 0 && session === invited;
}

export function acceptedInviteOrgId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const orgId = "org_id" in data ? data.org_id : null;
  return typeof orgId === "string" && orgId.length > 0 ? orgId : null;
}

export function teamRoleLabel(role: OrgRole): string {
  return ORG_ROLE_LABELS[role];
}

export function grantTierLabel(tier: GrantTier): string {
  return GRANT_TIER_LABELS[tier];
}

export function inviteEmailSubject(kind: "team" | "house_grant"): string {
  return kind === "house_grant"
    ? `Your ${PRODUCT_NAME} account`
    : `Join a team on ${PRODUCT_NAME}`;
}
