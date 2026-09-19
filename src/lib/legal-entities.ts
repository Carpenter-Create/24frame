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
  actionsColumn: "Actions",
  emptyJurisdiction: "\u2014",
  nameRequired: "Entity name is required.",
  default: "Default",
  addFailed: "Could not add the entity.",
  updateFailed: "Could not update the entity.",
  signedOut: "Not authenticated.",
  forbidden: "Only the account owner can manage legal entities.",
} as const;

// One SoT for header + rows. Four cells: Name + Default · Type ·
// Jurisdiction · Actions. Desktop (md+): fr tracks fill the card so
// columns breathe — Adam 2026-09-19 lock, reversing the #504 hug.
// Phone: one stacked block per entity (label/value). Full text, wrap
// OK, no truncate / no horizontal squeeze. Header is desktop-only.
// Values share primary ink. Empty jurisdiction is a muted em dash.
// Not a data-grid library.
export const ENTITY_LIST_CLASS = "w-full";

export const ENTITY_LIST_GRID_CLASS =
  "grid w-full grid-cols-1 items-start gap-y-[var(--space-2)] px-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-x-[var(--space-6)] md:gap-y-0";

export const ENTITY_LIST_HEADER_CLASS =
  `${ENTITY_LIST_GRID_CLASS} max-md:hidden py-[var(--space-3)] t-label text-ink-3`;

export const ENTITY_LIST_ROW_CLASS =
  `${ENTITY_LIST_GRID_CLASS} py-[var(--space-4)]`;

export const ENTITY_LIST_NAME_CLASS =
  "flex min-w-0 w-full flex-wrap items-center gap-[var(--space-2)]";

export const ENTITY_LIST_FIELD_CLASS =
  "flex min-w-0 w-full flex-col items-stretch gap-[var(--space-1)] md:block";

export const ENTITY_LIST_FIELD_LABEL_CLASS = "t-label text-ink-3 md:hidden";

export const ENTITY_LIST_ACTIONS_CLASS = "justify-self-start md:justify-self-end";

export const ENTITY_LIST_VALUE_CLASS =
  "min-w-0 max-w-full t-body text-ink whitespace-normal break-words";
export const ENTITY_LIST_EMPTY_CLASS =
  "min-w-0 max-w-full t-body text-ink-3 whitespace-normal break-words";

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
