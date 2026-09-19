import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HOUSE_PHONE_STACK_CLASS,
  HOUSE_PHONE_WRAP_CLASS,
  housePhoneForbidsTruncate,
} from "./house-phone-stack";
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPES,
  ENTITY_SCOPE_LABELS,
  ENTITY_LIST_ACTIONS_CLASS,
  ENTITY_LIST_CLASS,
  ENTITY_LIST_EMPTY_CLASS,
  ENTITY_LIST_FIELD_CLASS,
  ENTITY_LIST_FIELD_LABEL_CLASS,
  ENTITY_LIST_GRID_CLASS,
  ENTITY_LIST_HEADER_CLASS,
  ENTITY_LIST_NAME_CLASS,
  ENTITY_LIST_ROW_CLASS,
  ENTITY_LIST_VALUE_CLASS,
  LEGAL_ENTITIES,
  ENTITY_SCOPE,
  entityTypeLabel,
  entityScopeLabel,
  entityJurisdictionClass,
  entityJurisdictionLabel,
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

  it("has management copy", () => {
    expect(LEGAL_ENTITIES.title).toBe("Legal Entities");
    expect(LEGAL_ENTITIES.add).toBe("Add entity");
    expect(LEGAL_ENTITIES.nameLabel).toBe("Entity name");
    expect(LEGAL_ENTITIES.typeLabel).toBe("Entity type");
    expect(LEGAL_ENTITIES.default).toBe("Default");
    expect(LEGAL_ENTITIES.forbidden).toContain("account owner");
    expect(LEGAL_ENTITIES.empty).toContain("No legal entities");
    expect(LEGAL_ENTITIES.edit).toBe("Edit");
    expect(LEGAL_ENTITIES.save).toBe("Save");
    expect(LEGAL_ENTITIES.cancel).toBe("Cancel");
    expect(LEGAL_ENTITIES.nameColumn).toBe("Name");
    expect(LEGAL_ENTITIES.typeColumn).toBe("Type");
    expect(LEGAL_ENTITIES.jurisdictionColumn).toBe("Jurisdiction");
    expect(LEGAL_ENTITIES.actionsColumn).toBe("Actions");
    expect(LEGAL_ENTITIES.updateFailed).toContain("update");
    expect(entityJurisdictionLabel(null)).toBe(LEGAL_ENTITIES.emptyJurisdiction);
    expect(entityJurisdictionLabel("  ")).toBe(LEGAL_ENTITIES.emptyJurisdiction);
    expect(entityJurisdictionLabel("Delaware")).toBe("Delaware");
    expect(ENTITY_LIST_HEADER_CLASS).toContain("t-label");
    expect(ENTITY_LIST_ROW_CLASS).toContain("grid");
    expect(ENTITY_LIST_HEADER_CLASS).toContain(ENTITY_LIST_GRID_CLASS);
    expect(ENTITY_LIST_ROW_CLASS).toContain(ENTITY_LIST_GRID_CLASS);
    expect(ENTITY_LIST_HEADER_CLASS).toContain("t-label");
    expect(ENTITY_LIST_HEADER_CLASS).toContain("text-ink-3");
    expect(ENTITY_LIST_CLASS).toBe("w-full");
    expect(ENTITY_LIST_CLASS).not.toContain("overflow-x-auto");
    expect(ENTITY_LIST_GRID_CLASS).toContain("w-full");
    expect(ENTITY_LIST_GRID_CLASS).toContain("grid-cols-1");
    expect(ENTITY_LIST_GRID_CLASS).toContain("md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]");
    expect(ENTITY_LIST_GRID_CLASS).toContain("md:gap-x-[var(--space-6)]");
    expect(ENTITY_LIST_GRID_CLASS).not.toContain("w-max");
    expect(ENTITY_LIST_GRID_CLASS).not.toContain("max-content");
    expect(ENTITY_LIST_HEADER_CLASS).toContain("max-md:hidden");
    expect(ENTITY_LIST_FIELD_CLASS).toContain("flex-col");
    expect(ENTITY_LIST_FIELD_CLASS).toContain("w-full");
    expect(ENTITY_LIST_FIELD_CLASS).toContain("items-stretch");
    expect(ENTITY_LIST_FIELD_CLASS).not.toContain("items-start");
    expect(ENTITY_LIST_FIELD_CLASS).toContain("md:block");
    expect(ENTITY_LIST_FIELD_LABEL_CLASS).toContain("md:hidden");
    expect(ENTITY_LIST_NAME_CLASS).toContain("flex-wrap");
    expect(ENTITY_LIST_NAME_CLASS).toContain("w-full");
    expect(ENTITY_LIST_ACTIONS_CLASS).toContain("md:justify-self-end");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("break-words");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("min-w-0");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("max-w-full");
    expect(ENTITY_LIST_VALUE_CLASS).not.toContain("truncate");
    expect(ENTITY_LIST_EMPTY_CLASS).not.toContain("truncate");
    expect(entityJurisdictionClass("Delaware")).toBe(ENTITY_LIST_VALUE_CLASS);
    expect(entityJurisdictionClass(null)).toBe(ENTITY_LIST_EMPTY_CLASS);
    expect(entityJurisdictionClass("  ")).toBe(ENTITY_LIST_EMPTY_CLASS);
    expect(ENTITY_LIST_VALUE_CLASS).toContain("text-ink");
    expect(ENTITY_LIST_VALUE_CLASS).not.toContain("text-ink-3");
    expect(ENTITY_LIST_EMPTY_CLASS).toContain("text-ink-3");
  });

  it("keeps phone stack + desktop spread as one SoT — house gospel never truncate", () => {
    const layout = [
      ENTITY_LIST_CLASS,
      ENTITY_LIST_GRID_CLASS,
      ENTITY_LIST_HEADER_CLASS,
      ENTITY_LIST_ROW_CLASS,
      ENTITY_LIST_NAME_CLASS,
      ENTITY_LIST_FIELD_CLASS,
      ENTITY_LIST_FIELD_LABEL_CLASS,
      ENTITY_LIST_ACTIONS_CLASS,
      ENTITY_LIST_VALUE_CLASS,
      ENTITY_LIST_EMPTY_CLASS,
    ].join(" ");
    expect(housePhoneForbidsTruncate(layout)).toBe(true);
    expect(ENTITY_LIST_FIELD_CLASS).toContain(HOUSE_PHONE_STACK_CLASS);
    expect(ENTITY_LIST_VALUE_CLASS).toContain(HOUSE_PHONE_WRAP_CLASS);
    expect(ENTITY_LIST_EMPTY_CLASS).toContain(HOUSE_PHONE_WRAP_CLASS);
    expect(ENTITY_LIST_GRID_CLASS).toMatch(/grid-cols-1/);
    expect(ENTITY_LIST_GRID_CLASS).toMatch(/md:grid-cols-\[/);
    expect(ENTITY_LIST_GRID_CLASS).toMatch(/2fr/);
    expect(ENTITY_LIST_FIELD_CLASS).toContain("w-full");
    expect(ENTITY_LIST_FIELD_CLASS).toContain("items-stretch");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("min-w-0");
    expect(ENTITY_LIST_VALUE_CLASS).toContain("max-w-full");
    const src = readFileSync("src/lib/legal-entities.ts", "utf8");
    expect(src).toContain("HOUSE_PHONE_WRAP_CLASS");
    expect(src).toContain("HOUSE_PHONE_STACK_CLASS");
    expect(src).toContain("house gospel 2026-09-19");
  });

  it("has scope selector copy", () => {
    expect(ENTITY_SCOPE.scopeLabel).toBe("Entity scope");
    expect(ENTITY_SCOPE.all).toBe("All entities");
    expect(ENTITY_SCOPE.selected).toBe("Selected entities");
    expect(ENTITY_SCOPE.entityPickerLabel).toBe("Select entities");
  });
});
