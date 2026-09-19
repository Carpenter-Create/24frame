import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ORG_TEAM, ORG_TEAM_ROLES, ORG_TEAM_STATUSES } from "@/lib/org-team";
import { OrgTeamForm } from "./org-team-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/app/(app)/settings/aggregation/actions", () => ({
  inviteOrgMember: vi.fn(),
  updateOrgMember: vi.fn(),
}));

describe("OrgTeamForm", () => {
  it("lists current memberships and exposes Add user with exact role and status values", () => {
    const html = renderToStaticMarkup(
      <OrgTeamForm
        orgId="org-1"
        members={[
          {
            membershipId: "m1",
            userId: "u1",
            email: "ada@example.com",
            displayName: "Ada",
            role: "account_owner",
            status: "active",
          },
        ]}
      />,
    );
    expect(html).toContain("data-org-team-form");
    expect(html).toContain("data-org-team-list");
    expect(html).toContain("data-org-team-row");
    expect(html).toContain("data-org-team-add");
    expect(html).toContain("Ada");
    expect(html).toContain("ada@example.com");
    expect(html).toContain(ORG_TEAM.addUser);
    expect(html).toContain(ORG_TEAM.emailLabel);
    for (const role of ORG_TEAM_ROLES) expect(html).toContain(role);
    for (const status of ORG_TEAM_STATUSES) expect(html).toContain(status);
  });

  it("does not invent a second add control when the list is empty", () => {
    const html = renderToStaticMarkup(<OrgTeamForm orgId="org-1" members={[]} />);
    expect(html).toContain(ORG_TEAM.empty);
    expect(html).toContain("data-org-team-add");
    expect(html).not.toContain("data-org-team-list");
  });
});
