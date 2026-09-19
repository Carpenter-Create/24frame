import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES_CATALOG, ORG_ROLE_LABELS } from "@/lib/org-roles";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import SettingsOrganizationRolesPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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

function stubRpc(canManage: boolean, teamData: unknown[] = [], customRoles: unknown[] = []) {
  const rpc = vi.fn(async (name: string) => {
    if (name === "member_can") return { data: canManage, error: null };
    if (name === "org_team") return { data: teamData, error: null };
    if (name === "list_org_custom_roles") return { data: customRoles, error: null };
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

describe("SettingsOrganizationRolesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login when not authenticated", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(SettingsOrganizationRolesPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /settings/organization when no active org", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(false) as never);
    await expect(SettingsOrganizationRolesPage()).rejects.toThrow(
      "REDIRECT:/settings/organization",
    );
  });

  it("renders the Roles catalog with system roles", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    stubRpc(true, [
      {
        user_id: "u1",
        email: "ada@example.com",
        role: "account_owner",
        status: "active",
        joined_at: "2026-01-01T00:00:00Z",
        display_name: "Ada",
        invited_at: null,
      },
    ]);

    const html = renderToStaticMarkup(await SettingsOrganizationRolesPage());
    expect(html).toContain("data-roles-catalog");
    expect(html).toContain("data-settings-page-lead");
    expect(html).toContain(ROLES_CATALOG.title);
    expect(html).toContain(ROLES_CATALOG.roleColumn);
    expect(html).toContain(ROLES_CATALOG.descriptionColumn);
    expect(html).toContain(ROLES_CATALOG.typeColumn);
    expect(html).toContain(ROLES_CATALOG.membersColumn);
    expect(html).toContain(ROLES_CATALOG.statusColumn);

    for (const label of Object.values(ORG_ROLE_LABELS)) {
      expect(html).toContain(label);
    }

    expect(html).toContain(ROLES_CATALOG.systemType);
    expect(html).toContain(ROLES_CATALOG.activeStatus);
    expect(html).toContain("data-role-type=\"system\"");
    expect(html).toContain("data-create-role-cta");
    expect(html).toContain(ROLES_CATALOG.createRole);
  });

  it("backs to Rights Holder through the house page lead", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    stubRpc(true);
    const html = renderToStaticMarkup(await SettingsOrganizationRolesPage());
    expect(html).toContain("data-settings-page-lead");
    expect(html).toContain(SETTINGS.organizationHref);
    expect(html).toContain(SETTINGS.organization);
    expect(html).not.toContain("data-roles-back");
  });

  it("hides Create role CTA when canManage is false", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    stubRpc(false);
    const html = renderToStaticMarkup(await SettingsOrganizationRolesPage());
    expect(html).not.toContain("data-create-role-cta");
    expect(html).toContain(ROLES_CATALOG.forbidden);
  });

  it("renders custom roles alongside system roles", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    stubRpc(true, [], [
      {
        id: "cr-1",
        name: "Content Reviewer",
        description: "Reviews title metadata",
        status: "active",
        capabilities: ["view", "operate"],
        member_count: 2,
        created_at: "2026-09-19T00:00:00Z",
      },
    ]);

    const html = renderToStaticMarkup(await SettingsOrganizationRolesPage());
    expect(html).toContain("Content Reviewer");
    expect(html).toContain("Reviews title metadata");
    expect(html).toContain("data-role-type=\"custom\"");
    expect(html).toContain(ROLES_CATALOG.customType);
  });

  it("counts members per system role from team data", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    stubRpc(true, [
      {
        user_id: "u1",
        email: "ada@example.com",
        role: "account_owner",
        status: "active",
        joined_at: "2026-01-01T00:00:00Z",
        display_name: "Ada",
        invited_at: null,
      },
      {
        user_id: "u2",
        email: "bob@example.com",
        role: "viewer",
        status: "active",
        joined_at: "2026-02-01T00:00:00Z",
        display_name: "Bob",
        invited_at: null,
      },
    ]);

    const html = renderToStaticMarkup(await SettingsOrganizationRolesPage());
    const accountOwnerStart = html.indexOf(ORG_ROLE_LABELS.account_owner);
    const accountOwnerRow = html.slice(
      html.lastIndexOf("<li", accountOwnerStart),
      html.indexOf("</li>", accountOwnerStart),
    );
    expect(accountOwnerRow).toContain("rounded-full");
    expect(accountOwnerRow).toContain("AD");
  });
});
