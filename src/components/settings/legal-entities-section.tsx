"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  SettingsDrillRow,
  SettingsGroupList,
  SettingsGroupRow,
} from "@/components/settings/settings-drill";
import { LegalEntityEditor } from "@/components/settings/legal-entity-editor";
import {
  AppSheetFrame,
  HouseDrawerFrame,
  HouseOverlayHead,
  useHouseDesktop,
} from "@/components/chrome/house-overlay";
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
  const desktop = useHouseDesktop();
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

      {canManage && mode ? (
        <LegalEntityHost
          desktop={desktop}
          title={mode === "edit" ? LEGAL_ENTITIES.edit : LEGAL_ENTITIES.add}
          onClose={closeModal}
        >
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
        </LegalEntityHost>
      ) : null}
    </div>
  );
}

function LegalEntityHost({
  desktop,
  title,
  onClose,
  children,
}: {
  desktop: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const head = <HouseOverlayHead title={title} closeLabel="Close" onClose={onClose} />;
  if (desktop) {
    return (
      <HouseDrawerFrame label={title} onClose={onClose} closeLabel="Close">
        {head}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </HouseDrawerFrame>
    );
  }
  return (
    <AppSheetFrame span="full" label={title}>
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-6)] overflow-y-auto p-[var(--space-4)] pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {head}
        {children}
      </div>
    </AppSheetFrame>
  );
}
