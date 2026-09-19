import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPANY_PROFILE } from "@/lib/account-profile";
import { ORG_TEAM } from "@/lib/org-team";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import SettingsAggregationPage from "./page";

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
vi.mock("@/app/(app)/settings/aggregation/actions", () => ({
  inviteOrgMember: vi.fn(),
  updateOrgMember: vi.fn(),
}));

function stubRpcs({
  manageSettings = true,
  manageTeam = true,
  members = [] as {
    membership_id: string;
    user_id: string;
    email: string;
    display_name: string | null;
    role: string;
    status: string;
  }[],
} = {}) {
  const rpc = vi.fn(async (name: string, args?: { p_capability?: string }) => {
    if (name === "member_can") {
      if (args?.p_capability === "manage_settings") return { data: manageSettings, error: null };
      if (args?.p_capability === "manage_team") return { data: manageTeam, error: null };
      throw new Error(`unexpected capability ${args?.p_capability}`);
    }
    if (name === "org_team_directory") {
      if (!manageTeam) throw new Error("directory must not run without manage_team");
      return { data: members, error: null };
    }
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

function ctx(hasOrg = true, role = "account_owner") {
  const org = hasOrg ? { id: "org-1", name: "Acme", status: "active" } : null;
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: org ? [{ role, organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? role : null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const paneSrc = readFileSync("src/components/settings/aggregation-settings.tsx", "utf8");

describe("SettingsAggregationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubRpcs();
  });

  it("holds the existing company Settings surface and Org Team for an owner", async () => {
    const rpc = stubRpcs({
      members: [
        {
          membership_id: "m1",
          user_id: "u1",
          email: "ada@example.com",
          display_name: "Ada",
          role: "account_owner",
          status: "active",
        },
      ],
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsAggregationPage());
    expect(html).toContain('data-settings-hub="aggregation"');
    expect(html).toContain(SETTINGS.title);
    expect(html).toContain(SETTINGS.aggregation);
    expect(html).toContain(SETTINGS.company);
    expect(html).toContain('data-settings-section="company"');
    expect(html).toContain("data-company-profile-form");
    expect(html).toContain("Acme");
    expect(html).toContain(COMPANY_PROFILE.save);
    expect(html).toContain(SETTINGS.team);
    expect(html).toContain('data-settings-section="team"');
    expect(html).toContain("data-org-team-form");
    expect(html).toContain("data-org-team-add");
    expect(html).toContain(ORG_TEAM.addUser);
    expect(html).toContain("ada@example.com");
    expect(html).toContain("account_owner");
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(paneSrc).toContain("CompanyProfileForm");
    expect(paneSrc).toContain("OrgTeamForm");
    expect(paneSrc).toContain("manage_team");
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: "u1",
      p_org: "org-1",
      p_capability: "manage_settings",
    });
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: "u1",
      p_org: "org-1",
      p_capability: "manage_team",
    });
    expect(rpc).toHaveBeenCalledWith("org_team_directory", { p_org: "org-1" });
  });

  it("houses Aggregation empty when there is no org", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(false) as never);
    const html = renderToStaticMarkup(await SettingsAggregationPage());
    expect(html).toContain(SETTINGS.aggregationEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain("data-company-profile-form");
    expect(html).not.toContain("data-org-team-form");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("is read-only for company when member_can manage_settings is false", async () => {
    const rpc = stubRpcs({ manageSettings: false, manageTeam: false });
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsAggregationPage());
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: "u1",
      p_org: "org-1",
      p_capability: "manage_settings",
    });
    expect(html).toContain(COMPANY_PROFILE.forbidden);
    const companyHtml = html.slice(html.indexOf("data-company-profile-form"));
    expect(companyHtml).not.toContain(`>${COMPANY_PROFILE.save}<`);
  });

  it("hides Team and Add when member_can manage_team is false", async () => {
    const rpc = stubRpcs({ manageSettings: true, manageTeam: false });
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true, "viewer") as never);
    const html = renderToStaticMarkup(await SettingsAggregationPage());
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: "u1",
      p_org: "org-1",
      p_capability: "manage_team",
    });
    expect(rpc.mock.calls.some(([name]) => name === "org_team_directory")).toBe(false);
    expect(html).toContain(SETTINGS.company);
    expect(html).not.toContain('data-settings-section="team"');
    expect(html).not.toContain("data-org-team-form");
    expect(html).not.toContain(ORG_TEAM.addUser);
  });
});
