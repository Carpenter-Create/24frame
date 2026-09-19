import { redirect } from "next/navigation";

import { LegalEntityEditor } from "@/components/settings/legal-entity-editor";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { loadOrganizationWriteAccess } from "@/components/settings/organization-load";
import { LEGAL_ENTITIES } from "@/lib/legal-entities";
import { SETTINGS } from "@/lib/settings";

export default async function OrganizationEntityNewPage() {
  const loaded = await loadOrganizationWriteAccess();
  if (!loaded) redirect("/login");
  if (!loaded.ctx.activeOrg) redirect(SETTINGS.organizationHref);

  return (
    <SettingsEditPane
      title={LEGAL_ENTITIES.add}
      pathname={LEGAL_ENTITIES.addHref}
      helper={LEGAL_ENTITIES.addHelper}
      hub="organization"
    >
      {loaded.canEdit ? (
        <LegalEntityEditor orgId={loaded.ctx.activeOrg.id} mode="add" chrome="pane" />
      ) : (
        <p className="t-body-sm text-ink-3">{LEGAL_ENTITIES.forbidden}</p>
      )}
    </SettingsEditPane>
  );
}
