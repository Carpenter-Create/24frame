import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { COMPANY_PROFILE_VIEW_CLASS } from "./account-profile";
import {
  HOUSE_PHONE_STACK_CLASS,
  HOUSE_PHONE_WRAP_CLASS,
  housePhoneForbidsTruncate,
} from "./house-phone-stack";
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPES,
  ENTITY_SCOPE_LABELS,
  ENTITY_EDIT_HREF_BASE,
  ENTITY_LIST_ACTIONS_CLASS,
  ENTITY_LIST_CLASS,
  ENTITY_LIST_ITEMS_CLASS,
  ENTITY_LIST_META_CLASS,
  ENTITY_LIST_NAME_CLASS,
  ENTITY_LIST_NAME_ROW_CLASS,
  ENTITY_LIST_ROW_CLASS,
  ENTITY_LIST_VALUE_CLASS,
  ENTITY_META_SEP,
  LEGAL_ENTITIES,
  ENTITY_SCOPE,
  entityEditHref,
  entityTypeLabel,
  entityScopeLabel,
  entityJurisdictionLabel,
  entityMetaLine,
  mapOrgLegalEntity,
} from "./legal-entities";

describe("legal entities copy", () => {
  it("has labels for every entity type", () => {
    for (const type of ENTITY_TYPES) {
      expect(entityTypeLabel(type)).toBeTruthy();
      expect(ENTITY_TYPE_LABELS[type]).toBeTruthy();
    }
    expect(ENTITY_TYPES).toContain("llc");
    expect(ENTITY_TYPES).toContain("corporation");
    expect(ENTITY_TYPES).toContain("other");
    expect(ENTITY_TYPES.length).toBe(8);
  });

  it("has scope labels", () => {
    expect(entityScopeLabel("all")).toBe("All entities");
    expect(entityScopeLabel("selected")).toBe("Selected entities");
    expect(ENTITY_SCOPE_LABELS.all).toBe("All entities");
    expect(ENTITY_SCOPE_LABELS.selected).toBe("Selected entities");
  });

  it("has management copy and Coinbase drill-in hrefs", () => {
    expect(LEGAL_ENTITIES.title).toBe("Legal Entities");
    expect(LEGAL_ENTITIES.add).toBe("Add entity");
    expect(LEGAL_ENTITIES.addRow).toBe("Add legal entity");
    expect(LEGAL_ENTITIES.editTitle).toBe("Legal entity");
    expect(LEGAL_ENTITIES.helper).toContain("jurisdiction");
    expect(LEGAL_ENTITIES.addHelper).toContain("new legal entity");
    expect(LEGAL_ENTITIES.nameLabel).toBe("Entity name");
    expect(LEGAL_ENTITIES.typeLabel).toBe("Entity type");
    expect(LEGAL_ENTITIES.default).toBe("Default");
    expect(LEGAL_ENTITIES.forbidden).toContain("account owner");
    expect(LEGAL_ENTITIES.empty).toContain("No legal entities");
    expect(LEGAL_ENTITIES.edit).toBe("Edit");
    expect(LEGAL_ENTITIES.save).toBe("Save");
    expect(LEGAL_ENTITIES.cancel).toBe("Cancel");
    expect(LEGAL_ENTITIES.addHref).toBe("/settings/organization/entities/new");
    expect(ENTITY_EDIT_HREF_BASE).toBe("/settings/organization/entities");
    expect(entityEditHref("ent-1")).toBe("/settings/organization/entities/ent-1");
    expect(LEGAL_ENTITIES.updateFailed).toContain("update");
    expect(entityJurisdictionLabel(null)).toBe(LEGAL_ENTITIES.emptyJurisdiction);
    expect(entityJurisdictionLabel("  ")).toBe(LEGAL_ENTITIES.emptyJurisdiction);
    expect(entityJurisdictionLabel("Delaware")).toBe("Delaware");
  });

  it("has scope selector copy", () => {
    expect(ENTITY_SCOPE.scopeLabel).toBe("Entity scope");
    expect(ENTITY_SCOPE.all).toBe("All entities");
    expect(ENTITY_SCOPE.selected).toBe("Selected entities");
    expect(ENTITY_SCOPE.entityPickerLabel).toBe("Select entities");
  });
});

describe("legal entity list craft — compact meta + mobile drill-in", () => {
  it("joins type · jurisdiction as one muted line — no empty-dash leftover", () => {
    expect(ENTITY_META_SEP).toBe(" · ");
    expect(entityMetaLine("llc", "Wyoming")).toBe("LLC · Wyoming");
    expect(entityMetaLine("llc", "Delaware")).toBe("LLC · Delaware");
    expect(entityMetaLine("trust", null)).toBe("Trust");
    expect(entityMetaLine("trust", "  ")).toBe("Trust");
    expect(entityMetaLine("partnership", "Newfoundland and Labrador, Canada")).toBe(
      "Partnership · Newfoundland and Labrador, Canada",
    );
  });

  it("maps org RPC rows and keeps desktop name-row Edit on Company Name grammar", () => {
    expect(ENTITY_LIST_NAME_ROW_CLASS).toBe(COMPANY_PROFILE_VIEW_CLASS);
    expect(
      mapOrgLegalEntity({
        id: "ent-1",
        name: "Acme LLC",
        entity_type: "llc",
        jurisdiction: "Wyoming",
        is_default: true,
        status: "active",
        created_at: "2026-01-01T00:00:00Z",
      }),
    ).toEqual({
      id: "ent-1",
      name: "Acme LLC",
      entityType: "llc",
      jurisdiction: "Wyoming",
      isDefault: true,
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("reads as list rows — tight name→meta stack, not a typed field form", () => {
    expect(ENTITY_LIST_CLASS).toBe("w-full");
    expect(ENTITY_LIST_ITEMS_CLASS).toContain("divide-y");
    expect(ENTITY_LIST_ROW_CLASS).toContain(HOUSE_PHONE_STACK_CLASS);
    expect(ENTITY_LIST_ROW_CLASS).toContain("gap-[var(--space-1)]");
    expect(ENTITY_LIST_ROW_CLASS).not.toContain("grid-cols");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("t-body");
    expect(ENTITY_LIST_META_CLASS).toContain("t-body-sm");
    expect(ENTITY_LIST_META_CLASS).toContain("text-ink-3");
    expect(ENTITY_LIST_NAME_CLASS).toContain("min-w-0");
    expect(ENTITY_LIST_ACTIONS_CLASS).toBe("shrink-0");
    const src = readFileSync("src/lib/legal-entities.ts", "utf8");
    expect(src).toContain("SettingsDrillRow");
    expect(src).toContain("Type · Jurisdiction");
    expect(src).not.toContain("ENTITY_LIST_GRID_CLASS");
    expect(src).not.toContain("ENTITY_LIST_HEADER_CLASS");
    expect(src).not.toContain("ENTITY_LIST_FIELD_LABEL_CLASS");
  });

  it("keeps phone wrap as one SoT — house gospel never truncate", () => {
    const layout = [
      ENTITY_LIST_CLASS,
      ENTITY_LIST_ITEMS_CLASS,
      ENTITY_LIST_ROW_CLASS,
      ENTITY_LIST_NAME_ROW_CLASS,
      ENTITY_LIST_NAME_CLASS,
      ENTITY_LIST_ACTIONS_CLASS,
      ENTITY_LIST_VALUE_CLASS,
      ENTITY_LIST_META_CLASS,
    ].join(" ");
    expect(housePhoneForbidsTruncate(layout)).toBe(true);
    expect(ENTITY_LIST_VALUE_CLASS).toContain(HOUSE_PHONE_WRAP_CLASS);
    expect(ENTITY_LIST_META_CLASS).toContain(HOUSE_PHONE_WRAP_CLASS);
    const src = readFileSync("src/lib/legal-entities.ts", "utf8");
    expect(src).toContain("HOUSE_PHONE_WRAP_CLASS");
    expect(src).toContain("never truncates");
  });
});
