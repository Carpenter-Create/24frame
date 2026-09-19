import {
  HOUSE_PHONE_STACK_CLASS,
  HOUSE_PHONE_WRAP_CLASS,
} from "@/lib/house-phone-stack";
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
  editTitle: "Legal entity",
  helper: "Name, type, and jurisdiction for this legal entity.",
  addHelper: "Name, type, and jurisdiction for a new legal entity.",
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
  addHref: "/settings/organization/entities/new",
} as const;

export const ENTITY_EDIT_HREF_BASE = "/settings/organization/entities";

export function entityEditHref(id: string): string {
  return `${ENTITY_EDIT_HREF_BASE}/${id}`;
}

// One SoT for Rights Holder Legal Entities.
// Adam 2026-09-19 Coinbase mobile Settings: index is summary only —
// name (+ DEFAULT) · muted `Type · Jurisdiction` · CaretRight.
// Whole row drills in. Add entity drills to an add pane. Not a
// modal on mobile. Not a tall TYPE / JURISDICTION mini-form. Not
// a trailing Edit orphan under meta.
// Desktop: card + modal for now (same compact meta, name-row Edit).
// Phone never truncates. Card chrome: “Legal Entities” + Add entity.
export const ENTITY_LIST_CLASS = "w-full";

export const ENTITY_LIST_ITEMS_CLASS =
  "flex flex-col divide-y divide-hairline border-t border-hairline";

export const ENTITY_LIST_ROW_CLASS =
  `${HOUSE_PHONE_STACK_CLASS} gap-[var(--space-1)] py-[var(--space-4)]`;

export const ENTITY_LIST_NAME_ROW_CLASS =
  "flex items-start justify-between gap-[var(--space-4)]";

export const ENTITY_LIST_NAME_CLASS =
  "flex min-w-0 flex-wrap items-center gap-[var(--space-2)]";

export const ENTITY_LIST_ACTIONS_CLASS = "shrink-0";

export const ENTITY_LIST_VALUE_CLASS = `${HOUSE_PHONE_WRAP_CLASS} t-body text-ink`;

export const ENTITY_LIST_META_CLASS =
  `${HOUSE_PHONE_WRAP_CLASS} t-body-sm text-ink-3`;

export const ENTITY_META_SEP = " · ";

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

export function entityMetaLine(
  type: EntityType,
  jurisdiction?: string | null,
): string {
  const typeLabel = entityTypeLabel(type);
  const place = jurisdiction?.trim();
  return place ? `${typeLabel}${ENTITY_META_SEP}${place}` : typeLabel;
}

export function entityScopeLabel(scope: EntityScope): string {
  return ENTITY_SCOPE_LABELS[scope];
}

export function mapOrgLegalEntity(row: {
  id: string;
  name: string;
  entity_type: EntityType;
  jurisdiction: string | null;
  is_default: boolean;
  status: EntityStatus;
  created_at: string;
}): LegalEntityRow {
  return {
    id: row.id,
    name: row.name,
    entityType: row.entity_type,
    jurisdiction: row.jurisdiction,
    isDefault: row.is_default,
    status: row.status,
    createdAt: row.created_at,
  };
}
