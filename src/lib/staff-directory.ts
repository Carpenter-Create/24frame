import { HOUSE_MODULE_CLASS } from "@/lib/house-shell";

// One Circle-style directory primitive for staff Vendors + Clients.
// Grammar (Circle Manage audience SoT): circular avatar, bold name,
// muted secondary, optional trailing meta. Filter chips + count sit
// above a grey Coinbase holding surface. Do not fork a second row.

export const STAFF_DIRECTORY_SURFACE_CLASS = HOUSE_MODULE_CLASS;

export const STAFF_DIRECTORY_STACK_CLASS = "flex flex-col gap-[var(--space-4)]";

export const STAFF_DIRECTORY_TOOLBAR_CLASS =
  "flex flex-wrap items-center justify-between gap-[var(--space-3)]";

export const STAFF_DIRECTORY_COUNT_CLASS = "t-body-sm text-ink-3";

export const STAFF_DIRECTORY_ROW_CLASS =
  "flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]";

export const STAFF_DIRECTORY_NESTED_ROW_CLASS = "pl-[var(--space-10)]";

export const STAFF_DIRECTORY_AVATAR_CLASS =
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface t-body-sm font-medium text-ink-2";

export const STAFF_DIRECTORY_COPY_CLASS = "flex min-w-0 flex-1 flex-col gap-[2px]";

export const STAFF_DIRECTORY_NAME_CLASS = "t-body font-semibold text-ink";

export const STAFF_DIRECTORY_SECONDARY_CLASS = "t-body-sm text-ink-3";

export const STAFF_DIRECTORY_TRAILING_CLASS =
  "ml-auto shrink-0 rounded-full bg-surface px-[var(--space-2)] py-[2px] t-body-sm text-ink-2";

export const STAFF_DIRECTORY_SECTION_TITLE_CLASS =
  "px-[var(--space-4)] pt-[var(--space-4)] t-body font-medium text-ink";

export const STAFF_DIRECTORY_EMPTY_CLASS =
  "px-[var(--space-4)] py-[var(--space-6)] t-body-sm text-ink-3";

export const STAFF_DIRECTORY_FIELD_ROW_CLASS =
  "flex items-start justify-between gap-[var(--space-4)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)] last:border-b-0";

export const STAFF_DIRECTORY_FIELD_LABEL_CLASS = "t-body-sm text-ink-3";

export const STAFF_DIRECTORY_FIELD_VALUE_CLASS = "t-body-sm text-right text-ink";

export type StaffDirectoryRowModel = {
  id: string;
  name: string;
  secondary?: string | null;
  trailing?: string | null;
  href?: string | null;
  photoUrl?: string | null;
  nested?: StaffDirectoryRowModel[];
};

export type StaffDirectoryField = {
  label: string;
  value: string;
};

/**
 * Avatar fallback from a company, person, or email. First two tokens,
 * or the first two letters of a single token. Never invents a name.
 */
export function directoryInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const at = trimmed.indexOf("@");
  const source = at > 0 ? trimmed.slice(0, at) : trimmed;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const token = parts[0] ?? "";
    return (token.slice(0, token.length === 1 ? 1 : 2) || "?").toUpperCase();
  }
  const first = parts[0]?.slice(0, 1) ?? "";
  const second = parts[1]?.slice(0, 1) ?? "";
  return `${first}${second}`.toUpperCase() || "?";
}

export function directoryCountLabel(
  count: number,
  singular: string,
  plural: string,
  truncated = false,
): string {
  const n = truncated ? `${count}+` : String(count);
  const noun = count === 1 && !truncated ? singular : plural;
  return `${n} ${noun}`;
}

export function searchParamString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function filterHref(basePath: string, key: string, allKey = "all"): string {
  if (key === allKey) return basePath;
  const params = new URLSearchParams({ status: key });
  return `${basePath}?${params.toString()}`;
}

/** Primitive company_info keys only — extra vendor fields Adam will add later. */
export function primitiveInfoFields(value: unknown): StaffDirectoryField[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const out: StaffDirectoryField[] = [];
  for (const [rawKey, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === null || raw === undefined) continue;
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      const label = rawKey.replaceAll("_", " ").trim();
      if (!label) continue;
      out.push({ label, value: String(raw) });
    }
  }
  return out;
}
