import { redirect } from "next/navigation";

import { RolesCatalog } from "@/components/settings/roles-catalog";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import {
  SETTINGS,
  SETTINGS_CONTENT_MEASURE_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";
import {
  ROLES_CATALOG,
  systemRoleCatalogRows,
  type RoleCatalogRow,
} from "@/lib/org-roles";
import { teamRowInitials, teamIdentityName } from "@/lib/account-invite";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

// Roles catalog: /settings/organization/roles
// Sibling door off Team. System roles + custom roles.
// Phone stacks each role. Desktop keeps the column row.
export default async function SettingsOrganizationRolesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg) redirect("/settings/organization");

  const supabase = await createClient();
  const orgId = ctx.activeOrg.id;

  const [canManageRes, teamRes, customRolesRes] = await Promise.all([
    supabase.rpc("member_can", {
      p_uid: ctx.user.id,
      p_org: orgId,
      p_capability: "manage_team",
    }),
    supabase.rpc("org_team", { p_org: orgId }),
    supabase.rpc("list_org_custom_roles", { p_org: orgId }),
  ]);

  const canManage = canManageRes.data === true;
  const teamMembers = teamRes.data ?? [];

  const membersByRole: Record<string, { initials: string }[]> = {};
  for (const m of teamMembers) {
    const role = m.role;
    if (!membersByRole[role]) membersByRole[role] = [];
    membersByRole[role].push({
      initials: teamRowInitials(
        teamIdentityName(m.display_name),
        m.email ?? "",
      ),
    });
  }

  const systemRows = systemRoleCatalogRows(membersByRole);

  const customRows: RoleCatalogRow[] = (customRolesRes.data ?? []).map((r) => ({
    key: `custom:${r.id}`,
    name: r.name,
    description: r.description ?? "",
    type: "custom" as const,
    memberCount: Number(r.member_count ?? 0),
    memberInitials: [],
    status: "active" as const,
  }));

  return (
    <div data-settings-page="" data-settings-hub="organization" className={SETTINGS_PANE_CLASS}>
      <section
        data-settings-section="roles"
        className={`${SETTINGS_SECTION_CLASS} ${SETTINGS_CONTENT_MEASURE_CLASS}`}
      >
        <SettingsPageLead title={ROLES_CATALOG.title} pathname={SETTINGS.rolesHref} />
        <RolesCatalog
          orgId={orgId}
          canManage={canManage}
          systemRows={systemRows}
          customRows={customRows}
        />
      </section>
    </div>
  );
}
