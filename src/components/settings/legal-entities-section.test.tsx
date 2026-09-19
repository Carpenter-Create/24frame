import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ENTITY_LIST_CLASS,
  ENTITY_LIST_ITEMS_CLASS,
  ENTITY_LIST_META_CLASS,
  LEGAL_ENTITIES,
  entityEditHref,
  entityMetaLine,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import { LegalEntitiesSection } from "./legal-entities-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/(app)/settings/organization/actions", () => ({
  addLegalEntity: vi.fn(),
  updateLegalEntity: vi.fn(),
}));

const ENTITIES: LegalEntityRow[] = [
  {
    id: "ent-1",
    name: "Acme LLC",
    entityType: "llc",
    jurisdiction: "Delaware",
    isDefault: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "ent-2",
    name: "Acme Trust",
    entityType: "trust",
    jurisdiction: null,
    isDefault: false,
    status: "active",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "ent-3",
    name: "North Atlantic Documentary Holdings Limited Partnership of Newfoundland",
    entityType: "partnership",
    jurisdiction: "Newfoundland and Labrador, Canada",
    isDefault: false,
    status: "active",
    createdAt: "2026-03-01T00:00:00Z",
  },
];

function entityRow(html: string, name: string) {
  const start = html.indexOf(name);
  return html.slice(html.lastIndexOf("<li", start), html.indexOf("</li>", start));
}

describe("LegalEntitiesSection list rows", () => {
  it("renders mobile drill rows and desktop name-row Edit when canManage", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage entities={ENTITIES} />,
    );
    expect(html).toContain("data-entity-list");
    expect(html).not.toContain("data-entity-list-head");
    expect(html).toContain('data-settings-drill-row="entity-ent-1"');
    expect(html).toContain(entityEditHref("ent-1"));
    expect(html).toContain(LEGAL_ENTITIES.add);
    expect(html).toContain("data-entity-add-cta");
    expect(html).toContain(LEGAL_ENTITIES.edit);
    expect(html).toContain("data-entity-edit");
    expect(html).toContain("Acme LLC");
    expect(html).toContain(entityMetaLine("llc", "Delaware"));
    expect(html).toContain(LEGAL_ENTITIES.default);
    expect(html).toContain("Acme Trust");
    expect(html).toContain(entityMetaLine("trust", null));
    expect(html).not.toContain("Delete");
    expect(html).not.toContain("Archive");
    const acme = entityRow(html, "Acme LLC");
    expect(acme).toContain('data-settings-drill-row="entity-ent-1"');
    expect(acme).toContain(entityEditHref("ent-1"));
    expect(acme).toContain("data-entity-edit");
  });

  it("hides Edit and drill when the caller cannot manage", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage={false} entities={ENTITIES} />,
    );
    expect(html).toContain("Acme LLC");
    expect(html).toContain(LEGAL_ENTITIES.default);
    expect(html).toContain(LEGAL_ENTITIES.forbidden);
    expect(html).toContain(entityMetaLine("llc", "Delaware"));
    expect(html).not.toContain(`>${LEGAL_ENTITIES.edit}<`);
    expect(html).not.toContain("data-entity-edit");
    expect(html).not.toContain("data-entity-add-cta");
    expect(html).not.toContain("data-settings-drill-row");
    expect(html).not.toContain(entityEditHref("ent-1"));
  });

  it("keeps add as a CTA — mobile drills in, desktop mutates in house Dialog", () => {
    const src = readFileSync("src/components/settings/legal-entities-section.tsx", "utf8");
    expect(src).toContain("data-entity-add-cta");
    expect(src).toContain("LEGAL_ENTITIES.addHref");
    expect(src).toContain("entityEditHref");
    expect(src).toContain("SettingsDrillRow");
    expect(src).toContain("LegalEntityEditor");
    expect(src).toContain("data-entity-edit");
    expect(src).toContain("md:hidden");
    expect(src).toContain("<Dialog");
    expect(src).toContain("ENTITY_LIST_CLASS");
    expect(src).toContain("entityMetaLine");
    expect(src).not.toContain("ENTITY_LIST_HEADER_CLASS");
    expect(src).not.toContain("ENTITY_LIST_FIELD_LABEL_CLASS");
    expect(src).not.toContain("overflow-x-auto");
    expect(src).not.toContain("truncate");
    expect(src).not.toContain("ellipsis");
  });

  it("keeps long name/jurisdiction in full on the compact meta line", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage entities={ENTITIES} />,
    );
    expect(html).toContain(ENTITY_LIST_CLASS);
    expect(html).toContain(ENTITY_LIST_ITEMS_CLASS);
    expect(html).toContain(ENTITY_LIST_META_CLASS);
    expect(html).toContain(
      "North Atlantic Documentary Holdings Limited Partnership of Newfoundland",
    );
    expect(html).toContain(
      entityMetaLine("partnership", "Newfoundland and Labrador, Canada"),
    );
    const longRow = entityRow(
      html,
      "North Atlantic Documentary Holdings Limited Partnership of Newfoundland",
    );
    expect(longRow).toContain('data-settings-drill-row="entity-ent-3"');
    expect(longRow).toContain(entityEditHref("ent-3"));
    expect(longRow).not.toContain("truncate");
    expect(html).not.toContain("overflow-x-auto");
  });

  it("gives every entity its own drill and desktop Edit", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage entities={ENTITIES} />,
    );
    for (const entity of ENTITIES) {
      const row = entityRow(html, entity.name);
      expect(row).toContain(entityEditHref(entity.id));
      expect(row).toContain("data-entity-edit");
      expect(row).toContain(entityMetaLine(entity.entityType, entity.jurisdiction));
    }
  });
});
