import { describe, expect, it } from "vitest";

import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPES,
  ENTITY_SCOPE_LABELS,
  LEGAL_ENTITIES,
  ENTITY_SCOPE,
  entityTypeLabel,
  entityScopeLabel,
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
  });

  it("has scope selector copy", () => {
    expect(ENTITY_SCOPE.scopeLabel).toBe("Entity scope");
    expect(ENTITY_SCOPE.all).toBe("All entities");
    expect(ENTITY_SCOPE.selected).toBe("Selected entities");
    expect(ENTITY_SCOPE.entityPickerLabel).toBe("Select entities");
  });
});
