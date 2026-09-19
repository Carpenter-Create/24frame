import type { Database } from "@/lib/supabase/database.types";

// Shared org_role labels. Keep this module free of server-only imports
// so Settings Team (client) and the staff directory can share one map.

export type OrgRole = Database["public"]["Enums"]["org_role"];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  account_owner: "Account owner",
  accountant: "Accountant",
  legal: "Legal",
  delivery_ops: "Delivery ops",
  viewer: "Viewer",
};

export const ORG_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  account_owner:
    "Full control: manages team, billing, settings, and all operations",
  accountant: "Financial access: views revenue, tax, and banking details",
  legal: "Legal access: views contracts, rights, and financial records",
  delivery_ops: "Operations: manages titles, assets, and delivery workflows",
  viewer: "Read-only: views the catalog and basic organization data",
};

// Canonical capabilities from member_can(). One SoT for the
// capability names the SQL function resolves.
export const ORG_CAPABILITIES = [
  "view",
  "view_financial",
  "operate",
  "manage_tax_banking",
  "manage_billing",
  "manage_team",
  "manage_settings",
] as const;

export type OrgCapability = (typeof ORG_CAPABILITIES)[number];

export const ORG_CAPABILITY_LABELS: Record<OrgCapability, string> = {
  view: "View catalog",
  view_financial: "View financial data",
  operate: "Manage titles and assets",
  manage_tax_banking: "Manage tax and banking",
  manage_billing: "Manage billing",
  manage_team: "Manage team members",
  manage_settings: "Manage organization settings",
};

// System role capability grants. Mirrors the member_can() CASE branches.
export const SYSTEM_ROLE_CAPABILITIES: Record<OrgRole, readonly OrgCapability[]> = {
  account_owner: [
    "view",
    "view_financial",
    "operate",
    "manage_tax_banking",
    "manage_billing",
    "manage_team",
    "manage_settings",
  ],
  accountant: ["view", "view_financial", "manage_tax_banking"],
  legal: ["view", "view_financial"],
  delivery_ops: ["view", "operate"],
  viewer: ["view"],
};

// Roles catalog copy. Lives in lib/, not JSX.
export const ROLES_CATALOG = {
  title: "Roles",
  createRole: "Create role",
  creating: "Creating…",
  created: "Role created.",
  roleColumn: "Role",
  descriptionColumn: "Description",
  typeColumn: "Type",
  membersColumn: "Members",
  statusColumn: "Status",
  systemType: "System",
  customType: "Custom",
  activeStatus: "Active",
  nameLabel: "Name",
  descriptionLabel: "Description",
  capabilitiesLabel: "Capabilities",
  namePlaceholder: "e.g. Content reviewer",
  descriptionPlaceholder: "What this role can do",
  nameRequired: "Role name is required.",
  capabilitiesRequired: "Select at least one capability.",
  duplicateName: "A role with this name already exists.",
  forbidden: "Only the account owner can manage roles.",
  saveFailed: "Could not create the role.",
} as const;

export type RoleCatalogRow = {
  key: string;
  name: string;
  description: string;
  type: "system" | "custom";
  memberCount: number;
  memberInitials: string[];
  status: "active";
};

export function systemRoleCatalogRows(
  membersByRole: Record<string, { initials: string }[]>,
): RoleCatalogRow[] {
  const roles: OrgRole[] = [
    "account_owner",
    "accountant",
    "legal",
    "delivery_ops",
    "viewer",
  ];
  return roles.map((role) => {
    const holders = membersByRole[role] ?? [];
    return {
      key: `system:${role}`,
      name: ORG_ROLE_LABELS[role],
      description: ORG_ROLE_DESCRIPTIONS[role],
      type: "system" as const,
      memberCount: holders.length,
      memberInitials: holders.slice(0, 3).map((h) => h.initials),
      status: "active" as const,
    };
  });
}
