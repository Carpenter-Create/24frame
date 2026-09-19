import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEGAL_ENTITIES, entityEditHref } from "@/lib/legal-entities";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import OrganizationEntityNewPage from "./new/page";
import OrganizationEntityEditPage from "./[entityId]/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/app/(app)/settings/organization/actions", () => ({
  addLegalEntity: vi.fn(),
  updateLegalEntity: vi.fn(),
}));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: [{ role: "account_owner", organizations: { id: "org-1", name: "Acme" } }],
    orgs: [{ id: "org-1", name: "Acme" }],
    activeOrg: { id: "org-1", name: "Acme", status: "active" },
    activeRole: "account_owner",
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

describe("Legal entity add/edit panes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "org_legal_entities") {
        return {
          data: [
            {
              id: "ent-1",
              name: "Acme LLC",
              entity_type: "llc",
              jurisdiction: "Wyoming",
              is_default: true,
              status: "active",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      throw new Error(`unexpected rpc(${name})`);
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("adds through a Coinbase pane — not a mobile modal", async () => {
    const html = renderToStaticMarkup(await OrganizationEntityNewPage());
    expect(html).toContain("data-settings-edit-pane");
    expect(html).toMatch(/<h1[^>]*>Add entity<\/h1>/);
    expect(html).toContain(SETTINGS.organization);
    expect(html).toContain(LEGAL_ENTITIES.addHelper);
    expect(html).toContain("data-entity-add-form");
    expect(html).toContain(LEGAL_ENTITIES.nameLabel);
    expect(html).not.toContain("<Dialog");
    const src = readFileSync("src/app/(app)/settings/organization/entities/new/page.tsx", "utf8");
    expect(src).toContain("SettingsEditPane");
    expect(src).toContain('mode="add"');
    expect(src).toContain('chrome="pane"');
  });

  it("edits through a Coinbase pane for the named entity", async () => {
    const html = renderToStaticMarkup(
      await OrganizationEntityEditPage({ params: Promise.resolve({ entityId: "ent-1" }) }),
    );
    expect(html).toContain("data-settings-edit-pane");
    expect(html).toMatch(/<h1[^>]*>Legal entity<\/h1>/);
    expect(html).toContain(LEGAL_ENTITIES.helper);
    expect(html).toContain("data-entity-edit-form");
    expect(html).toContain("Acme LLC");
    expect(html).toContain(SETTINGS.organizationHref);
    expect(html).not.toContain("<Dialog");
    const src = readFileSync(
      "src/app/(app)/settings/organization/entities/[entityId]/page.tsx",
      "utf8",
    );
    expect(src).toContain("entityEditHref");
    expect(src).toContain('mode="edit"');
    expect(entityEditHref("ent-1")).toBe("/settings/organization/entities/ent-1");
  });
});
