import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ACCOUNT_INVITE } from "@/lib/account-invite";
import { HOUSE_FORM_SELECT_PANEL_CLASS, HOUSE_FORM_SELECT_TRIGGER_CLASS } from "@/lib/house-form-select";
import { TeamInviteForm } from "./team-invite-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(app)/settings/organization/actions", () => ({
  inviteTeamMember: vi.fn(),
  revokeTeamInvite: vi.fn(),
}));

describe("TeamInviteForm ROLE select", () => {
  it("puts Invite ROLE on the house form Select — light menu, house input field", () => {
    const html = renderToStaticMarkup(
      <TeamInviteForm orgId="org-1" canInvite members={[]} pending={[]} />,
    );
    expect(html).toContain("data-team-invite-form");
    expect(html).toContain("data-house-form-select");
    expect(html).toContain('id="team-invite-role"');
    expect(html).toContain(ACCOUNT_INVITE.emailLabel);
    expect(html).toContain(ACCOUNT_INVITE.roleLabel);
    expect(html).toContain(ACCOUNT_INVITE.cancel);
    expect(html).toContain(ACCOUNT_INVITE.invite);
    expect(html).toContain('data-settings-drill-row="team-invite"');
    expect(html).toContain("data-team-invite-cta");
    expect(html).toContain("data-settings-group");
    expect(html).not.toContain("data-team-list-head");
    expect(html).toContain(HOUSE_FORM_SELECT_TRIGGER_CLASS);
    expect(html).not.toContain("<select");
    expect(html).not.toContain("bg-ink text-surface");
  });

  it("does not keep a Team-Invite dark menu twin", () => {
    const src = readFileSync("src/components/settings/team-invite-form.tsx", "utf8");
    expect(src).toContain('import { Select } from "@/components/ui/select"');
    expect(src).toContain("<Label htmlFor=\"team-invite-role\">");
    expect(src).toContain("<Label htmlFor=\"team-invite-email\">");
    expect(src).toContain("DialogFooter");
    expect(src).not.toContain("<select");
    expect(src).not.toContain("formControlClass");
    expect(src).not.toContain("bg-ink");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).toContain("bg-surface");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).not.toContain("bg-ink");
  });
});
