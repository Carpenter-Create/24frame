// Org Team on Aggregation Settings. Copy and contract live here, not in JSX.
//
// Surface is /settings/aggregation — not GC Staff admin, not Social members.
// Write gate is member_can(..., 'manage_team') = account_owner.
// Role and status values are the live org_role / membership_status enums.
// Invite RPC resolves email→user_id; the app may send the house sign-in
// link. Login OTP on that email activates. No profile is created.

import { z } from "zod";

import { formControlClass } from "@/lib/form-control";

export const ORG_TEAM_ROLES = [
  "account_owner",
  "accountant",
  "legal",
  "delivery_ops",
  "viewer",
] as const;

export const ORG_TEAM_STATUSES = ["invited", "active", "removed"] as const;

export type OrgTeamRole = (typeof ORG_TEAM_ROLES)[number];
export type OrgTeamStatus = (typeof ORG_TEAM_STATUSES)[number];

export const ORG_TEAM_STATUS_DEFAULT: OrgTeamStatus = "invited";

export const ORG_TEAM = {
  addUser: "Add user",
  adding: "Adding…",
  added: "User added.",
  emailLabel: "Email",
  emailRequired: "Email is required.",
  invalidEmail: "Enter a valid email.",
  roleLabel: "Role",
  statusLabel: "Status",
  empty: "No people on this organization yet.",
  signedOut: "Not authenticated.",
  forbidden: "Only the account owner can manage the team.",
  saveFailed: "Could not save.",
  addFailed: "Could not add this user.",
  lastOwner: "This organization needs at least one active account owner.",
  saved: "Saved.",
  signInNote: "They sign in with a link sent to this email.",
  signInSendFailed: "User added. They can sign in with this email.",
} as const;

export const ORG_TEAM_SELECT_CLASS = formControlClass("box");

export const ORG_TEAM_STACK_CLASS = "flex flex-col gap-[var(--space-6)]";

export const ORG_TEAM_ROW_CLASS =
  "flex flex-col gap-[var(--space-3)] border-b border-hairline py-[var(--space-3)] last:border-b-0 md:flex-row md:items-end";

export const ORG_TEAM_PERSON_CLASS = "flex min-w-0 flex-1 flex-col gap-[2px]";

export const ORG_TEAM_NAME_CLASS = "t-body font-medium text-ink";

export const ORG_TEAM_EMAIL_CLASS = "t-body-sm text-ink-3";

export const ORG_TEAM_FIELDS_CLASS =
  "flex flex-col gap-[var(--space-3)] md:flex-row md:items-end";

export const ORG_TEAM_FIELD_CLASS = "flex min-w-0 flex-col gap-[var(--space-2)] md:w-48";

export type OrgTeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: OrgTeamRole;
  status: OrgTeamStatus;
};

export const orgTeamRoleSchema = z.enum(ORG_TEAM_ROLES);
export const orgTeamStatusSchema = z.enum(ORG_TEAM_STATUSES);

export const orgTeamInviteSchema = z.object({
  orgId: z.string().uuid(),
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((value) => value.toLowerCase()),
  role: orgTeamRoleSchema,
  status: orgTeamStatusSchema.default(ORG_TEAM_STATUS_DEFAULT),
});

export const orgTeamUpdateSchema = z.object({
  orgId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: orgTeamRoleSchema,
  status: orgTeamStatusSchema,
});

/** Email is the row when no profile name exists. Never invent a local-part name. */
export function orgTeamPersonLabel(member: {
  displayName: string | null;
  email: string;
}): { name: string; secondary: string | null } {
  const name = member.displayName?.trim() ?? "";
  const email = member.email.trim();
  if (name) return { name, secondary: email || null };
  return { name: email, secondary: null };
}

export function isOrgTeamLastOwnerError(message: string | null | undefined): boolean {
  return /no active account owner/i.test(message ?? "");
}

export function isOrgTeamUserNotFoundError(message: string | null | undefined): boolean {
  return /user not found/i.test(message ?? "");
}

export function orgTeamWriteError(
  message: string | null | undefined,
  fallback: string,
): string {
  if (isOrgTeamLastOwnerError(message)) return ORG_TEAM.lastOwner;
  if (message?.trim()) return message;
  return fallback;
}
