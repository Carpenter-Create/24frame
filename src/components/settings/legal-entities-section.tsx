"use client";

import { useState } from "react";

import {
  SettingsDrillRow,
  SettingsGroupList,
  SettingsGroupRow,
} from "@/components/settings/settings-drill";
import { LegalEntityEditor } from "@/components/settings/legal-entity-editor";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SETTINGS_DRILL_VALUE_CLASS, SETTINGS_SECTION_CLASS } from "@/lib/settings";
import {
  LEGAL_ENTITIES,
  entityEditHref,
  entityMetaLine,
  type LegalEntityRow,
} from "@/lib/legal-entities";

export function LegalEntitiesSection({
  orgId,
  canManage,
  entities,
}: {
  orgId: string;
  canManage: boolean;
  entities: LegalEntityRow[];
}) {
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<LegalEntityRow | null>(null);
  const [added, setAdded] = useState(false);

  function closeModal() {
    setMode(null);
    setEditing(null);
  }

  function openAdd() {
    setAdded(false);
    setEditing(null);
    setMode("add");
  }

  function openEdit(entity: LegalEntityRow) {
    setAdded(false);
    setEditing(entity);
    setMode("edit");
  }

  return (
    <div data-settings-entities="" className={SETTINGS_SECTION_CLASS}>
      <SettingsGroupList label={LEGAL_ENTITIES.title} list="entity">
        {entities.length === 0 ? (
          <SettingsGroupRow>
            <div className="py-[var(--space-3)]">
              <span className={SETTINGS_DRILL_VALUE_CLASS}>{LEGAL_ENTITIES.empty}</span>
            </div>
          </SettingsGroupRow>
        ) : (
          entities.map((entity) => (
            <SettingsGroupRow key={entity.id}>
              <div data-entity-id={entity.id}>
                <SettingsDrillRow
                  kind={`entity-${entity.id}`}
                  label={entity.name}
                  value={entityMetaLine(entity.entityType, entity.jurisdiction)}
                  href={canManage ? entityEditHref(entity.id) : undefined}
                  onClick={canManage ? () => openEdit(entity) : undefined}
                  readOnly={!canManage}
                  cta={canManage ? "entity-edit" : undefined}
                  badge={
                    entity.isDefault ? (
                      <span data-default-chip="" className="t-label text-ink-3">
                        {LEGAL_ENTITIES.default}
                      </span>
                    ) : undefined
                  }
                />
              </div>
            </SettingsGroupRow>
          ))
        )}
        {canManage ? (
          <SettingsGroupRow>
            <SettingsDrillRow
              kind="entity-add"
              label={LEGAL_ENTITIES.addRow}
              href={LEGAL_ENTITIES.addHref}
              onClick={openAdd}
              tone="accent"
              cta="entity-add"
            />
          </SettingsGroupRow>
        ) : null}
      </SettingsGroupList>

      {!canManage ? (
        <p className="t-body-sm text-ink-3">{LEGAL_ENTITIES.forbidden}</p>
      ) : null}

      {added ? <InlineNotice>{LEGAL_ENTITIES.added}</InlineNotice> : null}

      {canManage ? (
        <Dialog
          open={mode !== null}
          onClose={closeModal}
          title={mode === "edit" ? LEGAL_ENTITIES.edit : LEGAL_ENTITIES.add}
          size="md"
        >
          {mode ? (
            <LegalEntityEditor
              key={mode === "edit" ? editing?.id ?? "edit" : "add"}
              orgId={orgId}
              mode={mode}
              entity={mode === "edit" ? editing ?? undefined : undefined}
              chrome="dialog"
              onClose={closeModal}
              onSaved={() => {
                if (mode === "add") setAdded(true);
                closeModal();
              }}
            />
          ) : null}
        </Dialog>
      ) : null}
    </div>
  );
}
