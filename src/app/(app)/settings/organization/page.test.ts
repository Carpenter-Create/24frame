import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPANY_PROFILE } from "@/lib/account-profile";
import { ACCOUNT_INVITE } from "@/lib/account-invite";
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
    if (name === "member_can") return { data: allowed, error: null };
    if (name === "org_team" || name === "org_pending_invites") return { data: [], error: null };
    if (name === "org_legal_entities") return { data: [], error: null };
    throw new Error(`unexpected rpc(${name})`);
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
    expect(html).toMatch(/<h1[^>]*>Rights Holder<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(html).not.toMatch(/<h2[^>]*>Rights Holder<\/h2>/);
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
    expect(html).toContain(SETTINGS.team);
    expect(html).toContain("data-settings-section=\"team\"");
    expect(html).toContain("data-team-invite-cta");
    expect(html).toContain("data-team-invite-form");
    expect(html).toContain(ACCOUNT_INVITE.invite);
    expect(paneSrc).toContain("CompanyProfileForm");
    expect(paneSrc).toContain("TeamInviteForm");
    expect(paneSrc).toContain("member_can");
    expect(paneSrc).not.toContain("out of scope");
  });

  it("shows Invited on pending and Accepted on members", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "org_team") {
        return {
          data: [
            {
              user_id: "u1",
              email: "ada@example.com",
              role: "account_owner",
              status: "active",
              joined_at: "2026-01-01T00:00:00Z",
              display_name: "Ada",
              invited_at: "2025-12-20T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      if (name === "org_pending_invites") {
        return {
          data: [
            {
              id: "inv-1",
              email: "pat@example.com",
              role: "viewer",
              expires_at: "2026-10-03T00:00:00Z",
              created_at: "2026-09-19T00:00:00Z",
              entity_scope: "all",
            },
          ],
          error: null,
        };
      }
      if (name === "org_legal_entities") return { data: [], error: null };
      throw new Error(`unexpected rpc(${name})`);
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);

    const html = renderToStaticMarkup(await SettingsOrganizationPage());
    expect(html).toContain("ada@example.com");
    expect(html).toContain("pat@example.com");
    expect(html).toContain("Ada");
    expect(html).toContain("data-team-list");
    expect(html).toContain("data-team-invite-cta");
    expect(html).toContain(ACCOUNT_INVITE.nameColumn);
    expect(html).toContain(ACCOUNT_INVITE.statusColumn);
    expect(html).toContain(ACCOUNT_INVITE.sentColumn);
    expect(html).toContain(ACCOUNT_INVITE.acceptedColumn);
    expect(html).toContain('data-invite-status="accepted"');
    expect(html).toContain('data-invite-status="invited"');
    expect(html).toContain(ACCOUNT_INVITE.accepted);
    expect(html).toContain(ACCOUNT_INVITE.invited);
    expect(html).toContain(ACCOUNT_INVITE.revoke);
    expect(html).toContain("Jan 1, 2026");
    expect(html).toContain("Sep 19, 2026");
    expect(html).toContain("Dec 20, 2025");
    expect(html).toContain("data-invite-date");
    expect(html).not.toContain("Withdrawn");
    expect(html).not.toContain("Removed");
    expect(html).not.toContain("Needs review");
    expect(html).not.toContain("Ownership");
    expect(html).not.toContain("Invite a user");
    const memberStart = html.indexOf("ada@example.com");
    const memberRow = html.slice(html.lastIndexOf("<li", memberStart), html.indexOf("</li>", memberStart));
    expect(memberRow).not.toContain(ACCOUNT_INVITE.revoke);
    expect(memberRow).toContain("Jan 1, 2026");
    const pendingStart = html.indexOf("pat@example.com");
    const pendingRow = html.slice(html.lastIndexOf("<li", pendingStart), html.indexOf("</li>", pendingStart));
    expect(pendingRow).toContain(ACCOUNT_INVITE.revoke);
    expect(pendingRow).toContain("—");
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
