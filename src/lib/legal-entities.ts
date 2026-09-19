import type { Database } from "@/lib/supabase/database.types";

// Legal entities. Copy and types live here, not in JSX.
//
// Hierarchy:
//   User (human + Social)
//     Rights Holder (organizations table)
//       Legal entities[] (any structure)
//         Titles / deals
//
// Every Rights Holder has at least one default legal entity, created
// automatically on signup. Titles attach to a legal entity.
// Team memberships carry entity scope: "all" (desk seat) or
// "selected" (scoped to specific entities only).

export type EntityType = Database["public"]["Enums"]["entity_type"];
export type EntityStatus = Database["public"]["Enums"]["entity_status"];
export type EntityScope = Database["public"]["Enums"]["entity_scope"];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  sole_prop: "Sole proprietorship",
  llc: "LLC",
  corporation: "Corporation",
  partnership: "Partnership",
  trust: "Trust",
  nonprofit: "Nonprofit",
  individual: "Individual",
  other: "Other",
};

export const ENTITY_TYPES = Object.keys(ENTITY_TYPE_LABELS) as EntityType[];

export const ENTITY_SCOPE_LABELS: Record<EntityScope, string> = {
  all: "All entities",
  selected: "Selected entities",
};

export type LegalEntityRow = {
  id: string;
  name: string;
  entityType: EntityType;
  jurisdiction: string | null;
  isDefault: boolean;
  status: EntityStatus;
  createdAt: string;
};

export const LEGAL_ENTITIES = {
  title: "Legal Entities",
  empty: "No legal entities yet.",
  add: "Add entity",
  adding: "Adding...",
  added: "Entity added.",
  edit: "Edit",
  save: "Save",
  saving: "Saving…",
  cancel: "Cancel",
  nameLabel: "Entity name",
  typeLabel: "Entity type",
  jurisdictionLabel: "Jurisdiction",
  jurisdictionHint: "State, country, or governing body. Optional.",
  nameColumn: "Name",
  typeColumn: "Type",
  jurisdictionColumn: "Jurisdiction",
  emptyJurisdiction: "\u2014",
  nameRequired: "Entity name is required.",
  default: "Default",
  addFailed: "Could not add the entity.",
  updateFailed: "Could not update the entity.",
  signedOut: "Not authenticated.",
  forbidden: "Only the account owner can manage legal entities.",
} as const;

// Team list density — one shared grid for header + rows. Four columns:
// Name · Type · Jurisdiction · Actions. Values share primary ink.
// Empty jurisdiction is a muted em dash. Not a data-grid library.
export const ENTITY_LIST_GRID_CLASS =
  "min-w-[36rem] grid grid-cols-[minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_auto] items-center gap-x-[var(--space-4)] px-0";

export const ENTITY_LIST_HEADER_CLASS =
  `${ENTITY_LIST_GRID_CLASS} py-[var(--space-3)] t-label text-ink-3`;

export const ENTITY_LIST_ROW_CLASS =
  `${ENTITY_LIST_GRID_CLASS} py-[var(--space-4)]`;

export const ENTITY_LIST_VALUE_CLASS = "t-body text-ink";
export const ENTITY_LIST_EMPTY_CLASS = "t-body text-ink-3";

export const ENTITY_SCOPE = {
  all: "All entities",
  selected: "Selected entities",
  scopeLabel: "Entity scope",
  scopeHint: "Which legal entities this person can access.",
  entityPickerLabel: "Select entities",
} as const;

export function entityTypeLabel(type: EntityType): string {
  return ENTITY_TYPE_LABELS[type];
}

export function entityJurisdictionLabel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : LEGAL_ENTITIES.emptyJurisdiction;
}

export function entityJurisdictionClass(value: string | null | undefined): string {
  return value?.trim() ? ENTITY_LIST_VALUE_CLASS : ENTITY_LIST_EMPTY_CLASS;
}

export function entityScopeLabel(scope: EntityScope): string {
  return ENTITY_SCOPE_LABELS[scope];
}
