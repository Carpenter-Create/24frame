import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPANY_PROFILE } from "@/lib/account-profile";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import SettingsOrganizationPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/app/(app)/account/actions", () => ({
  saveCompanyName: vi.fn(),
}));

function stubMemberCan(allowed: boolean) {
  const rpc = vi.fn(async (name: string) => {
    if (name !== "member_can") throw new Error(`unexpected rpc(${name})`);
    return { data: allowed, error: null };
  });
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

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

const paneSrc = readFileSync("src/components/settings/organization-settings.tsx", "utf8");

describe("SettingsOrganizationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubMemberCan(true);
  });

  it("holds the company Settings surface under Organization", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsOrganizationPage());
    expect(html).toContain('data-settings-hub="organization"');
    expect(html).toMatch(/<h1[^>]*>Organization<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(html).not.toMatch(/<h2[^>]*>Organization<\/h2>/);
    expect(html).not.toMatch(/<h3[^>]*>Company<\/h3>/);
    expect(html).toContain(SETTINGS.organization);
    expect(html).toContain(COMPANY_PROFILE.nameLabel);
    expect(html).toContain('data-settings-section="company"');
    expect(paneSrc).toContain("settingsPaneTitle");
    expect(paneSrc).not.toContain("SETTINGS.title");
    expect(paneSrc).not.toContain("SETTINGS.company");
    expect(html).toContain("data-company-profile-form");
    expect(html).toContain("Acme");
    expect(html).toContain(COMPANY_PROFILE.save);
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(html).not.toContain("Add user");
    expect(html).not.toContain("Invite");
    expect(html).not.toContain("Team");
    expect(paneSrc).toContain("CompanyProfileForm");
    expect(paneSrc).toContain("member_can");
    expect(paneSrc).toContain("out of scope");
    expect(paneSrc).toContain("Team next");
  });

  it("houses Organization empty when there is no org", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(false) as never);
    const html = renderToStaticMarkup(await SettingsOrganizationPage());
    expect(html).toContain(SETTINGS.organizationEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain("data-company-profile-form");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("is read-only for company when member_can manage_settings is false", async () => {
    const rpc = stubMemberCan(false);
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsOrganizationPage());
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: "u1",
      p_org: "org-1",
      p_capability: "manage_settings",
    });
    expect(html).toContain(COMPANY_PROFILE.forbidden);
    const companyHtml = html.slice(html.indexOf("data-company-profile-form"));
    expect(companyHtml).not.toContain(`>${COMPANY_PROFILE.save}<`);
  });
});
