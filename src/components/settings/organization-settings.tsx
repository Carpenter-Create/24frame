import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody } from "@/components/ui/card";
import { TeamInviteForm } from "@/components/settings/team-invite-form";
import { LegalEntitiesSection } from "@/components/settings/legal-entities-section";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";
import type { OrgRole } from "@/lib/org-roles";
import type { EntityScope, LegalEntityRow } from "@/lib/legal-entities";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { CompanyProfileForm } from "@/app/(app)/account/company-profile-form";

export async function OrganizationSettings() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  let canEditCompany = false;
  let canInvite = false;
  let members: {
    userId: string;
    email: string;
    role: OrgRole;
    name: string | null;
    sentAt: string | null;
    acceptedAt: string;
  }[] = [];
  let pending: { id: string; email: string; role: OrgRole; sentAt: string; entityScope: EntityScope }[] = [];
  let entities: LegalEntityRow[] = [];

  if (ctx.activeOrg) {
    const supabase = await createClient();
    const orgId = ctx.activeOrg.id;
    const [canEditRes, canInviteRes, teamRes, pendingRes, entitiesRes] = await Promise.all([
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
      supabase.rpc("org_team", { p_org: orgId }),
      supabase.rpc("org_pending_invites", { p_org: orgId }),
      supabase.rpc("org_legal_entities", { p_org: orgId }),
    ]);
    canEditCompany = canEditRes.data === true;
    canInvite = canInviteRes.data === true;
    members = (teamRes.data ?? []).map((row) => ({
      userId: row.user_id,
      email: row.email ?? "\u2014",
      role: row.role,
      name: row.display_name,
      sentAt: row.invited_at,
      acceptedAt: row.joined_at,
    }));
    pending = (pendingRes.data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      sentAt: row.created_at,
      entityScope: row.entity_scope,
    }));
    entities = (entitiesRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      entityType: row.entity_type,
      jurisdiction: row.jurisdiction,
      isDefault: row.is_default,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  return (
    <div data-settings-page="" data-settings-hub="organization" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="organization" className={SETTINGS_SECTION_CLASS}>
        <h1 className={SETTINGS_PANE_TITLE_CLASS}>{settingsPaneTitle("organization")}</h1>
        {ctx.activeOrg ? (
          <>
            <section
              data-settings-section="company"
              className={SETTINGS_SECTION_CLASS}
            >
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
            <section
              data-settings-section="entities"
              className={SETTINGS_SECTION_CLASS}
            >
              <LegalEntitiesSection
                orgId={ctx.activeOrg.id}
                canManage={canEditCompany}
                entities={entities}
              />
            </section>
            <section
              data-settings-section="team"
              className={SETTINGS_SECTION_CLASS}
            >
              <TeamInviteForm
                orgId={ctx.activeOrg.id}
                canInvite={canInvite}
                members={members}
                pending={pending}
                entities={entities}
              />
            </section>
          </>
        ) : (
          <HouseEmpty>{SETTINGS.organizationEmpty}</HouseEmpty>
        )}
      </section>
    </div>
  );
}
