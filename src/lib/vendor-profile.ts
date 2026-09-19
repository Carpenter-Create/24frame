import { CHANNELS_HREF } from "@/lib/channel-card";
import { TITLES_HREF } from "@/lib/title-public-id";
import { ACTIVE_DELIVERY_STATUSES_LIST } from "@/lib/master-licence";
import { primitiveInfoFields, type StaffDirectoryField } from "@/lib/staff-directory";
import { ISO_COUNTRIES } from "@/lib/territories";
import { DELIVERY_STATUS_ROW_LABELS, type DeliveryStatus } from "@/lib/titles";
import {
  VENDOR_MODE_LABELS,
  type VendorDeliveryMode,
  type VendorDirectoryRow,
} from "@/lib/vendors-directory";

// Channel profile + licensed-title catalog. Titles licensed to a channel
// come from deliveries (title × vendor × territory), gated by a grant
// on the delivery row. Do not invent a vendor-titles table.

export const VENDOR_PROFILE = {
  infoTitle: "Channel information",
  reservedTitle: "Details",
  reservedEmpty: "More fields will appear here.",
  catalogTitle: "Licensed titles",
  catalogEmpty: "No titles licensed to this channel yet.",
  catalogTruncated: (n: string) =>
    `Showing licensed titles from the first ${n} delivery rows. More may exist.`,
  editVendor: "Edit channel",
  breadcrumb: "Channels",
  overviewTitle: "Overview",
  opsTitle: "Delivery notes",
  contactsTitle: "Contacts",
  territoriesTitle: "Territories",
  statusLabel: "Status",
  deliveryLabel: "Delivery mode",
} as const;

const OVERVIEW_KEYS = new Set(["description", "overview", "about", "notes"]);

export const VENDOR_PROFILE_FIELD_LABELS = {
  deliveryMode: "Delivery mode",
  status: "Status",
  emailTo: "Email recipients",
  emailCc: "Email CC",
  emailTemplate: "Email template",
} as const;

const LICENSED = new Set<string>(ACTIVE_DELIVERY_STATUSES_LIST);

export type VendorProfileRecord = VendorDirectoryRow & {
  emailTo: string[];
  emailCc: string[];
  emailTemplate: string | null;
  companyInfo: unknown;
};

export type VendorDeliveryPlacement = {
  titleId: string;
  title: string;
  catalogId: string | null;
  territory: string;
  status: string;
};

export type VendorLicensedTitle = {
  titleId: string;
  title: string;
  href: string;
  secondary: string;
};

export function vendorEditHref(id: string): string {
  return `${CHANNELS_HREF}/${id}/edit`;
}

export function vendorProfileHref(id: string): string {
  return `${CHANNELS_HREF}/${id}`;
}

export type ChannelTerritory = { code: string; label: string };

/** Unique territories from real delivery rows. No invented countries. */
export function channelTerritories(
  rows: readonly VendorDeliveryPlacement[],
): ChannelTerritory[] {
  const codes = new Set<string>();
  for (const row of rows) {
    const code = row.territory.trim().toUpperCase();
    if (code) codes.add(code);
  }
  return [...codes]
    .sort()
    .map((code) => ({ code, label: ISO_COUNTRIES[code] ?? code }));
}

/** Overview text only when company_info already carries one. Do not invent. */
export function channelOverviewText(companyInfo: unknown): string | null {
  const hit = primitiveInfoFields(companyInfo).find((field) =>
    OVERVIEW_KEYS.has(field.label.toLowerCase()),
  );
  const value = hit?.value.trim() ?? "";
  return value.length > 0 ? value : null;
}

export function channelCompanyRailFields(companyInfo: unknown): StaffDirectoryField[] {
  return primitiveInfoFields(companyInfo).filter(
    (field) => !OVERVIEW_KEYS.has(field.label.toLowerCase()),
  );
}

export function isLicensedDeliveryStatus(status: string): boolean {
  return LICENSED.has(status);
}

export function countLicensedTitlesByVendor(
  rows: ReadonlyArray<{ vendor_id: string; title_id: string; status: string }> | null,
): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const row of rows ?? []) {
    if (!isLicensedDeliveryStatus(row.status)) continue;
    const set = sets.get(row.vendor_id) ?? new Set<string>();
    set.add(row.title_id);
    sets.set(row.vendor_id, set);
  }
  return new Map([...sets].map(([id, titles]) => [id, titles.size]));
}

export function vendorLicensedTitles(
  rows: readonly VendorDeliveryPlacement[],
): VendorLicensedTitle[] {
  const byTitle = new Map<
    string,
    { title: string; catalogId: string | null; territories: string[]; statuses: string[] }
  >();

  for (const row of rows) {
    if (!row.titleId || !row.title) continue;
    if (!isLicensedDeliveryStatus(row.status)) continue;
    const current = byTitle.get(row.titleId) ?? {
      title: row.title,
      catalogId: row.catalogId,
      territories: [],
      statuses: [],
    };
    if (row.territory && !current.territories.includes(row.territory)) {
      current.territories.push(row.territory);
    }
    const statusLabel =
      row.status in DELIVERY_STATUS_ROW_LABELS
        ? DELIVERY_STATUS_ROW_LABELS[row.status as DeliveryStatus]
        : row.status;
    if (!current.statuses.includes(statusLabel)) current.statuses.push(statusLabel);
    byTitle.set(row.titleId, current);
  }

  return [...byTitle.entries()]
    .map(([titleId, info]) => {
      const bits = [
        info.catalogId,
        info.territories.join(", ") || null,
        info.statuses.join(" · ") || null,
      ].filter((bit): bit is string => Boolean(bit));
      return {
        titleId,
        title: info.title,
        href: `${TITLES_HREF}/${titleId}`,
        secondary: bits.join(" · "),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function vendorKnownFields(vendor: {
  deliveryMode: VendorDeliveryMode;
  active: boolean;
  emailTo: string[];
  emailCc: string[];
  emailTemplate: string | null;
}): StaffDirectoryField[] {
  const fields: StaffDirectoryField[] = [
    { label: VENDOR_PROFILE_FIELD_LABELS.deliveryMode, value: VENDOR_MODE_LABELS[vendor.deliveryMode] },
    { label: VENDOR_PROFILE_FIELD_LABELS.status, value: vendor.active ? "Active" : "Inactive" },
  ];
  if (vendor.emailTo.length > 0) {
    fields.push({
      label: VENDOR_PROFILE_FIELD_LABELS.emailTo,
      value: vendor.emailTo.join(", "),
    });
  }
  if (vendor.emailCc.length > 0) {
    fields.push({
      label: VENDOR_PROFILE_FIELD_LABELS.emailCc,
      value: vendor.emailCc.join(", "),
    });
  }
  if (vendor.emailTemplate?.trim()) {
    fields.push({
      label: VENDOR_PROFILE_FIELD_LABELS.emailTemplate,
      value: vendor.emailTemplate.trim(),
    });
  }
  return fields;
}

export function vendorCompanyFields(companyInfo: unknown): StaffDirectoryField[] {
  return primitiveInfoFields(companyInfo);
}

export function asVendorProfileRecord(row: unknown): VendorProfileRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  if (typeof r.name !== "string" || r.name.length === 0) return null;
  if (r.delivery_mode !== "portal_upload" && r.delivery_mode !== "email") return null;
  if (typeof r.active !== "boolean") return null;
  return {
    id: r.id,
    name: r.name,
    deliveryMode: r.delivery_mode,
    active: r.active,
    emailTo: Array.isArray(r.email_to)
      ? r.email_to.filter((item): item is string => typeof item === "string")
      : [],
    emailCc: Array.isArray(r.email_cc)
      ? r.email_cc.filter((item): item is string => typeof item === "string")
      : [],
    emailTemplate: typeof r.email_template === "string" ? r.email_template : null,
    companyInfo: r.company_info ?? null,
  };
}

export function asVendorDeliveryPlacement(row: unknown): VendorDeliveryPlacement | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const titles = r.titles;
  const title =
    titles && typeof titles === "object" && !Array.isArray(titles)
      ? (titles as Record<string, unknown>)
      : null;
  if (typeof r.title_id !== "string" || r.title_id.length === 0) return null;
  if (!title || typeof title.title !== "string" || title.title.length === 0) return null;
  if (typeof r.territory !== "string" || typeof r.status !== "string") return null;
  return {
    titleId: r.title_id,
    title: title.title,
    catalogId: typeof title.catalog_id === "string" ? title.catalog_id : null,
    territory: r.territory,
    status: r.status,
  };
}
