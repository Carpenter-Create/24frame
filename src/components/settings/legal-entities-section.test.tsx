import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ENTITY_LIST_EMPTY_CLASS,
  ENTITY_LIST_VALUE_CLASS,
  LEGAL_ENTITIES,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import { LegalEntitiesSection } from "./legal-entities-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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
];

describe("LegalEntitiesSection table", () => {
  it("renders header columns and Edit when canManage", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage entities={ENTITIES} />,
    );
    expect(html).toContain("data-entity-list");
    expect(html).toContain("data-entity-list-head");
    expect(html).toContain(LEGAL_ENTITIES.nameColumn);
    expect(html).toContain(LEGAL_ENTITIES.typeColumn);
    expect(html).toContain(LEGAL_ENTITIES.jurisdictionColumn);
    expect(html).toContain(LEGAL_ENTITIES.actionsColumn);
    expect(html).toContain(LEGAL_ENTITIES.edit);
    expect(html).toContain("data-entity-edit");
    expect(html).toContain("Acme LLC");
    expect(html).toContain("LLC");
    expect(html).toContain("Delaware");
    expect(html).toContain(LEGAL_ENTITIES.default);
    expect(html).toContain("Acme Trust");
    expect(html).toContain("Trust");
    expect(html).toContain(LEGAL_ENTITIES.emptyJurisdiction);
    expect(html).not.toContain("Delete");
    expect(html).not.toContain("Archive");
  });

  it("hides Edit when the caller cannot manage", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage={false} entities={ENTITIES} />,
    );
    expect(html).toContain(LEGAL_ENTITIES.nameColumn);
    expect(html).toContain("Acme LLC");
    expect(html).toContain(LEGAL_ENTITIES.default);
    expect(html).toContain(LEGAL_ENTITIES.forbidden);
    expect(html).not.toContain(`>${LEGAL_ENTITIES.edit}<`);
    expect(html).not.toContain("data-entity-edit");
    expect(html).not.toContain("data-entity-add-cta");
  });

  it("keeps add as a CTA and Edit as a row action — mutate in house Dialog", () => {
    const src = readFileSync("src/components/settings/legal-entities-section.tsx", "utf8");
    expect(src).toContain("data-entity-add-cta");
    expect(src).toContain("data-entity-edit");
    expect(src).toContain("data-entity-edit-form");
    expect(src).toContain("updateLegalEntity");
    expect(src).toContain("ENTITY_LIST_HEADER_CLASS");
    expect(src).toContain("ENTITY_LIST_ROW_CLASS");
    expect(src).toContain("ENTITY_LIST_VALUE_CLASS");
    expect(src).toContain("LEGAL_ENTITIES.actionsColumn");
    expect(src).toContain("<Dialog");
    expect(src).toContain("DialogFooter");
    expect(src).toContain('import { Select } from "@/components/ui/select"');
    expect(src).toContain('id="entity-type"');
    expect(src).not.toContain("<select");
    expect(src).not.toContain("flex flex-col gap-[var(--space-4)]");
  });

  it("uses primary ink for name/type/jurisdiction and a muted em dash when empty", () => {
    const html = renderToStaticMarkup(
      <LegalEntitiesSection orgId="org-1" canManage entities={ENTITIES} />,
    );
    expect(html).toContain(ENTITY_LIST_VALUE_CLASS);
    expect(html).toContain(ENTITY_LIST_EMPTY_CLASS);
    const trustStart = html.indexOf("Acme Trust");
    const trustRow = html.slice(html.lastIndexOf("<li", trustStart), html.indexOf("</li>", trustStart));
    expect(trustRow).toContain(ENTITY_LIST_EMPTY_CLASS);
    expect(trustRow).toContain(LEGAL_ENTITIES.emptyJurisdiction);
  });
});
