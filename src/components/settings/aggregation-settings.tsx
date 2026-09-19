import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody } from "@/components/ui/card";
import { OrgTeamForm } from "@/components/settings/org-team-form";
import {
  ORG_TEAM_ROLES,
  ORG_TEAM_STATUSES,
  type OrgTeamMember,
  type OrgTeamRole,
  type OrgTeamStatus,
} from "@/lib/org-team";
import { SETTINGS, SETTINGS_PANE_CLASS, SETTINGS_SECTION_CLASS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { CompanyProfileForm } from "@/app/(app)/account/company-profile-form";

function isOrgTeamRole(value: string): value is OrgTeamRole {
  return (ORG_TEAM_ROLES as readonly string[]).includes(value);
}

function isOrgTeamStatus(value: string): value is OrgTeamStatus {
  return (ORG_TEAM_STATUSES as readonly string[]).includes(value);
}

function toTeamMembers(
  rows: {
    membership_id: string;
    user_id: string;
    email: string | null;
    display_name: string | null;
    role: string;
    status: string;
  }[],
): OrgTeamMember[] {
  return rows.flatMap((row) => {
    if (!isOrgTeamRole(row.role) || !isOrgTeamStatus(row.status)) return [];
    return [
      {
        membershipId: row.membership_id,
        userId: row.user_id,
        email: row.email ?? "",
        displayName: row.display_name,
        role: row.role,
        status: row.status,
      },
    ];
  });
}

// Aggregation pane — company Settings + Org Team. HouseEmpty when there
// is no org. Team is manage_team only. Not a CMS.
export async function AggregationSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  let canEditCompany = false;
  let canManageTeam = false;
  let team: OrgTeamMember[] = [];
  if (ctx.activeOrg) {
    const supabase = await createClient();
    const orgId = ctx.activeOrg.id;
    const [settingsRes, teamRes] = await Promise.all([
      supabase.rpc("member_can", {
        p_uid: ctx.user.id,
        p_org: orgId,
        p_capability: "manage_settings",
      }),
      supabase.rpc("member_can", {
        p_uid: ctx.user.id,
        p_org: orgId,
        p_capability: "manage_team",
      }),
    ]);
    canEditCompany = settingsRes.data === true;
    canManageTeam = teamRes.data === true;
    if (canManageTeam) {
      const { data } = await supabase.rpc("org_team_directory", { p_org: orgId });
      team = toTeamMembers(data ?? []);
    }
  }

  return (
    <div data-settings-page="" data-settings-hub="aggregation" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="aggregation" className={SETTINGS_SECTION_CLASS}>
        <h1 className="t-section text-ink">{SETTINGS.title}</h1>
        <h2 className="t-section text-ink">{SETTINGS.aggregation}</h2>
        {ctx.activeOrg ? (
          <>
            <section
              data-settings-section="company"
              className={SETTINGS_SECTION_CLASS}
            >
              <h3 className="t-section text-ink">{SETTINGS.company}</h3>
              <Card>
                <CardBody>
                  <CompanyProfileForm
                    orgId={ctx.activeOrg.id}
                    name={ctx.activeOrg.name}
                    canEdit={canEditCompany}
                  />
                </CardBody>
              </Card>
            </section>
            {canManageTeam ? (
              <section
                data-settings-section="team"
                className={SETTINGS_SECTION_CLASS}
              >
                <h3 className="t-section text-ink">{SETTINGS.team}</h3>
                <Card>
                  <CardBody>
                    <OrgTeamForm orgId={ctx.activeOrg.id} members={team} />
                  </CardBody>
                </Card>
              </section>
            ) : null}
          </>
        ) : (
          <HouseEmpty>{SETTINGS.aggregationEmpty}</HouseEmpty>
        )}
      </section>
    </div>
  );
}
