import { redirect } from "next/navigation";

import { LegalEntityEditor } from "@/components/settings/legal-entity-editor";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { loadOrganizationWriteAccess } from "@/components/settings/organization-load";
import { LEGAL_ENTITIES, entityEditHref } from "@/lib/legal-entities";
import { SETTINGS } from "@/lib/settings";

export default async function OrganizationEntityEditPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const loaded = await loadOrganizationWriteAccess();
  if (!loaded) redirect("/login");
  if (!loaded.ctx.activeOrg) redirect(SETTINGS.organizationHref);

  const entity = loaded.entities.find((row) => row.id === entityId);
  if (!entity) redirect(SETTINGS.organizationHref);

  return (
    <SettingsEditPane
      title={LEGAL_ENTITIES.editTitle}
      pathname={entityEditHref(entity.id)}
      helper={LEGAL_ENTITIES.helper}
      hub="organization"
    >
      {loaded.canEdit ? (
        <LegalEntityEditor
          orgId={loaded.ctx.activeOrg.id}
          mode="edit"
          entity={entity}
          chrome="pane"
        />
      ) : (
        <p className="t-body-sm text-ink-3">{LEGAL_ENTITIES.forbidden}</p>
      )}
    </SettingsEditPane>
  );
}
