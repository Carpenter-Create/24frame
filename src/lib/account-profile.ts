// Profile / /settings/profile identity helpers. Copy lives here, not
// in JSX. Name is user_metadata.display_name (already written at org
// create). Email is auth.users — shown, not changed. Company name is
// organizations.name and now lives on /settings/organization.
// Retired /account/company 404s. Company stays off the rail and the
// Identity menu. Logo / description / mailing address / website /
// LinkedIn / socials are not in the schema — do not invent them.

import { z } from "zod";

import { COMPANY_AGGREGATION_WORKSPACE } from "@/lib/product";
import { USER_MENU, userMenuName } from "@/lib/user-menu";

// Identity menu label is Profile. Company is the Organization pane —
// not a rail row.

/** Conservative bound — same ceiling as other person/company name writes. */
export const ACCOUNT_NAME_MAX = 200;

// Figma 558:639 / 554:637 — empty 48 circle until a real photo exists.
// Do not put an initial in this well (that invents a face).
export const ACCOUNT_PHOTO_CIRCLE_CLASS =
  "size-12 shrink-0 overflow-hidden rounded-full bg-surface-muted";

export const ACCOUNT_PROFILE = {
  title: "Profile",
  href: USER_MENU.profileHref,
  nameLabel: "Name",
  nameHelper: "Shown on this account.",
  emailLabel: "Email",
  emailHint: "Sign-in email. It cannot be changed here.",
  emailLocked: "Cannot be changed here.",
  emptyValue: "\u2014",
  uploadPhoto: "Upload photo",
  uploadingPhoto: "Uploading…",
  photoAlt: "Account photo",
  photoMissing: "Choose a photo to upload.",
  photoTooLarge: "Photo must be 2 MB or smaller.",
  photoType: "Use a JPEG, PNG, or WebP photo.",
  photoFailed: "Could not upload photo.",
  save: "Save",
  saving: "Saving…",
  saved: "Saved.",
  signedOut: "Not authenticated.",
  saveFailed: "Could not save.",
  invalidName: "Name must be 200 characters or fewer.",
} as const;

export const COMPANY_PROFILE = {
  title: "Company",
  href: "/settings/organization",
  subtitle: `Name of the ${COMPANY_AGGREGATION_WORKSPACE} on this account.`,
  nameLabel: "Company name",
  nameRequired: "Company name is required.",
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
  saved: "Saved.",
  signedOut: "Not authenticated.",
  forbidden: "Only the account owner can change the company name.",
  saveFailed: "Could not save.",
  invalidName: "Company name must be 200 characters or fewer.",
} as const;

/** Saved. notice auto-clears. Typing already clears immediately. */
export const COMPANY_PROFILE_SAVED_MS = 2800;

// Rights Holder company name — read-only row in the house Card.
// Edit opens the house Dialog. Not an in-page form.
export const COMPANY_PROFILE_VIEW_CLASS =
  "flex items-start justify-between gap-[var(--space-4)]";
export const COMPANY_PROFILE_COPY_CLASS =
  "flex min-w-0 flex-col gap-[var(--space-1)]";
export const COMPANY_PROFILE_CARD_BODY_CLASS = "py-[var(--space-3)]";

export const accountNameSchema = z
  .string()
  .max(ACCOUNT_NAME_MAX)
  .transform((value) => value.trim())
  .pipe(z.string().max(ACCOUNT_NAME_MAX));

export const companySaveSchema = z.object({
  orgId: z.string().uuid(),
  name: z
    .string()
    .max(ACCOUNT_NAME_MAX)
    .transform((value) => value.trim())
    .pipe(z.string().min(1).max(ACCOUNT_NAME_MAX)),
});

/**
 * Display name already stored on the session JWT. Empty stays empty.
 * Never derive a name from an email local-part.
 */
export function authDisplayName(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null;
  const record = claims as Record<string, unknown>;
  const meta = record.user_metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const value = (meta as Record<string, unknown>).display_name;
  return userMenuName(typeof value === "string" ? value : null);
}
