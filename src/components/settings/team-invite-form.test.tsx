import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ACCOUNT_INVITE } from "@/lib/account-invite";
import { HOUSE_FORM_SELECT_PANEL_CLASS, HOUSE_FORM_SELECT_TRIGGER_CLASS } from "@/lib/house-form-select";
import {
  SETTINGS_DIALOG_ERROR_CLASS,
  SETTINGS_DIALOG_GROUP_CLASS,
  SETTINGS_DIALOG_LABEL_CLASS,
} from "@/lib/settings";
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
    expect(html).toContain(SETTINGS_DIALOG_LABEL_CLASS);
    expect(html).toContain(SETTINGS_DIALOG_GROUP_CLASS);
    expect(html).toContain('data-dialog-presentation="sheet"');
    expect(html).toContain("data-team-invite-fields");
    const emailLabel = html.slice(
      html.indexOf('for="team-invite-email"'),
      html.indexOf('id="team-invite-email"'),
    );
    expect(emailLabel).toContain(SETTINGS_DIALOG_LABEL_CLASS);
    expect(emailLabel).not.toContain("t-label");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("bg-ink text-surface");
    expect(html).not.toContain("Could not find the function");
    expect(html).not.toContain("schema cache");
  });

  it("puts a house IdentityAvatar on person rows — not the Invite door", () => {
    const html = renderToStaticMarkup(
      <TeamInviteForm
        orgId="org-1"
        canInvite
        members={[
          {
            userId: "u1",
            email: "ada@example.com",
            role: "account_owner",
            name: "Ada Lovelace",
            sentAt: "2026-01-01",
            acceptedAt: "2026-01-02",
            photoUrl: "https://s3.example/ada",
          },
        ]}
        pending={[{ id: "inv-1", email: "pat@example.com", role: "viewer", sentAt: "2026-09-19", entityScope: "all" }]}
      />,
    );
    const memberStart = html.indexOf("ada@example.com");
    const memberRow = html.slice(html.lastIndexOf("<li", memberStart), html.indexOf("</li>", memberStart));
    const pendingStart = html.indexOf("pat@example.com");
    const pendingRow = html.slice(html.lastIndexOf("<li", pendingStart), html.indexOf("</li>", pendingStart));
    const inviteStart = html.indexOf('data-settings-drill-row="team-invite"');
    const inviteRow = html.slice(inviteStart, html.indexOf("</button>", inviteStart));

    expect(memberRow).toContain("data-identity-avatar");
    expect(memberRow).toContain("data-settings-drill-leading");
    expect(memberRow).toContain('src="https://s3.example/ada"');
    expect(memberRow).toContain("data-identity-photo");
    expect(pendingRow).toContain("data-identity-avatar");
    expect(pendingRow).toContain(">PA<");
    expect(pendingRow).not.toContain("<img");
    expect(inviteRow).not.toContain("data-identity-avatar");
    expect(inviteRow).not.toContain("data-settings-drill-leading");
  });

  it("does not keep a Team-Invite dark menu twin", () => {
    const src = readFileSync("src/components/settings/team-invite-form.tsx", "utf8");
    expect(src).toContain('import { Select } from "@/components/ui/select"');
    expect(src).toContain('htmlFor="team-invite-role"');
    expect(src).toContain('htmlFor="team-invite-email"');
    expect(src).not.toContain('import { Label } from "@/components/ui/label"');
    expect(src).toContain("SETTINGS_DIALOG_LABEL_CLASS");
    expect(src).toContain("SETTINGS_DIALOG_ERROR_CLASS");
    expect(src).toContain("teamInviteUserError");
    expect(src).toContain("DialogFooter");
    expect(src).toContain('presentation="sheet"');
    expect(src).not.toContain("<select");
    expect(src).not.toContain("formControlClass");
    expect(src).not.toContain("bg-ink");
    expect(src).not.toContain('tone="error"');
    expect(src).not.toContain("error?.message");
    expect(SETTINGS_DIALOG_LABEL_CLASS).not.toContain("t-label");
    expect(SETTINGS_DIALOG_ERROR_CLASS).toBeTruthy();
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).toContain("bg-surface");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).not.toContain("bg-ink");
  });
});
