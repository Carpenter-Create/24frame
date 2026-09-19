"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { LegalEntityEditor } from "@/components/settings/legal-entity-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import { cn } from "@/lib/cn";
import { SETTINGS_DRILL_LIST_CLASS, SETTINGS_SECTION_LABEL_CLASS } from "@/lib/settings";
import {
  LEGAL_ENTITIES,
  ENTITY_LIST_ACTIONS_CLASS,
  ENTITY_LIST_CLASS,
  ENTITY_LIST_ITEMS_CLASS,
  ENTITY_LIST_META_CLASS,
  ENTITY_LIST_NAME_CLASS,
  ENTITY_LIST_NAME_ROW_CLASS,
  ENTITY_LIST_ROW_CLASS,
  ENTITY_LIST_VALUE_CLASS,
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
  const router = useRouter();

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
    <div data-settings-entities="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className={SETTINGS_SECTION_LABEL_CLASS}>{LEGAL_ENTITIES.title}</h2>
        {canManage ? (
          <>
            <Button
              type="button"
              data-entity-add-cta=""
              className="md:hidden"
              onClick={() => router.push(LEGAL_ENTITIES.addHref)}
            >
              {LEGAL_ENTITIES.add}
            </Button>
            <Button
              type="button"
              data-entity-add-cta=""
              className="hidden md:inline-flex"
              onClick={openAdd}
            >
              {LEGAL_ENTITIES.add}
            </Button>
          </>
        ) : null}
      </div>

      {!canManage ? (
        <p className="t-body-sm text-ink-3">{LEGAL_ENTITIES.forbidden}</p>
      ) : null}

      {entities.length === 0 ? (
        <p className="t-body text-ink-2">{LEGAL_ENTITIES.empty}</p>
      ) : (
        <div data-entity-list="" className={ENTITY_LIST_CLASS}>
          <ul className={ENTITY_LIST_ITEMS_CLASS}>
            {entities.map((entity) => (
              <li
                key={entity.id}
                data-entity-id={entity.id}
                className={canManage ? undefined : ENTITY_LIST_ROW_CLASS}
              >
                {canManage ? (
                  <div className={`md:hidden ${SETTINGS_DRILL_LIST_CLASS}`}>
                    <SettingsDrillRow
                      kind={`entity-${entity.id}`}
                      label={entity.name}
                      value={entityMetaLine(entity.entityType, entity.jurisdiction)}
                      href={entityEditHref(entity.id)}
                      badge={
                        entity.isDefault ? (
                          <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
                        ) : undefined
                      }
                    />
                  </div>
                ) : (
                  <EntitySummary entity={entity} />
                )}
                {canManage ? (
                  <div className={cn(ENTITY_LIST_ROW_CLASS, "max-md:hidden")}>
                    <div data-entity-name-row="" className={ENTITY_LIST_NAME_ROW_CLASS}>
                      <span data-entity-field="name" className={ENTITY_LIST_NAME_CLASS}>
                        <span className={ENTITY_LIST_VALUE_CLASS}>{entity.name}</span>
                        {entity.isDefault ? (
                          <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
                        ) : null}
                      </span>
                      <span data-entity-field="actions" className={ENTITY_LIST_ACTIONS_CLASS}>
                        <Button
                          type="button"
                          variant="ghost"
                          data-entity-edit=""
                          onClick={() => openEdit(entity)}
                        >
                          {LEGAL_ENTITIES.edit}
                        </Button>
                      </span>
                    </div>
                    <p data-entity-field="meta" className={ENTITY_LIST_META_CLASS}>
                      {entityMetaLine(entity.entityType, entity.jurisdiction)}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

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

function EntitySummary({ entity }: { entity: LegalEntityRow }) {
  return (
    <>
      <span data-entity-field="name" className={ENTITY_LIST_NAME_CLASS}>
        <span className={ENTITY_LIST_VALUE_CLASS}>{entity.name}</span>
        {entity.isDefault ? (
          <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
        ) : null}
      </span>
      <p data-entity-field="meta" className={ENTITY_LIST_META_CLASS}>
        {entityMetaLine(entity.entityType, entity.jurisdiction)}
      </p>
    </>
  );
}
