import { redirect } from "next/navigation";

import { CompanyNameEditor } from "@/components/settings/company-name-editor";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { loadOrganizationWriteAccess } from "@/components/settings/organization-load";
import { COMPANY_PROFILE } from "@/lib/account-profile";
import { SETTINGS } from "@/lib/settings";

export default async function OrganizationCompanyPage() {
  const loaded = await loadOrganizationWriteAccess();
  if (!loaded) redirect("/login");
  if (!loaded.ctx.activeOrg) redirect(SETTINGS.organizationHref);

  return (
    <SettingsEditPane
      title={COMPANY_PROFILE.nameLabel}
      pathname={COMPANY_PROFILE.editHref}
      helper={COMPANY_PROFILE.subtitle}
      hub="organization"
    >
      {loaded.canEdit ? (
        <CompanyNameEditor
          orgId={loaded.ctx.activeOrg.id}
          name={loaded.ctx.activeOrg.name}
          chrome="pane"
        />
      ) : (
        <p className="t-body-sm text-ink-3">{COMPANY_PROFILE.forbidden}</p>
      )}
    </SettingsEditPane>
  );
}
