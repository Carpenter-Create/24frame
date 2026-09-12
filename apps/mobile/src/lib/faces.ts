// signedAvatarUrl is server-only S3 on the dashboard. Do not invent a
// second avatar system. Initials are the portable fallback.

export function accountInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  return accountInitials(local || "?");
}
