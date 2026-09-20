import { z } from "zod";

import { ACCOUNT_NAME_MAX } from "@/lib/account-profile";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/org-roles";
import { PRODUCT_NAME } from "@/lib/product";
import { directoryInitials } from "@/lib/staff-directory";
import { userMenuName } from "@/lib/user-menu";

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
//   Sender always sees Invited (pending) or Accepted (member / grant row).
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

// Visible after send. Pending = Invited. Membership / accepted
// grant row = Accepted. No status-less lists. No twin ghost rows.
export const INVITE_STATUS = {
  invited: "Invited",
  accepted: "Accepted",
} as const;

export type InviteStatus = keyof typeof INVITE_STATUS;

export function inviteStatusLabel(status: InviteStatus): string {
  return INVITE_STATUS[status];
}

export function inviteStatusFromRow(status: "pending" | "accepted"): InviteStatus {
  return status === "accepted" ? "accepted" : "invited";
}

// House date craft: short, same day for every reader. Sent = created_at.
// Accepted = accepted_at on the invite, or membership joined_at. No twin clock.
const INVITE_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function inviteDateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return INVITE_DATE_FMT.format(date);
}

export const ACCOUNT_INVITE = {
  team: "Team",
  teamEmpty: "No other people on this team.",
  invited: INVITE_STATUS.invited,
  accepted: INVITE_STATUS.accepted,
  invite: "Invite",
  inviting: "Sending…",
  sent: "Invite sent.",
  cancel: "Cancel",
  emailLabel: "Email",
  nameColumn: "Name",
  roleLabel: "Role",
  statusColumn: "Status",
  sentColumn: "Sent",
  acceptedColumn: "Accepted",
  revoke: "Withdraw",
  revoking: "Withdrawing…",
  revoked: "Invite withdrawn.",
  forbidden: "Only the account owner can invite people to this team.",
  signedOut: "Not authenticated.",
  invalidEmail: "Enter a valid email address.",
  invalidRole: "Choose a role.",
  invalidScope: "Choose at least one entity.",
  alreadyInvited: "That email already has an invite.",
  alreadyMember: "That email already has a seat on this team.",
  ownEmail: "You cannot invite your own email.",
  sendFailed: "Couldn't send invite. Try again.",
  revokeFailed: "Couldn't withdraw invite. Try again.",
} as const;

export type TeamInviteErrorKind = "send" | "revoke";

// User-facing Team invite errors only. Actions and the modal both
// run RPC / PostgREST failures through this. Never render schema
// cache, function-missing, or Postgres strings.
const TEAM_INVITE_USER_ERRORS = [
  ACCOUNT_INVITE.forbidden,
  ACCOUNT_INVITE.signedOut,
  ACCOUNT_INVITE.invalidEmail,
  ACCOUNT_INVITE.invalidRole,
  ACCOUNT_INVITE.invalidScope,
  ACCOUNT_INVITE.alreadyInvited,
  ACCOUNT_INVITE.alreadyMember,
  ACCOUNT_INVITE.ownEmail,
  ACCOUNT_INVITE.sendFailed,
  ACCOUNT_INVITE.revokeFailed,
] as const;

const TEAM_INVITE_RAW_INFRA =
  /schema cache|could not find the function|could not find the table|PGRST\d+|postgrest|postgres|relation .+ does not exist|column .+ does not exist|function .+ does not exist|permission denied for|undefined function|invalid input syntax|jwt expired|failed to fetch|networkerror|42883|42P01|42703|42501/i;

const TEAM_INVITE_ERROR_MATCHERS: ReadonlyArray<{
  test: RegExp;
  copy: (typeof TEAM_INVITE_USER_ERRORS)[number];
}> = [
  { test: /already pending/i, copy: ACCOUNT_INVITE.alreadyInvited },
  { test: /already has a seat/i, copy: ACCOUNT_INVITE.alreadyMember },
  { test: /own email/i, copy: ACCOUNT_INVITE.ownEmail },
  { test: /not authorized/i, copy: ACCOUNT_INVITE.forbidden },
  { test: /not authenticated/i, copy: ACCOUNT_INVITE.signedOut },
  { test: /email is required|invalid email|valid email/i, copy: ACCOUNT_INVITE.invalidEmail },
  { test: /role is required/i, copy: ACCOUNT_INVITE.invalidRole },
  {
    test: /at least one entity|does not belong to this rights holder/i,
    copy: ACCOUNT_INVITE.invalidScope,
  },
];

export function isTeamInviteUserError(message: string): boolean {
  return (TEAM_INVITE_USER_ERRORS as readonly string[]).includes(message);
}

export function isRawInviteInfrastructureError(message: string): boolean {
  return TEAM_INVITE_RAW_INFRA.test(message);
}

export function teamInviteUserError(
  raw: string | null | undefined,
  kind: TeamInviteErrorKind = "send",
): string {
  const fallback = kind === "revoke" ? ACCOUNT_INVITE.revokeFailed : ACCOUNT_INVITE.sendFailed;
  const message = raw?.trim() ?? "";
  if (!message) return fallback;
  if (isTeamInviteUserError(message)) return message;
  if (isRawInviteInfrastructureError(message)) return fallback;
  for (const { test, copy } of TEAM_INVITE_ERROR_MATCHERS) {
    if (test.test(message)) return copy;
  }
  return fallback;
}

export const HOUSE_GRANT = {
  title: "Grant account",
  empty: "No grants yet.",
  invited: INVITE_STATUS.invited,
  accepted: INVITE_STATUS.accepted,
  emailLabel: "Email",
  orgLabel: "Rights Holder",
  tierLabel: "Plan",
  grant: "Grant",
  granting: "Sending…",
  sent: "Grant sent.",
  revoke: "Withdraw",
  revoking: "Withdrawing…",
  forbidden: "Only house staff can grant an account.",
  signedOut: "Not authenticated.",
  invalidEmail: "Enter a valid email address.",
  invalidOrg: "Rights holder name is required.",
  invalidTier: "Choose a plan.",
  sendFailed: "Could not send the grant.",
  revokeFailed: "Could not withdraw the grant.",
} as const;

export const ACCOUNT_INVITE_ACCEPT = {
  title: "Accept invite",
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
  "Needs review",
  "Ownership",
  "Invite a user",
  "Platform Users",
] as const;

export const TEAM_LIST_HEADER_CLASS =
  "min-w-[44rem] grid grid-cols-[minmax(12rem,2fr)_repeat(4,minmax(5.5rem,1fr))_auto] items-center gap-x-[var(--space-4)] px-0 py-[var(--space-3)] t-label text-ink-3";

export const TEAM_LIST_ROW_CLASS =
  "min-w-[44rem] grid grid-cols-[minmax(12rem,2fr)_repeat(4,minmax(5.5rem,1fr))_auto] items-center gap-x-[var(--space-4)] px-0 py-[var(--space-4)]";

export const TEAM_LIST_AVATAR_CLASS =
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body-sm font-medium text-ink-2";

export const TEAM_ROLE_PILL_CLASS =
  "inline-flex items-center whitespace-nowrap rounded-full bg-surface-muted px-2.5 py-1 t-label text-ink-2";

export type TeamListRow = {
  key: string;
  email: string;
  name: string | null;
  role: OrgRole;
  status: InviteStatus;
  sentAt: string | null;
  acceptedAt: string | null;
  withdrawId: string | null;
};

export function teamIdentityName(name: string | null | undefined): string | null {
  return userMenuName(name);
}

export function teamRowInitials(name: string | null | undefined, email: string): string {
  return directoryInitials(teamIdentityName(name) || email);
}

export function toTeamListRows(
  members: ReadonlyArray<{
    userId: string;
    email: string;
    role: OrgRole;
    name?: string | null;
    sentAt?: string | null;
    acceptedAt: string;
  }>,
  pending: ReadonlyArray<{
    id: string;
    email: string;
    role: OrgRole;
    sentAt: string;
  }>,
): TeamListRow[] {
  return [
    ...pending.map((invite) => ({
      key: invite.id,
      email: invite.email,
      name: null,
      role: invite.role,
      status: "invited" as const,
      sentAt: invite.sentAt,
      acceptedAt: null,
      withdrawId: invite.id,
    })),
    ...members.map((member) => ({
      key: member.userId,
      email: member.email,
      name: teamIdentityName(member.name),
      role: member.role,
      status: "accepted" as const,
      sentAt: member.sentAt ?? null,
      acceptedAt: member.acceptedAt,
      withdrawId: null,
    })),
  ];
}

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export const teamInviteSchema = z.object({
  orgId: z.string().uuid(),
  email: emailSchema,
  role: z.enum(TEAM_INVITE_ROLES),
  entityScope: z.enum(["all", "selected"] as const).default("all"),
  entityIds: z.array(z.string().uuid()).optional(),
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

// Rights Holder display name — organizations.name, same label as Settings.
export function resolveTeamInviteOrgName(name: string | null | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function teamInviteHeadline(orgName: string): string {
  return `Join ${orgName}`;
}

export function teamInviteBody(orgName: string, roleLabel: string): string {
  return `You have been invited to join ${orgName} on ${PRODUCT_NAME} as ${roleLabel}.`;
}

export function teamInviteAcceptBody(
  orgName: string | null | undefined,
  roleLabel: string | null | undefined,
): string {
  const name = resolveTeamInviteOrgName(orgName);
  const role = roleLabel?.trim() ?? "";
  if (name && role) return teamInviteBody(name, role);
  if (name) return `You have been invited to join ${name} on ${PRODUCT_NAME}.`;
  return "";
}

export function inviteEmailSubject(kind: "house_grant"): string;
export function inviteEmailSubject(kind: "team", orgName: string): string;
export function inviteEmailSubject(kind: "team" | "house_grant", orgName?: string): string {
  if (kind === "house_grant") {
    return `Your ${PRODUCT_NAME} account`;
  }
  const name = resolveTeamInviteOrgName(orgName);
  if (!name) {
    throw new Error("Team invite subject requires an organization name");
  }
  return `Join ${name} on ${PRODUCT_NAME}`;
}
