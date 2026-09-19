import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPANY_PROFILE } from "@/lib/account-profile";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import OrganizationCompanyPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/app/(app)/account/actions", () => ({
  saveCompanyName: vi.fn(),
}));

function ctx(hasOrg = true) {
  const org = hasOrg ? { id: "org-1", name: "Acme", status: "active" } : null;
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

describe("OrganizationCompanyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "org_legal_entities") return { data: [], error: null };
      throw new Error(`unexpected rpc(${name})`);
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  });

  it("is a Coinbase edit pane — back to Rights Holder, title, helper, one form", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await OrganizationCompanyPage());
    expect(html).toContain("data-settings-edit-pane");
    expect(html).toMatch(/<h1[^>]*>Company name<\/h1>/);
    expect(html).toContain(SETTINGS.organization);
    expect(html).toContain(SETTINGS.organizationHref);
    expect(html).toContain(COMPANY_PROFILE.subtitle);
    expect(html).toContain("data-company-profile-form");
    expect(html).toContain(COMPANY_PROFILE.save);
    expect(html).not.toContain("<Dialog");
    const src = readFileSync("src/app/(app)/settings/organization/company/page.tsx", "utf8");
    expect(src).toContain("SettingsEditPane");
    expect(src).toContain("CompanyNameEditor");
    expect(src).toContain('chrome="pane"');
    expect(src).not.toContain("@phosphor-icons/react");
  });
});
